# Kanabco Tracking: API module

The backend half of the admin Tracking tab: add-to-carts, initiated checkouts, product page bounce
rate and time, homepage clicks. It follows the Tracking Tab Implementation Guide (November 2026),
with the fixes from its review (listed at the end).

It is a self-contained module: its own tables, its own `TrackingDbContext` and migration, and
minimal-API endpoints. The shop's `AppDbContext` and existing tables are not changed.

## Plugging it into the Kanabco API

1. Reference the project (or copy `src/Kanabco.Tracking` into the solution).

2. `Program.cs`:

   ```csharp
   builder.Services.AddKanabcoTracking(
       builder.Configuration.GetConnectionString("DefaultConnection")!,
       o =>
       {
           // Who may open the tab: the Tracking permission of Roles & Permissions.
           o.ViewPolicy = p => p.RequireAuthenticatedUser().RequireAssertion(ctx => /* has Tracking:Read */ true);
           // The customer's ID from the API's login token (default: the NameIdentifier claim).
           o.CustomerId = user => int.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
       });
   builder.Services.AddScoped<ITrackingLookups, TrackingLookups>();

   // ... after app.UseCors(...), app.UseAuthentication(), app.UseAuthorization():
   app.UseRateLimiter();
   app.MapKanabcoTracking();
   ```

   `ViewPolicy` is required; the API will not start without it.

3. `TrackingLookups` (in the API project) implements `ITrackingLookups` over the real Products,
   ProductVariants and Customers tables: the selling price shown on the site, and customer name,
   phone and email. It is the only code that reads the shop's tables.

4. In the order code, once the order is real (paid, or confirmed for cash on delivery):

   ```csharp
   await _conversions.MarkPurchasedAsync(request.CheckoutToken, order.Id, customerId, ct); // ITrackingConversions
   ```

   and add `public Guid? CheckoutToken { get; set; }` to the order request. It never throws.

5. Create the tables:

   ```
   dotnet ef database update --project <the API project> --context TrackingDbContext
   ```

   or run `AddTracking.sql`, the same migration as a SQL script.

6. CORS: the storefront's address must be in the API's CORS policy. The storefront sends no
   cookies and no extra headers to these endpoints.

7. Behind Cloudflare, nginx or IIS, turn on forwarded headers with the proxy's addresses, so rate
   limits see each shopper's own address.

## Endpoints

| Method | Path | Access |
| --- | --- | --- |
| POST | /api/tracking/events | Public, 60 a minute per browser |
| POST | /api/tracking/identify | Public, same limit |
| POST | /api/tracking/pageview | Public, 240 a minute per browser |
| POST | /api/tracking/engagement | Public, same limit |
| POST | /api/tracking/click | Public, same limit |
| GET | /api/admin/tracking/summary | Tracking.View |
| GET | /api/admin/tracking/add-to-carts | Tracking.View |
| GET | /api/admin/tracking/checkouts | Tracking.View |
| GET | /api/admin/tracking/product-pages | Tracking.View |
| GET | /api/admin/tracking/homepage | Tracking.View |

Admin filters: `from` and `to` are dates (yyyy-MM-dd), whole Cairo days, both included;
`search`, `status` (all, purchased, not_purchased), `sort` (views, bounce, add_to_cart),
`page`, `pageSize`.

Public endpoints answer 202 even when a write fails (logged), and 400 for a request that is not a
valid one, so tracking cannot break the shop. `engagement` and `click` also accept a plain-text JSON
body: the storefront sends them as beacons, the one request browsers still deliver while a page closes.

## What differs from the guide, and why

- **Own context and migration** instead of editing `AppDbContext`: the module drops in, and a tracking
  write never shares a transaction with an order.
- **Rate limits per browser and address**, not per address only: many shoppers on an Egyptian mobile
  network share one address. The browser sends its visitor ID as `?vid=`.
- **A changed cart replaces the earlier checkout** of the same visit, and a purchase closes the
  shopper's other open checkouts, so Initiated Checkouts, Checkout Value and the follow-up list are
  not inflated by carts that were simply edited.
- **The order hook never throws**, so a tracking failure cannot turn a saved order into an error and
  a duplicate order.
- **Duplicates arriving at the same moment** (a retry, a double click, a new visitor's first two events)
  are stored once instead of logged as failures. Clicks carry their own ID for the same reason.
- **Dates are Cairo days** chosen in the API, whatever the admin's computer is set to; the day Egypt
  moves its clocks at midnight is handled.
- **Highest bounce rate** lists products with at least 5 landings first.
- **Homepage time**: views whose time never came back are shown as "Not measured", not "Under 10 s".
- **Tracking.View must be set**, wired to the Tracking permission, rather than defaulting to any admin.

## Trying it on one machine

`samples/DevHost` is a stand-in for Kanabco's API: this module plus the few shop endpoints the
storefront and admin page call (a product, sign-in tokens, placing an order). It is for trying the
storefront branch `claude/tracking-tab` locally, not for production.

```
dotnet run --project samples/DevHost --urls http://localhost:8080
```

Then run the storefront (`npm run build && npx next start -p 3000`) and
`node samples/DevHost/browser-check.js <folder for screenshots>`: it shops as three visitors (one
orders, one bounces, one leaves at checkout), then opens the Tracking tab as staff with and without
the permission.

## Tests

`dotnet test` runs 20 tests against PostgreSQL (`KB_TEST_PG` sets the server; default
`Host=localhost;Username=kbtest;Password=kbtest`). Production runs on SQL Server; the queries are
the same LINQ.
