namespace Kanabco.Tracking;

public static class TrackingEventTypes
{
    public const string AddToCart = "add_to_cart";
    public const string InitiateCheckout = "initiate_checkout";

    public static bool IsValid(string? type) => type is AddToCart or InitiateCheckout;
}

public static class PageTypes
{
    public const string Home = "home", Product = "product", Category = "category",
        Cart = "cart", Checkout = "checkout", Other = "other";

    public static bool IsValid(string? type) => type is Home or Product or Category or Cart or Checkout or Other;
}

/// <summary>
/// One row per browser (the kb_vid cookie): the link to a customer account, and any contact
/// details a guest typed at checkout.
/// </summary>
public class TrackingVisitor
{
    public Guid VisitorId { get; set; }
    public int? CustomerId { get; set; }
    public string? ContactName { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public string? FirstUtmSource { get; set; }
    public string? FirstUtmMedium { get; set; }
    public string? FirstUtmCampaign { get; set; }
    public DateTime FirstSeenUtc { get; set; }
    public DateTime LastSeenUtc { get; set; }
    public List<TrackingEvent> Events { get; set; } = [];
}

/// <summary>One row per add-to-cart or initiated checkout.</summary>
public class TrackingEvent
{
    public long Id { get; set; }

    /// <summary>Made in the browser and unique, so a retried or double-clicked event is stored once.</summary>
    public Guid EventId { get; set; }

    public string EventType { get; set; } = "";
    public Guid VisitorId { get; set; }
    public TrackingVisitor Visitor { get; set; } = null!;

    /// <summary>Set only when the customer was logged in at the time.</summary>
    public int? CustomerId { get; set; }

    /// <summary>One browser tab's visit.</summary>
    public Guid? SessionId { get; set; }

    /// <summary>Initiated checkouts only: the order sends it back, which marks the checkout purchased.</summary>
    public Guid? CheckoutToken { get; set; }

    public int? OrderId { get; set; }

    /// <summary>
    /// A checkout the same shopper replaced (they changed the cart and opened checkout again), or that
    /// closed when they bought through another checkout. Left out of the counts and the follow-up list.
    /// </summary>
    public DateTime? SupersededAtUtc { get; set; }

    public decimal TotalValue { get; set; }
    public int ItemCount { get; set; }
    public string? PageUrl { get; set; }
    public string? UtmSource { get; set; }
    public string? UtmMedium { get; set; }
    public string? UtmCampaign { get; set; }
    public string? Fbclid { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public List<TrackingEventItem> Items { get; set; } = [];
}

/// <summary>The products in an event: one line for an add-to-cart, every cart line for a checkout.</summary>
public class TrackingEventItem
{
    public long Id { get; set; }
    public long TrackingEventId { get; set; }
    public int ProductId { get; set; }
    public int? VariantId { get; set; }

    /// <summary>Copied at the time, so a renamed product still reads correctly.</summary>
    public string ProductName { get; set; } = "";

    public string? VariantLabel { get; set; }
    public int Quantity { get; set; }

    /// <summary>Read from Kanabco's own tables, never from the browser.</summary>
    public decimal UnitPrice { get; set; }
}

/// <summary>One row per page opened. ActiveSeconds is filled in when the visitor leaves the page.</summary>
public class TrackingPageView
{
    public long Id { get; set; }
    public Guid PageViewId { get; set; }
    public Guid VisitorId { get; set; }
    public Guid SessionId { get; set; }
    public int? CustomerId { get; set; }
    public string PageType { get; set; } = "";
    public int? ProductId { get; set; }
    public string? Path { get; set; }

    /// <summary>The first page of the visit, arriving from outside the site.</summary>
    public bool IsEntry { get; set; }

    public string? ReferrerHost { get; set; }
    public string? UtmSource { get; set; }
    public string? UtmCampaign { get; set; }

    /// <summary>Time the tab was visible on this page; 0 until the browser reports it.</summary>
    public int ActiveSeconds { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}

/// <summary>One row per click on a tagged element, or any link, of a tracked page.</summary>
public class TrackingClick
{
    public long Id { get; set; }

    /// <summary>Made in the browser and unique, so a retried click is stored once.</summary>
    public Guid ClickId { get; set; }

    public Guid PageViewId { get; set; }
    public Guid VisitorId { get; set; }
    public Guid SessionId { get; set; }
    public string PageType { get; set; } = "";

    /// <summary>The data-track name, e.g. hero-banner; untagged-link for other links.</summary>
    public string Element { get; set; } = "";

    public int? ProductId { get; set; }
    public string? TargetPath { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
