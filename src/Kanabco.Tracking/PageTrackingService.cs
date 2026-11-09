using Microsoft.EntityFrameworkCore;

namespace Kanabco.Tracking;

/// <summary>Page views, time on page and homepage clicks; the Product Pages and Homepage sections.</summary>
public sealed class PageTrackingService(TrackingDbContext db, ITrackingLookups lookups, TrackingOptions options, TimeProvider clock)
{
    public const int MaxActiveSeconds = 4 * 60 * 60;
    public const string NotMeasured = "Not measured";

    // ---------- Written by the storefront ----------

    public async Task<bool> RecordPageViewAsync(PageViewRequest req, int? customerId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(req);
        if (req.PageViewId == Guid.Empty || req.VisitorId == Guid.Empty || req.SessionId == Guid.Empty)
        {
            return false;
        }
        if (!PageTypes.IsValid(req.PageType) || (req.PageType == PageTypes.Product && req.ProductId is null))
        {
            return false;
        }
        if (await db.TrackingPageViews.AnyAsync(p => p.PageViewId == req.PageViewId, ct))
        {
            return true;
        }
        db.TrackingPageViews.Add(new TrackingPageView
        {
            PageViewId = req.PageViewId,
            VisitorId = req.VisitorId,
            SessionId = req.SessionId,
            CustomerId = customerId,
            PageType = req.PageType!,
            ProductId = req.PageType == PageTypes.Product ? req.ProductId : null,
            Path = TrackingService.Clip(req.Path, 300),
            IsEntry = req.IsEntry,
            ReferrerHost = TrackingService.Clip(req.ReferrerHost, 200),
            UtmSource = TrackingService.Clip(req.Utm?.Source, 100),
            UtmCampaign = TrackingService.Clip(req.Utm?.Campaign, 200),
            CreatedAtUtc = clock.GetUtcNow().UtcDateTime,
        });
        return await SaveOnceAsync(() => db.TrackingPageViews.AnyAsync(p => p.PageViewId == req.PageViewId, ct), ct);
    }

