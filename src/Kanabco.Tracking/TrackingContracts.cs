using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace Kanabco.Tracking;

// ---------- Sent by the storefront ----------

public record TrackItemDto(int ProductId, int? VariantId, int Quantity);
public record TrackUtmDto(string? Source, string? Medium, string? Campaign, string? Fbclid);
public record TrackEventRequest(
    Guid EventId, string? EventType, Guid VisitorId, Guid? SessionId, Guid? CheckoutToken,
    List<TrackItemDto>? Items, string? PageUrl, TrackUtmDto? Utm);
public record IdentifyRequest(Guid VisitorId, string? Name, string? Phone, string? Email);
public record PageViewRequest(Guid PageViewId, Guid VisitorId, Guid SessionId, string? PageType, int? ProductId,
    string? Path, bool IsEntry, string? ReferrerHost, TrackUtmDto? Utm);
public record EngagementRequest(Guid PageViewId, int ActiveSeconds);
public record ClickRequest(Guid ClickId, Guid PageViewId, Guid VisitorId, Guid SessionId, string? PageType, string? Element,
    int? ProductId, string? TargetPath);

// ---------- Read by the admin Tracking tab ----------

public record TrackingPersonDto(string Kind, int? CustomerId, string DisplayName, string? Phone, string? Email, string VisitorCode);
public record TrackingItemRowDto(int ProductId, string ProductName, string? VariantLabel, int Quantity, decimal UnitPrice);
public record AddToCartRowDto(long Id, DateTime CreatedAtUtc, TrackingPersonDto Person, TrackingItemRowDto Item,
    decimal Value, string? Source, string? Campaign);
public record CheckoutRowDto(long Id, DateTime CreatedAtUtc, TrackingPersonDto Person, List<TrackingItemRowDto> Items,
    int ItemCount, decimal Value, int? OrderId, string? Source, string? Campaign);
public record TrackingSummaryDto(int AddToCarts, int AddToCartVisitors, int InitiatedCheckouts,
    decimal CheckoutValue, int PurchasedCheckouts);
public record PagedResult<T>(List<T> Rows, int Total, int Page, int PageSize);

public record ProductPageRowDto(int ProductId, string ProductName, int Views, int Visits, int Landings, int Bounces,
    double? BounceRate, double? AvgActiveSeconds, int AddedToCart, double? AddToCartRate);
public record ProductPagesTotalsDto(int Views, int Landings, int Bounces, double? BounceRate, double? AvgActiveSeconds);
public record ProductPagesResult(List<ProductPageRowDto> Rows, int Total, int Page, int PageSize, ProductPagesTotalsDto Totals);

public record TimeBucketDto(string Label, int Views);
public record HomeElementDto(string Element, int Clicks, int ViewsWithClick, double? ClickThroughRate);
public record HomeProductClickDto(int ProductId, string ProductName, int Clicks);
public record HomepageResultDto(int Views, int Visitors, double? AvgActiveSeconds, int ViewsWithClick,
    List<TimeBucketDto> TimeBuckets, List<HomeElementDto> Elements, List<HomeProductClickDto> Products);

/// <summary>
/// The admin filters. <see cref="From"/> and <see cref="To"/> are whole days in Kanabco's time zone
/// (Cairo), both included; the last 30 days when not given.
/// </summary>
public class TrackingQuery
{
    public DateOnly? From { get; set; }
    public DateOnly? To { get; set; }
    public string? Search { get; set; }

    /// <summary>Checkouts: all, purchased or not_purchased.</summary>
    public string? Status { get; set; }

    /// <summary>Product pages: views, bounce or add_to_cart.</summary>
    public string? Sort { get; set; }

    public int? Page { get; set; }
    public int? PageSize { get; set; }

    public int SafePage => Math.Max(1, Page ?? 1);
    public int SafePageSize => Math.Clamp(PageSize ?? 25, 1, 100);
}

// ---------- What the host API provides ----------

public record PricedProduct(string Name, string? VariantLabel, decimal UnitPrice);
public record CustomerInfo(string Name, string? Phone, string? Email);

/// <summary>
/// The only place tracking reads Kanabco's own tables: the host API implements it over its
/// Products, ProductVariants and Customers (or Users) tables and registers it as scoped.
/// </summary>
public interface ITrackingLookups
{
    /// <summary>The name and the selling price shown on the site, for each product and option asked; unknown ones left out.</summary>
    Task<Dictionary<(int ProductId, int? VariantId), PricedProduct>> GetPricesAsync(
        IReadOnlyCollection<(int ProductId, int? VariantId)> keys, CancellationToken ct);

    Task<Dictionary<int, CustomerInfo>> GetCustomersAsync(IReadOnlyCollection<int> customerIds, CancellationToken ct);

    /// <summary>Customers whose name, phone or email contains the term, at most a few hundred.</summary>
    Task<List<int>> SearchCustomerIdsAsync(string term, CancellationToken ct);
}

/// <summary>What the order code calls once an order is real (paid, or confirmed for cash on delivery).</summary>
public interface ITrackingConversions
{
    /// <summary>
    /// Marks the checkout the order came from as purchased, links its visitor to the customer, and
    /// closes the visitor's other open checkouts. Never throws: a tracking failure is logged and
    /// cannot fail the order.
    /// </summary>
    Task<bool> MarkPurchasedAsync(Guid? checkoutToken, int orderId, int? customerId, CancellationToken ct = default);
}

public sealed class TrackingOptions
{
    /// <summary>
    /// Who may read the Tracking tab. Required: wire it to the Tracking permission of Roles &amp; Permissions.
    /// The tab shows names and phone numbers.
    /// </summary>
    public Action<AuthorizationPolicyBuilder>? ViewPolicy { get; set; }

    /// <summary>The logged-in customer's ID from the API's own login token; null for guests and staff.</summary>
    public Func<ClaimsPrincipal, int?> CustomerId { get; set; } = DefaultCustomerId;

    /// <summary>The days the admin picks are whole days here.</summary>
    public string TimeZoneId { get; set; } = "Africa/Cairo";

    /// <summary>Add-to-cart, checkout and identify calls a minute, per browser and network address.</summary>
    public int EventsPerMinute { get; set; } = 60;

    /// <summary>Page views, time reports and clicks a minute, per browser and network address.</summary>
    public int PagesPerMinute { get; set; } = 240;

    /// <summary>Highest bounce rate lists products with at least this many landings first, so one visit is not 100% on top.</summary>
    public int MinLandingsToRankBounce { get; set; } = 5;

    /// <summary>A purchase closes the same visitor's other open checkouts started this long before it.</summary>
    public TimeSpan PurchaseClosesCheckoutsWithin { get; set; } = TimeSpan.FromDays(2);

    public static int? DefaultCustomerId(ClaimsPrincipal user)
    {
        ArgumentNullException.ThrowIfNull(user);
        return int.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
    }
}
