using System.Net;
using System.Text.Json;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;

namespace Kanabco.Tracking;

/// <summary>
/// Three lines in the host API's Program.cs:
/// <code>
/// builder.Services.AddKanabcoTracking(connectionString, o => o.ViewPolicy = p => /* the Tracking permission */);
/// builder.Services.AddScoped&lt;ITrackingLookups, TrackingLookups&gt;();
/// app.MapKanabcoTracking();   // after UseAuthentication, UseAuthorization and UseRateLimiter
/// </code>
/// </summary>
public static class TrackingSetup
{
    public const string ViewPolicy = "Tracking.View";
    public const string EventsLimit = "kb-tracking-events";
    public const string PagesLimit = "kb-tracking-pages";

    /// <summary>SQL Server, in the shop's own database, with this module's own migrations history.</summary>
    public static IServiceCollection AddKanabcoTracking(this IServiceCollection services, string connectionString, Action<TrackingOptions> configure) =>
        services.AddKanabcoTracking(
            db => db.UseSqlServer(connectionString, sql => sql.MigrationsHistoryTable(TrackingDbContext.MigrationsHistoryTable)),
            configure);

    public static IServiceCollection AddKanabcoTracking(this IServiceCollection services, Action<DbContextOptionsBuilder> database, Action<TrackingOptions> configure)
    {
        ArgumentNullException.ThrowIfNull(database);
        ArgumentNullException.ThrowIfNull(configure);
        var options = new TrackingOptions();
        configure(options);
        if (options.ViewPolicy is null)
        {
            throw new InvalidOperationException(
                "Tracking: set TrackingOptions.ViewPolicy to the Tracking permission; the tab shows customers' names and phone numbers.");
        }
        _ = TrackingDates.Zone(options.TimeZoneId);

        services.AddSingleton(options);
        services.TryAddSingleton(TimeProvider.System);
        services.AddDbContext<TrackingDbContext>(database);
        services.AddScoped<TrackingService>();
        services.AddScoped<PageTrackingService>();
        services.AddScoped<ITrackingConversions>(sp => sp.GetRequiredService<TrackingService>());
        services.AddAuthorization(o => o.AddPolicy(ViewPolicy, options.ViewPolicy));
        services.AddRateLimiter(o =>
        {
            o.AddPolicy(EventsLimit, new VisitorRateLimit(options.EventsPerMinute));
            o.AddPolicy(PagesLimit, new VisitorRateLimit(options.PagesPerMinute));
        });
        return services;
    }

    /// <summary>
    /// The public endpoints the storefront calls and the admin endpoints the Tracking tab reads. The
    /// public ones answer 202 even when a write fails, so tracking cannot break the shop.
    /// </summary>
    public static IEndpointRouteBuilder MapKanabcoTracking(this IEndpointRouteBuilder app)
    {
        ArgumentNullException.ThrowIfNull(app);
        var pub = app.MapGroup("/api/tracking").AllowAnonymous().WithTags("Tracking");
        pub.MapPost("/events", Collect).RequireRateLimiting(EventsLimit);
        pub.MapPost("/identify", Identify).RequireRateLimiting(EventsLimit);
        pub.MapPost("/pageview", PageView).RequireRateLimiting(PagesLimit);
        pub.MapPost("/engagement", Engagement).RequireRateLimiting(PagesLimit);
        pub.MapPost("/click", Click).RequireRateLimiting(PagesLimit);

        var admin = app.MapGroup("/api/admin/tracking").RequireAuthorization(ViewPolicy).WithTags("Tracking");
        admin.MapGet("/summary", ([AsParameters] TrackingQuery q, TrackingService s, CancellationToken ct) => s.GetSummaryAsync(q, ct));
        admin.MapGet("/add-to-carts", ([AsParameters] TrackingQuery q, TrackingService s, CancellationToken ct) => s.GetAddToCartsAsync(q, ct));
        admin.MapGet("/checkouts", ([AsParameters] TrackingQuery q, TrackingService s, CancellationToken ct) => s.GetCheckoutsAsync(q, ct));
        admin.MapGet("/product-pages", ([AsParameters] TrackingQuery q, PageTrackingService s, CancellationToken ct) => s.GetProductPagesAsync(q, ct));
        admin.MapGet("/homepage", ([AsParameters] TrackingQuery q, PageTrackingService s, CancellationToken ct) => s.GetHomepageAsync(q, ct));
        return app;
    }