    /// <summary>The browser can report the same page more than once; the largest value is kept.</summary>
    public Task<int> RecordEngagementAsync(EngagementRequest req, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(req);
        if (req.PageViewId == Guid.Empty)
        {
            return Task.FromResult(0);
        }
        var seconds = Math.Clamp(req.ActiveSeconds, 0, MaxActiveSeconds);
        return db.TrackingPageViews
            .Where(p => p.PageViewId == req.PageViewId && p.ActiveSeconds < seconds)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.ActiveSeconds, seconds), ct);
    }

    public async Task<bool> RecordClickAsync(ClickRequest req, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(req);
        if (req.ClickId == Guid.Empty || req.PageViewId == Guid.Empty || req.VisitorId == Guid.Empty || req.SessionId == Guid.Empty)
        {
            return false;
        }
        if (!PageTypes.IsValid(req.PageType) || string.IsNullOrWhiteSpace(req.Element))
        {
            return false;
        }
        if (await db.TrackingClicks.AnyAsync(c => c.ClickId == req.ClickId, ct))
        {
            return true;
        }
        db.TrackingClicks.Add(new TrackingClick
        {
            ClickId = req.ClickId,
            PageViewId = req.PageViewId,
            VisitorId = req.VisitorId,
            SessionId = req.SessionId,
            PageType = req.PageType!,
            Element = TrackingService.Clip(req.Element.Trim(), 100) ?? "",
            ProductId = req.ProductId,
            TargetPath = TrackingService.Clip(req.TargetPath, 300),
            CreatedAtUtc = clock.GetUtcNow().UtcDateTime,
        });
        return await SaveOnceAsync(() => db.TrackingClicks.AnyAsync(c => c.ClickId == req.ClickId, ct), ct);
    }

    // ---------- Product Pages section ----------

    public async Task<ProductPagesResult> GetProductPagesAsync(TrackingQuery q, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(q);
        var (fromUtc, toUtc) = Range(q);
        var views = db.TrackingPageViews.AsNoTracking()
            .Where(v => v.PageType == PageTypes.Product && v.ProductId != null && v.CreatedAtUtc >= fromUtc && v.CreatedAtUtc < toUtc);

        var basics = await views
            .GroupBy(v => v.ProductId!.Value)
            .Select(g => new
            {
                ProductId = g.Key,
                Views = g.Count(),
                Visits = g.Select(v => v.SessionId).Distinct().Count(),
                Landings = g.Count(v => v.IsEntry),
                TimedViews = g.Count(v => v.ActiveSeconds > 0),
                ActiveSum = g.Sum(v => (long)v.ActiveSeconds),
            })
            .ToListAsync(ct);

        // Bounce: landed on this product from outside the site, then opened no other page and added nothing to cart.
        var bounces = await views
            .Where(v => v.IsEntry
                && !db.TrackingPageViews.Any(o => o.SessionId == v.SessionId && o.Id != v.Id)
                && !db.TrackingEvents.Any(e => e.SessionId == v.SessionId && e.EventType == TrackingEventTypes.AddToCart))
            .GroupBy(v => v.ProductId!.Value)
            .Select(g => new { ProductId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ProductId, x => x.Count, ct);

        // Visits that viewed the product and added that same product to cart.
        var added = await views
            .Where(v => db.TrackingEvents.Any(e => e.SessionId == v.SessionId
                && e.EventType == TrackingEventTypes.AddToCart
                && e.Items.Any(i => i.ProductId == v.ProductId)))
            .GroupBy(v => v.ProductId!.Value)
            .Select(g => new { ProductId = g.Key, Visits = g.Select(v => v.SessionId).Distinct().Count() })
            .ToDictionaryAsync(x => x.ProductId, x => x.Visits, ct);

        var names = await ProductNamesAsync(basics.Select(b => b.ProductId), ct);

        var rows = basics.Select(b =>
        {
            var bounced = bounces.GetValueOrDefault(b.ProductId);
            var addedVisits = added.GetValueOrDefault(b.ProductId);
            return new ProductPageRowDto(
                b.ProductId,
                names.GetValueOrDefault(b.ProductId) ?? $"Product {b.ProductId}",
                b.Views, b.Visits, b.Landings, bounced,
                Rate(bounced, b.Landings),
                b.TimedViews == 0 ? null : (double)b.ActiveSum / b.TimedViews,
                addedVisits,
                Rate(addedVisits, b.Visits));
        }).ToList();

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var term = q.Search.Trim();
            rows = [.. rows.Where(r => r.ProductName.Contains(term, StringComparison.OrdinalIgnoreCase))];
        }

        var enough = options.MinLandingsToRankBounce;
        rows = q.Sort switch
        {
            "bounce" => [.. rows.OrderByDescending(r => r.Landings >= enough)
                .ThenByDescending(r => r.BounceRate ?? -1).ThenByDescending(r => r.Landings)],
            "add_to_cart" => [.. rows.OrderBy(r => r.AddToCartRate ?? 2).ThenByDescending(r => r.Views)],
            _ => [.. rows.OrderByDescending(r => r.Views).ThenBy(r => r.ProductId)],
        };

        var shown = rows.Select(r => r.ProductId).ToHashSet();
        var timed = basics.Where(b => shown.Contains(b.ProductId)).ToList();
        var timedViews = timed.Sum(b => b.TimedViews);
        var totalLandings = rows.Sum(r => r.Landings);
        var totalBounces = rows.Sum(r => r.Bounces);
        var totals = new ProductPagesTotalsDto(
            rows.Sum(r => r.Views), totalLandings, totalBounces, Rate(totalBounces, totalLandings),
            timedViews == 0 ? null : (double)timed.Sum(b => b.ActiveSum) / timedViews);

        var pageRows = rows.Skip((q.SafePage - 1) * q.SafePageSize).Take(q.SafePageSize).ToList();
        return new ProductPagesResult(pageRows, rows.Count, q.SafePage, q.SafePageSize, totals);
    }

    // ---------- Homepage section ----------

    public async Task<HomepageResultDto> GetHomepageAsync(TrackingQuery q, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(q);
        var (fromUtc, toUtc) = Range(q);
        var views = db.TrackingPageViews.AsNoTracking()
            .Where(v => v.PageType == PageTypes.Home && v.CreatedAtUtc >= fromUtc && v.CreatedAtUtc < toUtc);
        var homeViewIds = views.Select(v => v.PageViewId);
        // Clicks count only against homepage views in the range, so the share never passes 100%.
        var clicks = db.TrackingClicks.AsNoTracking()
            .Where(c => c.PageType == PageTypes.Home && homeViewIds.Contains(c.PageViewId));

        var viewCount = await views.CountAsync(ct);
        var visitors = await views.Select(v => v.VisitorId).Distinct().CountAsync(ct);
        var timed = views.Where(v => v.ActiveSeconds > 0);
        var timedCount = await timed.CountAsync(ct);
        var timedSum = await timed.SumAsync(v => (long?)v.ActiveSeconds, ct) ?? 0;
        var viewsWithClick = await clicks.Select(c => c.PageViewId).Distinct().CountAsync(ct);

        // A view whose time never came back (the phone closed the tab first) is its own bucket,
        // not "under 10 s", the same way the average leaves it out.
        var buckets = new List<TimeBucketDto>
        {
            new("Under 10 s", await timed.CountAsync(v => v.ActiveSeconds < 10, ct)),
            new("10 to 30 s", await timed.CountAsync(v => v.ActiveSeconds >= 10 && v.ActiveSeconds < 30, ct)),
            new("30 s to 1 min", await timed.CountAsync(v => v.ActiveSeconds >= 30 && v.ActiveSeconds < 60, ct)),
            new("1 to 3 min", await timed.CountAsync(v => v.ActiveSeconds >= 60 && v.ActiveSeconds < 180, ct)),
            new("Over 3 min", await timed.CountAsync(v => v.ActiveSeconds >= 180, ct)),
            new(NotMeasured, viewCount - timedCount),
        };

        var elements = await clicks
            .GroupBy(c => c.Element)
            .Select(g => new { Element = g.Key, Clicks = g.Count(), Views = g.Select(c => c.PageViewId).Distinct().Count() })
            .OrderByDescending(x => x.Clicks).ThenBy(x => x.Element)
            .Take(50)
            .ToListAsync(ct);

        var productClicks = await clicks
            .Where(c => c.ProductId != null)
            .GroupBy(c => c.ProductId!.Value)
            .Select(g => new { ProductId = g.Key, Clicks = g.Count() })
            .OrderByDescending(x => x.Clicks).ThenBy(x => x.ProductId)
            .Take(10)
            .ToListAsync(ct);
        var names = await ProductNamesAsync(productClicks.Select(p => p.ProductId), ct);

        return new HomepageResultDto(
            viewCount,
            visitors,
            timedCount == 0 ? null : (double)timedSum / timedCount,
            viewsWithClick,
            buckets,
            [.. elements.Select(e => new HomeElementDto(e.Element, e.Clicks, e.Views, Rate(e.Views, viewCount)))],
            [.. productClicks.Select(p => new HomeProductClickDto(p.ProductId, names.GetValueOrDefault(p.ProductId) ?? $"Product {p.ProductId}", p.Clicks))]);
    }

    // ---------- Helpers ----------

    /// <summary>Saves; when the same row arrived twice at once, the other request stored it and that is a success.</summary>
    private async Task<bool> SaveOnceAsync(Func<Task<bool>> stored, CancellationToken ct)
    {
        try
        {
            await db.SaveChangesAsync(ct);
            return true;
        }
        catch (DbUpdateException)
        {
            db.ChangeTracker.Clear();
            if (await stored())
            {
                return true;
            }
            throw;
        }
    }

    private async Task<Dictionary<int, string>> ProductNamesAsync(IEnumerable<int> productIds, CancellationToken ct)
    {
        var keys = productIds.Distinct().Select(id => (id, (int?)null)).ToList();
        if (keys.Count == 0)
        {
            return [];
        }
        var prices = await lookups.GetPricesAsync(keys, ct);
        return prices.ToDictionary(p => p.Key.ProductId, p => p.Value.Name);
    }

    private (DateTime FromUtc, DateTime ToUtc) Range(TrackingQuery q) =>
        TrackingDates.Range(q.From, q.To, TrackingDates.Zone(options.TimeZoneId), clock.GetUtcNow());

    private static double? Rate(int part, int whole) => whole == 0 ? null : (double)part / whole;
}
