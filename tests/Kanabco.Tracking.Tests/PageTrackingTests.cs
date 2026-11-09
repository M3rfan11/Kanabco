using System.Net;
using Xunit;
using static Kanabco.Tracking.Tests.FakeLookups;

namespace Kanabco.Tracking.Tests;

public sealed class PageTrackingTests(TrackingApp app) : IClassFixture<TrackingApp>
{
    private sealed record Visit(Guid Visitor, Guid Session);

    private static Visit NewVisit() => new(Guid.NewGuid(), Guid.NewGuid());

    private async Task<Guid> ViewAsync(Visit visit, string pageType, int? product = null, bool entry = false)
    {
        var id = Guid.NewGuid();
        using var r = await app.PostAsync("/api/tracking/pageview", new
        {
            pageViewId = id, visitorId = visit.Visitor, sessionId = visit.Session, pageType, productId = product,
            path = product is null ? "/" : $"/product/{product}", isEntry = entry, referrerHost = entry ? "www.facebook.com" : null,
        }, visit.Visitor);
        Assert.Equal(HttpStatusCode.Accepted, r.StatusCode);
        return id;
    }

    private async Task TimeAsync(Guid pageView, int seconds)
    {
        using var r = await app.PostAsync("/api/tracking/engagement", new { pageViewId = pageView, activeSeconds = seconds });
        Assert.Equal(HttpStatusCode.Accepted, r.StatusCode);
    }

    private async Task<HttpStatusCode> ClickAsync(Visit visit, Guid pageView, string element, int? product = null, Guid? clickId = null)
    {
        using var r = await app.PostAsync("/api/tracking/click", new
        {
            clickId = clickId ?? Guid.NewGuid(), pageViewId = pageView, visitorId = visit.Visitor, sessionId = visit.Session,
            pageType = "home", element, productId = product, targetPath = product is null ? null : $"/product/{product}",
        }, visit.Visitor);
        return r.StatusCode;
    }

    private static string Day(DateOnly day, string extra = "") => $"?from={day:yyyy-MM-dd}&to={day:yyyy-MM-dd}{extra}";

    [Fact]
    public async Task A_landing_that_leaves_is_a_bounce_and_one_that_browses_or_adds_to_cart_is_not()
    {
        var day = app.UseDay(12);
        var left = NewVisit();
        var landed = await ViewAsync(left, "product", Sofa, entry: true);
        await TimeAsync(landed, 12);

        var browsed = NewVisit();
        await ViewAsync(browsed, "product", Sofa, entry: true);
        await ViewAsync(browsed, "product", Chair);

        var added = NewVisit();
        await ViewAsync(added, "product", Sofa, entry: true);
        using var cart = await app.PostAsync("/api/tracking/events", new
        {
            eventId = Guid.NewGuid(), eventType = "add_to_cart", visitorId = added.Visitor, sessionId = added.Session,
            items = new[] { new { productId = Sofa, quantity = 1 } },
        }, added.Visitor);

        var result = await app.AdminGetAsync<ProductPagesResult>("/api/admin/tracking/product-pages" + Day(day));

        var sofa = result.Rows.Single(r => r.ProductId == Sofa);
        Assert.Equal(("Nile Sofa", 3, 3, 1), (sofa.ProductName, sofa.Views, sofa.Landings, sofa.Bounces));
        Assert.Equal(1.0 / 3, sofa.BounceRate!.Value, 6);
        Assert.Equal(12, sofa.AvgActiveSeconds);
        Assert.Equal(1, sofa.AddedToCart);
        Assert.Equal(1.0 / 3, sofa.AddToCartRate!.Value, 6);
        Assert.Equal(0, result.Rows.Single(r => r.ProductId == Chair).Landings);
        Assert.Equal((4, 3, 1), (result.Totals.Views, result.Totals.Landings, result.Totals.Bounces));
    }

    [Fact]
    public async Task Highest_bounce_rate_lists_products_with_enough_landings_first()
    {
        var day = app.UseDay(13);
        // The lamp: one landing, one bounce (100%). The rug: six landings, three bounces (50%).
        await ViewAsync(NewVisit(), "product", Lamp, entry: true);
        for (var i = 0; i < 6; i++)
        {
            var visit = NewVisit();
            await ViewAsync(visit, "product", Rug, entry: true);
            if (i % 2 == 0)
            {
                await ViewAsync(visit, "home");
            }
        }

        var result = await app.AdminGetAsync<ProductPagesResult>("/api/admin/tracking/product-pages" + Day(day, "&sort=bounce"));

        Assert.Equal([Rug, Lamp], result.Rows.Select(r => r.ProductId));
        Assert.Equal(0.5, result.Rows[0].BounceRate);
        Assert.Equal(1.0, result.Rows[1].BounceRate);
    }

