using System.Net;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using static Kanabco.Tracking.Tests.FakeLookups;

namespace Kanabco.Tracking.Tests;

public sealed class CartAndCheckoutTests(TrackingApp app) : IClassFixture<TrackingApp>
{
    private static object AddToCart(Guid visitor, int product, int quantity = 1, int? variant = null, Guid? eventId = null, Guid? session = null) => new
    {
        eventId = eventId ?? Guid.NewGuid(),
        eventType = "add_to_cart",
        visitorId = visitor,
        sessionId = session ?? Guid.NewGuid(),
        items = new[] { new { productId = product, variantId = variant, quantity } },
        pageUrl = "https://kanabco.net/product/" + product,
        utm = new { source = "facebook", campaign = "winter" },
    };

    private static object Checkout(Guid visitor, Guid session, Guid token, params (int Product, int Quantity)[] items) => new
    {
        eventId = Guid.NewGuid(),
        eventType = "initiate_checkout",
        visitorId = visitor,
        sessionId = session,
        checkoutToken = token,
        items = items.Select(i => new { productId = i.Product, quantity = i.Quantity }).ToArray(),
    };

    private static string Day(DateOnly day, string extra = "") => $"?from={day:yyyy-MM-dd}&to={day:yyyy-MM-dd}{extra}";

    [Fact]
    public async Task Add_to_cart_is_priced_from_the_shop_not_the_browser()
    {
        var day = app.UseDay(2);
        var visitor = Guid.NewGuid();

        using var plain = await app.PostAsync("/api/tracking/events", AddToCart(visitor, Sofa, 2), visitor);
        using var variant = await app.PostAsync("/api/tracking/events", AddToCart(visitor, Sofa, 1, SofaGreenVelvet), visitor);

        Assert.Equal(HttpStatusCode.Accepted, plain.StatusCode);
        Assert.Equal(HttpStatusCode.Accepted, variant.StatusCode);
        var rows = await app.AdminGetAsync<PagedResult<AddToCartRowDto>>("/api/admin/tracking/add-to-carts" + Day(day));
        Assert.Equal(2, rows.Total);
        var green = rows.Rows.Single(r => r.Item.VariantLabel == "Green velvet");
        Assert.Equal(26500m, green.Item.UnitPrice);
        Assert.Equal(48000m, rows.Rows.Single(r => r.Item.VariantLabel is null).Value);
        Assert.Equal("guest", green.Person.Kind);
        Assert.Equal("facebook", green.Source);
        Assert.Equal("winter", green.Campaign);

        var summary = await app.AdminGetAsync<TrackingSummaryDto>("/api/admin/tracking/summary" + Day(day));
        Assert.Equal(2, summary.AddToCarts);
        Assert.Equal(1, summary.AddToCartVisitors);
    }

    [Fact]
    public async Task The_same_event_sent_twice_even_at_once_is_stored_once()
    {
        var day = app.UseDay(3);
        var visitor = Guid.NewGuid();
        var eventId = Guid.NewGuid();
        var body = AddToCart(visitor, Chair, eventId: eventId);

        var responses = await Task.WhenAll(Enumerable.Range(0, 6).Select(_ => app.PostAsync("/api/tracking/events", body, visitor)));
        using var again = await app.PostAsync("/api/tracking/events", body, visitor);

        Assert.All(responses, r => Assert.Equal(HttpStatusCode.Accepted, r.StatusCode));
        Assert.Equal(HttpStatusCode.Accepted, again.StatusCode);
        var summary = await app.AdminGetAsync<TrackingSummaryDto>("/api/admin/tracking/summary" + Day(day));
        Assert.Equal(1, summary.AddToCarts);
    }

    [Fact]
    public async Task A_new_visitors_first_events_arriving_together_are_all_kept()
    {
        var day = app.UseDay(4);
        var visitor = Guid.NewGuid();

        var responses = await Task.WhenAll(Enumerable.Range(0, 5).Select(_ => app.PostAsync("/api/tracking/events", AddToCart(visitor, Lamp), visitor)));

        Assert.All(responses, r => Assert.Equal(HttpStatusCode.Accepted, r.StatusCode));
        var summary = await app.AdminGetAsync<TrackingSummaryDto>("/api/admin/tracking/summary" + Day(day));
        Assert.Equal(5, summary.AddToCarts);
        Assert.Equal(1, summary.AddToCartVisitors);
    }

