using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Kanabco.Tracking;

/// <summary>Add-to-carts and checkouts: written by the storefront, marked purchased by the order code, read by the Tracking tab.</summary>
public sealed partial class TrackingService(
    TrackingDbContext db, ITrackingLookups lookups, TrackingOptions options, TimeProvider clock, ILogger<TrackingService> log)
    : ITrackingConversions
{
    public const int MaxItems = 50;
    public const int MaxQuantity = 100;

    // ---------- Written by the storefront ----------

    /// <summary>Stores one event; false when it is not a valid one. The same event sent twice is stored once.</summary>
    public async Task<bool> RecordAsync(TrackEventRequest req, int? customerId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(req);
        if (!TrackingEventTypes.IsValid(req.EventType) || req.EventId == Guid.Empty || req.VisitorId == Guid.Empty)
        {
            return false;
        }
        if (req.Items is null || req.Items.Count is 0 or > MaxItems)
        {
            return false;
        }
        var checkout = req.EventType == TrackingEventTypes.InitiateCheckout;
        if (checkout && (req.CheckoutToken is not { } token || token == Guid.Empty))
        {
            return false;
        }
        if (await db.TrackingEvents.AnyAsync(e => e.EventId == req.EventId, ct))
        {
            return true;
        }

        var lines = req.Items.Where(i => i.Quantity is >= 1 and <= MaxQuantity).ToList();
        var prices = await lookups.GetPricesAsync([.. lines.Select(i => (i.ProductId, i.VariantId)).Distinct()], ct);
        var priced = lines.Where(l => prices.ContainsKey((l.ProductId, l.VariantId))).ToList();
        if (priced.Count == 0)
        {
            return false;
        }

        for (var attempt = 0; ; attempt++)
        {
            var now = Now();
            var visitor = await TouchVisitorAsync(req.VisitorId, customerId, req.Utm, now, ct);
            var ev = new TrackingEvent
            {
                EventId = req.EventId,
                EventType = req.EventType!,
                Visitor = visitor,
                CustomerId = customerId,
                SessionId = req.SessionId is { } s && s != Guid.Empty ? s : null,
                CheckoutToken = checkout ? req.CheckoutToken : null,
                PageUrl = Clip(req.PageUrl, 500),
                UtmSource = Clip(req.Utm?.Source, 100),
                UtmMedium = Clip(req.Utm?.Medium, 100),
                UtmCampaign = Clip(req.Utm?.Campaign, 200),
                Fbclid = Clip(req.Utm?.Fbclid, 500),
                CreatedAtUtc = now,
            };
            foreach (var line in priced)
            {
                var p = prices[(line.ProductId, line.VariantId)];
                ev.Items.Add(new TrackingEventItem
                {
                    ProductId = line.ProductId,
                    VariantId = line.VariantId,
                    ProductName = Clip(p.Name, 200) ?? "",
                    VariantLabel = Clip(p.VariantLabel, 200),
                    Quantity = line.Quantity,
                    UnitPrice = p.UnitPrice,
                });
            }
            ev.ItemCount = ev.Items.Sum(i => i.Quantity);
            ev.TotalValue = ev.Items.Sum(i => i.UnitPrice * i.Quantity);
            db.TrackingEvents.Add(ev);
            try
            {
                await db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException) when (attempt == 0)
            {
                // Sent twice at once, or this visitor's first two events arrived together: the other
                // request stored the event or created the visitor row, so look again.
                db.ChangeTracker.Clear();
                if (await db.TrackingEvents.AnyAsync(e => e.EventId == req.EventId, ct))
                {
                    return true;
                }
                continue;
            }

            if (checkout && ev.SessionId is { } session)
            {
                // The shopper changed the cart and opened checkout again: the earlier checkout of this
                // visit is replaced, not abandoned.
                await db.TrackingEvents
                    .Where(e => e.EventType == TrackingEventTypes.InitiateCheckout && e.SessionId == session
                        && e.VisitorId == ev.VisitorId && e.Id != ev.Id && e.OrderId == null
                        && e.SupersededAtUtc == null && e.CreatedAtUtc <= ev.CreatedAtUtc)
                    .ExecuteUpdateAsync(u => u.SetProperty(e => e.SupersededAtUtc, (DateTime?)now), ct);
            }
            return true;
        }
    }

    /// <summary>Links the visitor to the logged-in customer, and keeps contact details a guest typed at checkout.</summary>
    public async Task IdentifyAsync(IdentifyRequest req, int? customerId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(req);
        if (req.VisitorId == Guid.Empty)
        {
            return;
        }
        for (var attempt = 0; ; attempt++)
        {
            var visitor = await TouchVisitorAsync(req.VisitorId, customerId, null, Now(), ct);
            if (!string.IsNullOrWhiteSpace(req.Name))
            {
                visitor.ContactName = Clip(req.Name.Trim(), 150);
            }
            if (!string.IsNullOrWhiteSpace(req.Phone))
            {
                visitor.ContactPhone = Clip(req.Phone.Trim(), 30);
            }
            if (!string.IsNullOrWhiteSpace(req.Email))
            {
                visitor.ContactEmail = Clip(req.Email.Trim(), 200);
            }
            try
            {
                await db.SaveChangesAsync(ct);
                return;
            }
            catch (DbUpdateException) when (attempt == 0)
            {
                db.ChangeTracker.Clear();
            }
        }
    }

    // ---------- Called by the order code ----------

    public async Task<bool> MarkPurchasedAsync(Guid? checkoutToken, int orderId, int? customerId, CancellationToken ct = default)
    {
        try
        {
            if (checkoutToken is not { } token || token == Guid.Empty)
            {
                return false;
            }
            var checkouts = await db.TrackingEvents
                .Where(e => e.CheckoutToken == token && e.EventType == TrackingEventTypes.InitiateCheckout)
                .ToListAsync(ct);
            if (checkouts.Count == 0)
            {
                return false;
            }
            foreach (var c in checkouts.Where(c => c.OrderId is null))
            {
                c.OrderId = orderId;
                c.SupersededAtUtc = null;
            }
            var visitorId = checkouts[0].VisitorId;
            if (customerId is { } cid)
            {
                var visitor = await db.TrackingVisitors.SingleOrDefaultAsync(v => v.VisitorId == visitorId, ct);
                if (visitor is { CustomerId: null })
                {
                    visitor.CustomerId = cid;
                }
            }
            await db.SaveChangesAsync(ct);

            // The shopper bought: their other open checkouts (another tab, an earlier cart) are not
            // abandoned carts to follow up.
            var now = Now();
            var since = now - options.PurchaseClosesCheckoutsWithin;
            await db.TrackingEvents
                .Where(e => e.EventType == TrackingEventTypes.InitiateCheckout && e.VisitorId == visitorId
                    && e.CheckoutToken != token && e.OrderId == null && e.SupersededAtUtc == null && e.CreatedAtUtc >= since)
                .ExecuteUpdateAsync(u => u.SetProperty(e => e.SupersededAtUtc, (DateTime?)now), ct);
            return true;
        }
        catch (Exception ex) when (!ct.IsCancellationRequested)
        {
            LogConversionFailed(log, ex, orderId);
            return false;
        }
    }

    // ---------- Read by the Tracking tab ----------

    public async Task<TrackingSummaryDto> GetSummaryAsync(TrackingQuery q, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(q);
        var (fromUtc, toUtc) = Range(q);
        var inRange = db.TrackingEvents.AsNoTracking().Where(e => e.CreatedAtUtc >= fromUtc && e.CreatedAtUtc < toUtc);
        var addToCarts = inRange.Where(e => e.EventType == TrackingEventTypes.AddToCart);
        var checkouts = inRange.Where(e => e.EventType == TrackingEventTypes.InitiateCheckout && e.SupersededAtUtc == null);

        return new TrackingSummaryDto(
            AddToCarts: await addToCarts.CountAsync(ct),
            AddToCartVisitors: await addToCarts.Select(e => e.VisitorId).Distinct().CountAsync(ct),
            InitiatedCheckouts: await checkouts.CountAsync(ct),
            CheckoutValue: await checkouts.SumAsync(e => (decimal?)e.TotalValue, ct) ?? 0m,
            PurchasedCheckouts: await checkouts.CountAsync(e => e.OrderId != null, ct));
    }

    public async Task<PagedResult<AddToCartRowDto>> GetAddToCartsAsync(TrackingQuery q, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(q);
        var (fromUtc, toUtc) = Range(q);
        var rows = db.TrackingEventItems.AsNoTracking()
            .Join(db.TrackingEvents.AsNoTracking(), i => i.TrackingEventId, e => e.Id, (i, e) => new { i, e })
            .Where(x => x.e.EventType == TrackingEventTypes.AddToCart && x.e.CreatedAtUtc >= fromUtc && x.e.CreatedAtUtc < toUtc);

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var term = q.Search.Trim();
            var ids = await lookups.SearchCustomerIdsAsync(term, ct);
            rows = rows.Where(x => x.i.ProductName.Contains(term)
                || (x.e.Visitor.ContactName != null && x.e.Visitor.ContactName.Contains(term))
                || (x.e.Visitor.ContactPhone != null && x.e.Visitor.ContactPhone.Contains(term))
                || (x.e.Visitor.ContactEmail != null && x.e.Visitor.ContactEmail.Contains(term))
                || (x.e.CustomerId != null && ids.Contains(x.e.CustomerId.Value))
                || (x.e.Visitor.CustomerId != null && ids.Contains(x.e.Visitor.CustomerId.Value)));
        }

        var total = await rows.CountAsync(ct);
        var page = await rows
            .OrderByDescending(x => x.e.CreatedAtUtc).ThenByDescending(x => x.i.Id)
            .Skip((q.SafePage - 1) * q.SafePageSize).Take(q.SafePageSize)
            .Select(x => new { Item = x.i, x.e.Id, x.e.CreatedAtUtc, x.e.CustomerId, x.e.UtmSource, x.e.UtmCampaign, x.e.Visitor })
            .ToListAsync(ct);

        var customers = await lookups.GetCustomersAsync(
            [.. page.Select(r => r.CustomerId ?? r.Visitor.CustomerId).OfType<int>().Distinct()], ct);

        var result = page.Select(r => new AddToCartRowDto(
            r.Id, AsUtc(r.CreatedAtUtc), BuildPerson(r.CustomerId, r.Visitor, customers), ToItemRow(r.Item),
            r.Item.UnitPrice * r.Item.Quantity, r.UtmSource, r.UtmCampaign)).ToList();
        return new PagedResult<AddToCartRowDto>(result, total, q.SafePage, q.SafePageSize);
    }

    public async Task<PagedResult<CheckoutRowDto>> GetCheckoutsAsync(TrackingQuery q, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(q);
        var (fromUtc, toUtc) = Range(q);
        var rows = db.TrackingEvents.AsNoTracking()
            .Where(e => e.EventType == TrackingEventTypes.InitiateCheckout && e.SupersededAtUtc == null
                && e.CreatedAtUtc >= fromUtc && e.CreatedAtUtc < toUtc);

        if (q.Status == "purchased")
        {
            rows = rows.Where(e => e.OrderId != null);
        }
        else if (q.Status == "not_purchased")
        {
            rows = rows.Where(e => e.OrderId == null);
        }

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var term = q.Search.Trim();
            var ids = await lookups.SearchCustomerIdsAsync(term, ct);
            rows = rows.Where(e => e.Items.Any(i => i.ProductName.Contains(term))
                || (e.Visitor.ContactName != null && e.Visitor.ContactName.Contains(term))
                || (e.Visitor.ContactPhone != null && e.Visitor.ContactPhone.Contains(term))
                || (e.Visitor.ContactEmail != null && e.Visitor.ContactEmail.Contains(term))
                || (e.CustomerId != null && ids.Contains(e.CustomerId.Value))
                || (e.Visitor.CustomerId != null && ids.Contains(e.Visitor.CustomerId.Value)));
        }

        var total = await rows.CountAsync(ct);
        var page = await rows
            .OrderByDescending(e => e.CreatedAtUtc).ThenByDescending(e => e.Id)
            .Skip((q.SafePage - 1) * q.SafePageSize).Take(q.SafePageSize)
            .Include(e => e.Items)
            .Include(e => e.Visitor)
            .AsSplitQuery()
            .ToListAsync(ct);

        var customers = await lookups.GetCustomersAsync(
            [.. page.Select(e => e.CustomerId ?? e.Visitor.CustomerId).OfType<int>().Distinct()], ct);

        var result = page.Select(e => new CheckoutRowDto(
            e.Id, AsUtc(e.CreatedAtUtc), BuildPerson(e.CustomerId, e.Visitor, customers),
            [.. e.Items.OrderBy(i => i.Id).Select(ToItemRow)], e.ItemCount, e.TotalValue, e.OrderId,
            e.UtmSource, e.UtmCampaign)).ToList();
        return new PagedResult<CheckoutRowDto>(result, total, q.SafePage, q.SafePageSize);
    }

    // ---------- Helpers ----------

    private async Task<TrackingVisitor> TouchVisitorAsync(Guid visitorId, int? customerId, TrackUtmDto? utm, DateTime now, CancellationToken ct)
    {
        var visitor = await db.TrackingVisitors.FirstOrDefaultAsync(v => v.VisitorId == visitorId, ct);
        if (visitor is null)
        {
            visitor = new TrackingVisitor
            {
                VisitorId = visitorId,
                FirstSeenUtc = now,
                FirstUtmSource = Clip(utm?.Source, 100),
                FirstUtmMedium = Clip(utm?.Medium, 100),
                FirstUtmCampaign = Clip(utm?.Campaign, 200),
            };
            db.TrackingVisitors.Add(visitor);
        }
        visitor.LastSeenUtc = now;
        if (customerId is not null)
        {
            visitor.CustomerId = customerId;
        }
        return visitor;
    }

    private (DateTime FromUtc, DateTime ToUtc) Range(TrackingQuery q) =>
        TrackingDates.Range(q.From, q.To, TrackingDates.Zone(options.TimeZoneId), clock.GetUtcNow());

    private DateTime Now() => clock.GetUtcNow().UtcDateTime;

    internal static TrackingPersonDto BuildPerson(int? customerId, TrackingVisitor v, IReadOnlyDictionary<int, CustomerInfo> customers)
    {
        var code = v.VisitorId.ToString("N")[..6].ToUpperInvariant();
        var id = customerId ?? v.CustomerId;
        if (id is { } cid && customers.TryGetValue(cid, out var c))
        {
            return new TrackingPersonDto("customer", cid, c.Name, c.Phone, c.Email, code);
        }
        return new TrackingPersonDto("guest", null, v.ContactName ?? $"Guest {code}", v.ContactPhone, v.ContactEmail, code);
    }

    private static TrackingItemRowDto ToItemRow(TrackingEventItem i) => new(i.ProductId, i.ProductName, i.VariantLabel, i.Quantity, i.UnitPrice);

    /// <summary>Always send times marked UTC, so the browser converts them to Cairo time.</summary>
    internal static DateTime AsUtc(DateTime value) => DateTime.SpecifyKind(value, DateTimeKind.Utc);

    internal static string? Clip(string? value, int max) =>
        string.IsNullOrEmpty(value) ? null : value.Length <= max ? value : value[..max];

    [LoggerMessage(Level = LogLevel.Warning, Message = "Tracking could not mark the checkout of order {OrderId} purchased")]
    private static partial void LogConversionFailed(ILogger logger, Exception ex, int orderId);
}