    private static Task<IResult> Collect(TrackEventRequest? req, HttpContext http, TrackingService s, TrackingOptions o, ILoggerFactory log, CancellationToken ct) =>
        Safely(req, log, "event", () => s.RecordAsync(req!, o.CustomerId(http.User), ct));

    private static Task<IResult> Identify(IdentifyRequest? req, HttpContext http, TrackingService s, TrackingOptions o, ILoggerFactory log, CancellationToken ct) =>
        Safely(req, log, "identify", async () =>
        {
            await s.IdentifyAsync(req!, o.CustomerId(http.User), ct);
            return true;
        });

    private static Task<IResult> PageView(PageViewRequest? req, HttpContext http, PageTrackingService s, TrackingOptions o, ILoggerFactory log, CancellationToken ct) =>
        Safely(req, log, "page view", () => s.RecordPageViewAsync(req!, o.CustomerId(http.User), ct));

    // Time on page and clicks are often sent as the page closes, which browsers deliver reliably only
    // as a beacon: a plain-text body with no extra headers. These two read JSON whatever the content type.
    private static async Task<IResult> Engagement(HttpRequest http, PageTrackingService s, ILoggerFactory log, CancellationToken ct)
    {
        var req = await ReadBeaconAsync<EngagementRequest>(http, ct);
        return await Safely(req, log, "engagement", async () =>
        {
            await s.RecordEngagementAsync(req!, ct);
            return true;
        });
    }

    private static async Task<IResult> Click(HttpRequest http, PageTrackingService s, ILoggerFactory log, CancellationToken ct)
    {
        var req = await ReadBeaconAsync<ClickRequest>(http, ct);
        return await Safely(req, log, "click", () => s.RecordClickAsync(req!, ct));
    }

    private const int MaxBeaconBytes = 4 * 1024;
    private static readonly JsonSerializerOptions BeaconJson = new(JsonSerializerDefaults.Web);

    private static async Task<T?> ReadBeaconAsync<T>(HttpRequest http, CancellationToken ct) where T : class
    {
        if (http.ContentLength is > MaxBeaconBytes)
        {
            return null;
        }
        using var buffer = new MemoryStream();
        var chunk = new byte[1024];
        int read;
        while ((read = await http.Body.ReadAsync(chunk, ct)) > 0)
        {
            if (buffer.Length + read > MaxBeaconBytes)
            {
                return null;
            }
            buffer.Write(chunk, 0, read);
        }
        try
        {
            return buffer.Length == 0 ? null : JsonSerializer.Deserialize<T>(buffer.GetBuffer().AsSpan(0, (int)buffer.Length), BeaconJson);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    /// <summary>400 for a request that is not a valid one; 202 otherwise, a failed write logged and skipped.</summary>
    private static async Task<IResult> Safely(object? req, ILoggerFactory log, string what, Func<Task<bool>> write)
    {
        if (req is null)
        {
            return Results.BadRequest();
        }
        try
        {
            return await write() ? Results.Accepted() : Results.BadRequest();
        }
        catch (Exception ex)
        {
            log.CreateLogger("Kanabco.Tracking").LogWarning(ex, "Tracking {What} was not stored", what);
            return Results.Accepted();
        }
    }

    /// <summary>
    /// Per browser and network address: many shoppers on an Egyptian mobile network share one address,
    /// so a limit per address alone would drop real shoppers' events at busy times. The browser sends its
    /// visitor ID as ?vid= (no extra header, so no change to the API's CORS rules).
    /// </summary>
    private sealed class VisitorRateLimit(int perMinute) : IRateLimiterPolicy<string>
    {
        public Func<OnRejectedContext, CancellationToken, ValueTask>? OnRejected { get; } = (context, _) =>
        {
            context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
            return ValueTask.CompletedTask;
        };

        public RateLimitPartition<string> GetPartition(HttpContext httpContext)
        {
            var address = httpContext.Connection.RemoteIpAddress ?? IPAddress.None;
            var visitor = Guid.TryParse(httpContext.Request.Query["vid"], out var v) ? v.ToString("N") : "-";
            return RateLimitPartition.GetFixedWindowLimiter($"{address}|{visitor}", _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = perMinute,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
            });
        }
    }
}