    [Fact]
    public async Task Events_that_are_not_valid_are_refused_and_a_failing_catalogue_never_reaches_the_shopper()
    {
        app.UseDay(5);
        var visitor = Guid.NewGuid();

        using var unknown = await app.PostAsync("/api/tracking/events", AddToCart(visitor, 999), visitor);
        using var tooMany = await app.PostAsync("/api/tracking/events", AddToCart(visitor, Sofa, 101), visitor);
        using var noToken = await app.PostAsync("/api/tracking/events", new
        {
            eventId = Guid.NewGuid(), eventType = "initiate_checkout", visitorId = visitor, items = new[] { new { productId = Sofa, quantity = 1 } },
        }, visitor);
        using var badType = await app.PostAsync("/api/tracking/events", new { eventId = Guid.NewGuid(), eventType = "purchase", visitorId = visitor }, visitor);
        using var broken = await app.PostAsync("/api/tracking/events", AddToCart(visitor, Broken), visitor);

        Assert.Equal(HttpStatusCode.BadRequest, unknown.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, tooMany.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, noToken.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, badType.StatusCode);
        Assert.Equal(HttpStatusCode.Accepted, broken.StatusCode);
    }

    [Fact]
    public async Task A_guest_shows_the_details_typed_at_checkout_then_the_customer_after_logging_in()
    {
        var day = app.UseDay(6);
        var visitor = Guid.NewGuid();
        using var _ = await app.PostAsync("/api/tracking/events", AddToCart(visitor, Table), visitor);

        using var typed = await app.PostAsync("/api/tracking/identify", new { visitorId = visitor, name = " Hany Samir ", phone = "01112223334" }, visitor);
        var asGuest = (await app.AdminGetAsync<PagedResult<AddToCartRowDto>>("/api/admin/tracking/add-to-carts" + Day(day))).Rows.Single();

        using var login = await app.PostAsync("/api/tracking/identify", new { visitorId = visitor }, visitor, customer: Mona);
        var asCustomer = (await app.AdminGetAsync<PagedResult<AddToCartRowDto>>("/api/admin/tracking/add-to-carts" + Day(day))).Rows.Single();
        var searched = await app.AdminGetAsync<PagedResult<AddToCartRowDto>>("/api/admin/tracking/add-to-carts" + Day(day, "&search=Mona"));

        Assert.Equal(HttpStatusCode.Accepted, typed.StatusCode);
        Assert.Equal(("guest", "Hany Samir", "01112223334"), (asGuest.Person.Kind, asGuest.Person.DisplayName, asGuest.Person.Phone));
        Assert.Equal(("customer", Mona, "Mona Adel"), (asCustomer.Person.Kind, asCustomer.Person.CustomerId, asCustomer.Person.DisplayName));
        Assert.Equal(1, searched.Total);
    }

    [Fact]
    public async Task Changing_the_cart_and_opening_checkout_again_replaces_the_earlier_checkout()
    {
        var day = app.UseDay(7);
        var (visitor, session) = (Guid.NewGuid(), Guid.NewGuid());

        using var first = await app.PostAsync("/api/tracking/events", Checkout(visitor, session, Guid.NewGuid(), (Sofa, 1)), visitor);
        app.Clock.Advance(TimeSpan.FromMinutes(3));
        using var second = await app.PostAsync("/api/tracking/events", Checkout(visitor, session, Guid.NewGuid(), (Sofa, 1), (Chair, 2)), visitor);

        var summary = await app.AdminGetAsync<TrackingSummaryDto>("/api/admin/tracking/summary" + Day(day));
        var open = await app.AdminGetAsync<PagedResult<CheckoutRowDto>>("/api/admin/tracking/checkouts" + Day(day, "&status=not_purchased"));
        Assert.Equal(1, summary.InitiatedCheckouts);
        Assert.Equal(37000m, summary.CheckoutValue);
        Assert.Equal(3, open.Rows.Single().ItemCount);
    }

