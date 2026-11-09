// A stand-in for Kanabco's API: the tracking module plugged in the way the real API will plug it in,
// plus the few shop endpoints the storefront and the admin page call. For trying it on one machine only.
//
//   KB_DEV_PG="Host=localhost;Username=kbtest;Password=kbtest;Database=kb_devhost" dotnet run --urls http://localhost:8080
//
// Sign-in tokens (sessionStorage authToken): staff-tracking (has Tracking.Read), staff-plain (does not), customer-42.
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Text.Json;
using Kanabco.Tracking;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);
var database = Environment.GetEnvironmentVariable("KB_DEV_PG") ?? "Host=localhost;Username=kbtest;Password=kbtest;Database=kb_devhost";

builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
    .WithOrigins(Environment.GetEnvironmentVariable("KB_DEV_ORIGIN") ?? "http://localhost:3000")
    .AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddAuthentication("Dev").AddScheme<AuthenticationSchemeOptions, DevTokens>("Dev", _ => { });
builder.Services.AddKanabcoTracking(
    db => db.UseNpgsql(database),
    o =>
    {
        o.ViewPolicy = p => p.RequireClaim("permission", "Tracking.Read");
        // Staff are signed in too; only customers count as the person shopping.
        o.CustomerId = user => user.HasClaim("kind", "customer") ? TrackingOptions.DefaultCustomerId(user) : null;
    });
builder.Services.AddScoped<ITrackingLookups, DevCatalogue>();

var app = builder.Build();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapKanabcoTracking();

await app.Services.MigrateKanabcoTrackingAsync();

// ---------- The shop endpoints the pages call ----------

app.MapGet("/api/Product/{id:int}", (int id) => DevCatalogue.Products.TryGetValue(id, out var p)
    ? Results.Ok(new
    {
        id, name = p.Name, description = "A stand-in product.", price = p.Price, imageUrl = (string?)null, mediaUrls = (string?)null,
        variantAttributes = "[\"Color\"]", categoryName = "Sofas", sku = $"KB-{id}",
        variants = p.Colors.Select(c => new
        {
            id = c.VariantId, color = c.Name, colorHex = c.Hex, attributes = JsonSerializer.Serialize(new Dictionary<string, string> { ["Color"] = c.Name }),
            imageUrl = (string?)null, mediaUrls = (string?)null, priceOverride = c.Price, sku = $"KB-{id}-{c.VariantId}",
            isActive = true, quantity = 5, isOutOfStock = false, isAvailable = true,
        }),
    })
    : Results.NotFound());

app.MapGet("/api/Auth/me", (ClaimsPrincipal user) => user.Identity?.IsAuthenticated == true
    ? Results.Ok(new { email = user.FindFirstValue(ClaimTypes.Email), roles = user.FindAll(ClaimTypes.Role).Select(r => r.Value) })
    : Results.Unauthorized());

app.MapGet("/api/permissions/my-permissions", (ClaimsPrincipal user) => Results.Ok(
    user.HasClaim("permission", "Tracking.Read")
        ? new Dictionary<string, string[]> { ["Tracking"] = ["Read"] }
        : new Dictionary<string, string[]>()));

var orders = 1000;
async Task<IResult> PlaceOrder(JsonElement body, ClaimsPrincipal user, ITrackingConversions conversions, CancellationToken ct)
{
    var orderId = Interlocked.Increment(ref orders);
    // The real order code: once the order is real, mark the checkout it came from.
    Guid? token = body.TryGetProperty("checkoutToken", out var t) && t.ValueKind == JsonValueKind.String && Guid.TryParse(t.GetString(), out var g) ? g : null;
    int? customer = user.HasClaim("kind", "customer") ? TrackingOptions.DefaultCustomerId(user) : null;
    await conversions.MarkPurchasedAsync(token, orderId, customer, ct);
    return Results.Ok(new { orderNumber = $"KB-{orderId}", orderId });
}
app.MapPost("/api/CustomerOrder/guest-order", PlaceOrder);
app.MapPost("/api/CustomerOrder/order", PlaceOrder);

app.Run();

/// <summary>Bearer tokens for trying it out: staff-tracking, staff-plain, customer-42.</summary>
sealed class DevTokens(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var header = Request.Headers.Authorization.ToString();
        if (!header.StartsWith("Bearer ", StringComparison.Ordinal))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }
        var claims = header[7..] switch
        {
            "staff-tracking" => new[] { new Claim(ClaimTypes.NameIdentifier, "900"), new Claim(ClaimTypes.Email, "marketing@kanabco.net"), new Claim(ClaimTypes.Role, "Marketing"), new Claim("permission", "Tracking.Read") },
            "staff-plain" => [new Claim(ClaimTypes.NameIdentifier, "901"), new Claim(ClaimTypes.Email, "warehouse@kanabco.net"), new Claim(ClaimTypes.Role, "Warehouse")],
            "customer-42" => [new Claim(ClaimTypes.NameIdentifier, "42"), new Claim(ClaimTypes.Email, "mona@example.com"), new Claim("kind", "customer")],
            _ => null,
        };
        return Task.FromResult(claims is null
            ? AuthenticateResult.Fail("unknown token")
            : AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(new ClaimsIdentity(claims, "Dev")), "Dev")));
    }
}

/// <summary>Stand-in products and customers; the real API reads its own tables.</summary>
sealed class DevCatalogue : ITrackingLookups
{
    public sealed record Colour(int VariantId, string Name, string Hex, decimal? Price);
    public sealed record Product(string Name, decimal Price, Colour[] Colors);

    public static readonly Dictionary<int, Product> Products = new()
    {
        [1] = new("Nile Sofa", 24000m, [new(10, "Green velvet", "#2f5d3a", 26500m), new(11, "Sand linen", "#d8c7a6", null)]),
        [2] = new("Zamalek Chair", 6500m, [new(20, "Terracotta", "#c05a3c", null)]),
        [3] = new("Maadi Table", 9000m, [new(30, "Walnut", "#5b3a29", null)]),
    };

    public Task<Dictionary<(int ProductId, int? VariantId), PricedProduct>> GetPricesAsync(IReadOnlyCollection<(int ProductId, int? VariantId)> keys, CancellationToken ct)
    {
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
            else if (p.Colors.FirstOrDefault(c => c.VariantId == key.VariantId) is { } c)
            {
                result[key] = new PricedProduct(p.Name, c.Name, c.Price ?? p.Price);
            }
        }
        return Task.FromResult(result);
    }

    public Task<Dictionary<int, CustomerInfo>> GetCustomersAsync(IReadOnlyCollection<int> customerIds, CancellationToken ct) =>
        Task.FromResult(customerIds.Where(id => id == 42).ToDictionary(id => id, _ => new CustomerInfo("Mona Adel", "01001234567", "mona@example.com")));

    public Task<List<int>> SearchCustomerIdsAsync(string term, CancellationToken ct) =>
        Task.FromResult("Mona Adel".Contains(term, StringComparison.OrdinalIgnoreCase) ? new List<int> { 42 } : []);
}