    [Fact]
    public async Task Time_on_page_keeps_the_largest_report_and_views_never_reported_are_not_counted_as_short()
    {
        var day = app.UseDay(14);
        var visit = NewVisit();
        var a = await ViewAsync(visit, "home", entry: true);
        await TimeAsync(a, 20);
        await TimeAsync(a, 75);
        await TimeAsync(a, 40);
        var b = await ViewAsync(NewVisit(), "home", entry: true);
        await TimeAsync(b, 5);
        await ViewAsync(NewVisit(), "home", entry: true); // the phone closed the tab before reporting

        var home = await app.AdminGetAsync<HomepageResultDto>("/api/admin/tracking/homepage" + Day(day));

        Assert.Equal((3, 3), (home.Views, home.Visitors));
        Assert.Equal(40, home.AvgActiveSeconds);
        var buckets = home.TimeBuckets.ToDictionary(x => x.Label, x => x.Views);
        Assert.Equal(1, buckets["Under 10 s"]);
        Assert.Equal(1, buckets["1 to 3 min"]);
        Assert.Equal(1, buckets[PageTrackingService.NotMeasured]);
        Assert.Equal(home.Views, buckets.Values.Sum());
    }

    [Fact]
    public async Task Homepage_clicks_count_once_per_click_and_per_view()
    {
        var day = app.UseDay(15);
        var first = NewVisit();
        var view1 = await ViewAsync(first, "home", entry: true);
        var second = NewVisit();
        var view2 = await ViewAsync(second, "home", entry: true);
        var clickId = Guid.NewGuid();

        Assert.Equal(HttpStatusCode.Accepted, await ClickAsync(first, view1, "hero-banner", clickId: clickId));
        Assert.Equal(HttpStatusCode.Accepted, await ClickAsync(first, view1, "hero-banner", clickId: clickId)); // retried
        Assert.Equal(HttpStatusCode.Accepted, await ClickAsync(first, view1, "hero-banner"));
        Assert.Equal(HttpStatusCode.Accepted, await ClickAsync(first, view1, "new-arrivals-card", Sofa));
        Assert.Equal(HttpStatusCode.Accepted, await ClickAsync(second, view2, "new-arrivals-card", Sofa));
        Assert.Equal(HttpStatusCode.BadRequest, await ClickAsync(second, view2, " "));

        var home = await app.AdminGetAsync<HomepageResultDto>("/api/admin/tracking/homepage" + Day(day));

        Assert.Equal(2, home.ViewsWithClick);
        var hero = home.Elements.Single(e => e.Element == "hero-banner");
        Assert.Equal((2, 1, 0.5), (hero.Clicks, hero.ViewsWithClick, hero.ClickThroughRate));
        var cards = home.Elements.Single(e => e.Element == "new-arrivals-card");
        Assert.Equal((2, 2, 1.0), (cards.Clicks, cards.ViewsWithClick, cards.ClickThroughRate));
        Assert.Equal(("Nile Sofa", 2), (home.Products.Single().ProductName, home.Products.Single().Clicks));
    }

    [Fact]
    public async Task Time_and_clicks_sent_as_beacons_while_the_page_closes_are_kept()
    {
        var day = app.UseDay(17);
        var visit = NewVisit();
        var view = await ViewAsync(visit, "home", entry: true);
        async Task<HttpStatusCode> BeaconAsync(string path, string json)
        {
            using var content = new StringContent(json, System.Text.Encoding.UTF8, "text/plain");
            using var r = await app.Client.PostAsync($"{path}?vid={visit.Visitor}", content);
            return r.StatusCode;
        }

        var time = await BeaconAsync("/api/tracking/engagement", $$"""{"pageViewId":"{{view}}","activeSeconds":33}""");
        var click = await BeaconAsync("/api/tracking/click", $$"""{"clickId":"{{Guid.NewGuid()}}","pageViewId":"{{view}}","visitorId":"{{visit.Visitor}}","sessionId":"{{visit.Session}}","pageType":"home","element":"whatsapp"}""");
        var garbage = await BeaconAsync("/api/tracking/click", "not json");
        var huge = await BeaconAsync("/api/tracking/engagement", new string(' ', 5000) + "{}");

        Assert.Equal((HttpStatusCode.Accepted, HttpStatusCode.Accepted), (time, click));
        Assert.Equal((HttpStatusCode.BadRequest, HttpStatusCode.BadRequest), (garbage, huge));
        var home = await app.AdminGetAsync<HomepageResultDto>("/api/admin/tracking/homepage" + Day(day));
        Assert.Equal(33, home.AvgActiveSeconds);
        Assert.Equal("whatsapp", home.Elements.Single().Element);
    }