    [Fact]
    public async Task An_order_marks_its_checkout_purchased_and_closes_the_shoppers_other_open_checkouts()
    {
        var day = app.UseDay(8);
        var visitor = Guid.NewGuid();
        var token = Guid.NewGuid();
        using var otherTab = await app.PostAsync("/api/tracking/events", Checkout(visitor, Guid.NewGuid(), Guid.NewGuid(), (Rug, 1)), visitor);
        using var bought = await app.PostAsync("/api/tracking/events", Checkout(visitor, Guid.NewGuid(), token, (Rug, 2)), visitor);
        var someoneElse = Guid.NewGuid();
        using var stranger = await app.PostAsync("/api/tracking/events", Checkout(someoneElse, Guid.NewGuid(), Guid.NewGuid(), (Lamp, 1)), someoneElse);

        var marked = await app.InScopeAsync(sp => sp.GetRequiredService<ITrackingConversions>().MarkPurchasedAsync(token, 5150, Mona));
        var unknown = await app.InScopeAsync(sp => sp.GetRequiredService<ITrackingConversions>().MarkPurchasedAsync(Guid.NewGuid(), 5151, null));
        var none = await app.InScopeAsync(sp => sp.GetRequiredService<ITrackingConversions>().MarkPurchasedAsync(null, 5152, null));

        Assert.True(marked);
        Assert.False(unknown);
        Assert.False(none);
        var purchased = await app.AdminGetAsync<PagedResult<CheckoutRowDto>>("/api/admin/tracking/checkouts" + Day(day, "&status=purchased"));
        var open = await app.AdminGetAsync<PagedResult<CheckoutRowDto>>("/api/admin/tracking/checkouts" + Day(day, "&status=not_purchased"));
        Assert.Equal(5150, purchased.Rows.Single().OrderId);
        Assert.Equal("Mona Adel", purchased.Rows.Single().Person.DisplayName);
        Assert.Equal(someoneElse.ToString("N")[..6].ToUpperInvariant(), open.Rows.Single().Person.VisitorCode);
        var summary = await app.AdminGetAsync<TrackingSummaryDto>("/api/admin/tracking/summary" + Day(day));
        Assert.Equal((2, 1), (summary.InitiatedCheckouts, summary.PurchasedCheckouts));
    }

    [Fact]
    public async Task Days_are_Cairo_days()
    {
        // 22:30 UTC on 9 March is 00:30 on 10 March in Cairo (UTC+2).
        app.Clock.SetUtcNow(new DateTimeOffset(2026, 3, 9, 22, 30, 0, TimeSpan.Zero));
        var visitor = Guid.NewGuid();
        using var _ = await app.PostAsync("/api/tracking/events", AddToCart(visitor, Lamp), visitor);

        var ninth = await app.AdminGetAsync<TrackingSummaryDto>("/api/admin/tracking/summary" + Day(new DateOnly(2026, 3, 9)));
        var tenth = await app.AdminGetAsync<TrackingSummaryDto>("/api/admin/tracking/summary" + Day(new DateOnly(2026, 3, 10)));

        Assert.Equal(0, ninth.AddToCarts);
        Assert.Equal(1, tenth.AddToCarts);
    }

    [Fact]
    public async Task Only_staff_with_the_Tracking_permission_can_read_the_tab()
    {
        using var anonymous = await app.AdminSendAsync("/api/admin/tracking/summary", signedIn: false, permitted: false);
        using var withoutPermission = await app.AdminSendAsync("/api/admin/tracking/checkouts", signedIn: true, permitted: false);
        using var withPermission = await app.AdminSendAsync("/api/admin/tracking/homepage");

        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, withoutPermission.StatusCode);
        Assert.Equal(HttpStatusCode.OK, withPermission.StatusCode);
    }
}

public sealed class TightLimitsApp : TrackingApp
{
    public TightLimitsApp() => EventsPerMinute = 5;
}

public sealed class RateLimitTests(TightLimitsApp app) : IClassFixture<TightLimitsApp>
{
    [Fact]
    public async Task The_limit_is_per_browser_so_shoppers_sharing_a_mobile_network_address_are_not_cut_off()
    {
        var (busy, neighbour) = (Guid.NewGuid(), Guid.NewGuid());
        object Body(Guid v) => new { visitorId = v, name = "x" };

        var statuses = new List<HttpStatusCode>();
        for (var i = 0; i < 6; i++)
        {
            using var r = await app.PostAsync("/api/tracking/identify", Body(busy), busy);
            statuses.Add(r.StatusCode);
        }
        using var other = await app.PostAsync("/api/tracking/identify", Body(neighbour), neighbour);

        Assert.Equal(Enumerable.Repeat(HttpStatusCode.Accepted, 5), statuses.Take(5));
        Assert.Equal(HttpStatusCode.TooManyRequests, statuses[5]);
        Assert.Equal(HttpStatusCode.Accepted, other.StatusCode);
    }
}
