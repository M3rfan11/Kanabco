using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Npgsql;
using Xunit;

namespace Kanabco.Tracking.Tests;

/// <summary>
/// A small host API with the module plugged in the way Kanabco's API will plug it in, on its own
/// PostgreSQL database. Tests sign in with the X-Test-User and X-Test-Permission headers.
/// </summary>
public class TrackingApp : IAsyncLifetime
{
    public const string Permission = "Tracking.Read";

    private readonly string _database = "kb_tracking_" + Guid.NewGuid().ToString("N")[..12];
    private WebApplication? _app;

    public static string Server => Environment.GetEnvironmentVariable("KB_TEST_PG") ?? "Host=localhost;Username=kbtest;Password=kbtest";

    public ManualClock Clock { get; } = new(new DateTimeOffset(2026, 3, 1, 10, 0, 0, TimeSpan.Zero));
    public FakeLookups Lookups { get; } = new();
    public HttpClient Client { get; private set; } = null!;
    public int EventsPerMinute { get; protected init; } = 1000;

    public async Task InitializeAsync()
    {
        await using (var admin = new NpgsqlConnection(Server + ";Database=postgres"))
        {
            await admin.OpenAsync();
            await using var create = new NpgsqlCommand($"CREATE DATABASE {_database}", admin);
            await create.ExecuteNonQueryAsync();
        }

        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseTestServer();
        builder.Logging.ClearProviders();
        builder.Services.AddSingleton<TimeProvider>(Clock);
        builder.Services.AddAuthentication(TestAuth.Scheme).AddScheme<AuthenticationSchemeOptions, TestAuth>(TestAuth.Scheme, _ => { });
        builder.Services.AddKanabcoTracking(
            db => db.UseNpgsql(Server + $";Database={_database}"),
            o =>
            {
                o.ViewPolicy = p => p.RequireClaim("permission", Permission);
                o.EventsPerMinute = EventsPerMinute;
            });
        builder.Services.AddSingleton<ITrackingLookups>(Lookups);

        _app = builder.Build();
        _app.UseAuthentication();
        _app.UseAuthorization();
        _app.UseRateLimiter();
        _app.MapKanabcoTracking();
        await _app.StartAsync();
        Client = _app.GetTestClient();

        await using var scope = _app.Services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<TrackingDbContext>().Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        if (_app is not null)
        {
            await _app.StopAsync();
            await _app.DisposeAsync();
        }
        NpgsqlConnection.ClearAllPools();
        await using var admin = new NpgsqlConnection(Server + ";Database=postgres");
        await admin.OpenAsync();
        await using var drop = new NpgsqlCommand($"DROP DATABASE IF EXISTS {_database} WITH (FORCE)", admin);
        await drop.ExecuteNonQueryAsync();
    }

    public async Task<T> InScopeAsync<T>(Func<IServiceProvider, Task<T>> work)
    {
        await using var scope = _app!.Services.CreateAsyncScope();
        return await work(scope.ServiceProvider);
    }

    /// <summary>Puts the clock on a day of its own, so each test's counts are its own.</summary>
    public DateOnly UseDay(int day, int hourUtc = 10)
    {
        Clock.SetUtcNow(new DateTimeOffset(2026, 3, day, hourUtc, 0, 0, TimeSpan.Zero));
        return new DateOnly(2026, 3, day);
    }

    public Task<HttpResponseMessage> PostAsync(string path, object body, Guid? visitor = null, int? customer = null)
    {
        var url = visitor is { } v ? $"{path}?vid={v}" : path;
        var request = new HttpRequestMessage(HttpMethod.Post, url) { Content = JsonContent.Create(body) };
        if (customer is { } c)
        {
            request.Headers.Add("X-Test-User", c.ToString(System.Globalization.CultureInfo.InvariantCulture));
        }
        return Client.SendAsync(request);
    }

    public async Task<T> AdminGetAsync<T>(string path)
    {
        using var response = await AdminSendAsync(path);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<T>())!;
    }

    public Task<HttpResponseMessage> AdminSendAsync(string path, bool signedIn = true, bool permitted = true)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, path);
        if (signedIn)
        {
            request.Headers.Add("X-Test-User", "900");
        }
        if (permitted)
        {
            request.Headers.Add("X-Test-Permission", Permission);
        }
        return Client.SendAsync(request);
    }
}

/// <summary>A clock the tests set, back or forth.</summary>
public sealed class ManualClock(DateTimeOffset now) : TimeProvider
{
    private DateTimeOffset _now = now;

    public override DateTimeOffset GetUtcNow() => _now;

    public void SetUtcNow(DateTimeOffset value) => _now = value;

    public void Advance(TimeSpan by) => _now += by;
}

/// <summary>The shop's catalogue and customers, as the host's ITrackingLookups would read them.</summary>
public sealed class FakeLookups : ITrackingLookups
{
    public const int Sofa = 1, Chair = 2, Table = 3, Lamp = 4, Rug = 5, Broken = 666;
    public const int SofaGreenVelvet = 10;
    public const int Mona = 42;

    private static readonly Dictionary<int, (string Name, decimal Price)> Products = new()
    {
        [Sofa] = ("Nile Sofa", 24000m),
        [Chair] = ("Zamalek Chair", 6500m),
        [Table] = ("Maadi Table", 9000m),
        [Lamp] = ("Siwa Lamp", 1800m),
        [Rug] = ("Fayoum Rug", 3200m),
    };

    public Task<Dictionary<(int ProductId, int? VariantId), PricedProduct>> GetPricesAsync(
        IReadOnlyCollection<(int ProductId, int? VariantId)> keys, CancellationToken ct)
    {
        if (keys.Any(k => k.ProductId == Broken))
        {
            throw new InvalidOperationException("the catalogue is down");
        }
        var result = new Dictionary<(int, int?), PricedProduct>();
        foreach (var key in keys)
        {
            if (!Products.TryGetValue(key.ProductId, out var p))
            {
                continue;
            }
            if (key.VariantId is null)
            {
                result[key] = new PricedProduct(p.Name, null, p.Price);
            }
            else if (key is (Sofa, SofaGreenVelvet))
            {
                result[key] = new PricedProduct(p.Name, "Green velvet", 26500m);
            }
        }
        return Task.FromResult(result);
    }

    public Task<Dictionary<int, CustomerInfo>> GetCustomersAsync(IReadOnlyCollection<int> customerIds, CancellationToken ct) =>
        Task.FromResult(customerIds.Where(id => id == Mona)
            .ToDictionary(id => id, _ => new CustomerInfo("Mona Adel", "01001234567", "mona@example.com")));

    public Task<List<int>> SearchCustomerIdsAsync(string term, CancellationToken ct) =>
        Task.FromResult("Mona Adel".Contains(term, StringComparison.OrdinalIgnoreCase) ? new List<int> { Mona } : []);
}

/// <summary>Signs a request in from test headers: X-Test-User is the customer ID, X-Test-Permission a permission claim.</summary>
public sealed class TestAuth(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string Scheme = "Test";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("X-Test-User", out var user))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }
        var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, user.ToString()) };
        if (Request.Headers.TryGetValue("X-Test-Permission", out var permission))
        {
            claims.Add(new Claim("permission", permission.ToString()));
        }
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, Scheme));
        return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(principal, Scheme)));
    }
}