    [Fact]
    public async Task Page_views_that_are_not_valid_are_refused_and_a_repeat_is_stored_once()
    {
        var day = app.UseDay(16);
        var visit = NewVisit();
        var id = Guid.NewGuid();
        object Body(string type, int? product) => new { pageViewId = id, visitorId = visit.Visitor, sessionId = visit.Session, pageType = type, productId = product };

        using var noProduct = await app.PostAsync("/api/tracking/pageview", Body("product", null), visit.Visitor);
        using var badType = await app.PostAsync("/api/tracking/pageview", Body("admin", null), visit.Visitor);
        using var once = await app.PostAsync("/api/tracking/pageview", Body("home", null), visit.Visitor);
        using var twice = await app.PostAsync("/api/tracking/pageview", Body("home", null), visit.Visitor);

        Assert.Equal(HttpStatusCode.BadRequest, noProduct.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, badType.StatusCode);
        Assert.Equal((HttpStatusCode.Accepted, HttpStatusCode.Accepted), (once.StatusCode, twice.StatusCode));
        var home = await app.AdminGetAsync<HomepageResultDto>("/api/admin/tracking/homepage" + Day(day));
        Assert.Equal(1, home.Views);
    }
}

public sealed class TrackingDatesTests
{
    private static readonly TimeZoneInfo Cairo = TrackingDates.Zone("Africa/Cairo");

    [Fact]
    public void Picked_days_are_whole_Cairo_days_with_both_ends_included()
    {
        var (from, to) = TrackingDates.Range(new DateOnly(2026, 1, 5), new DateOnly(2026, 1, 6), Cairo, DateTimeOffset.UtcNow);

        Assert.Equal(new DateTime(2026, 1, 4, 22, 0, 0, DateTimeKind.Utc), from);
        Assert.Equal(new DateTime(2026, 1, 6, 22, 0, 0, DateTimeKind.Utc), to);
    }

    [Fact]
    public void Without_dates_it_is_the_last_30_days_to_today_in_Cairo()
    {
        var now = new DateTimeOffset(2026, 1, 31, 23, 0, 0, TimeSpan.Zero); // already 1 February in Cairo
        var (from, to) = TrackingDates.Range(null, null, Cairo, now);

        Assert.Equal(new DateTime(2026, 1, 2, 22, 0, 0, DateTimeKind.Utc), from);
        Assert.Equal(new DateTime(2026, 2, 1, 22, 0, 0, DateTimeKind.Utc), to);
    }

    [Fact]
    public void A_day_that_starts_when_Egypt_moves_its_clocks_forward_still_has_a_start()
    {
        // Egypt's summer time begins at midnight on the last Friday of April: 00:00 to 00:59 does not exist.
        var day = new DateOnly(2026, 4, 24);
        var local = day.ToDateTime(TimeOnly.MinValue);
        Assert.True(Cairo.IsInvalidTime(local));

        var start = TrackingDates.StartOf(day, Cairo);

        Assert.Equal(new DateTime(2026, 4, 23, 22, 0, 0, DateTimeKind.Utc), start);
    }

    [Fact]
    public void Reversed_or_too_long_ranges_are_put_right()
    {
        var (from, to) = TrackingDates.Range(new DateOnly(2026, 3, 10), new DateOnly(2026, 3, 1), Cairo, DateTimeOffset.UtcNow);
        var (yearFrom, _) = TrackingDates.Range(new DateOnly(2020, 1, 1), new DateOnly(2026, 3, 1), Cairo, DateTimeOffset.UtcNow);

        Assert.True(from < to);
        Assert.Equal(TrackingDates.StartOf(new DateOnly(2025, 3, 1), Cairo), yearFrom);
    }
}
