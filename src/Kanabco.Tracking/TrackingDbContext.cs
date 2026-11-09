using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Kanabco.Tracking;

/// <summary>
/// The tracking tables, in the same database as the shop but with their own context and migrations
/// (history in <see cref="MigrationsHistoryTable"/>), so the shop's AppDbContext is not changed.
/// They refer to products, customers and orders by ID only.
/// </summary>
public class TrackingDbContext(DbContextOptions<TrackingDbContext> options) : DbContext(options)
{
    public const string MigrationsHistoryTable = "__TrackingMigrationsHistory";

    public DbSet<TrackingVisitor> TrackingVisitors => Set<TrackingVisitor>();
    public DbSet<TrackingEvent> TrackingEvents => Set<TrackingEvent>();
    public DbSet<TrackingEventItem> TrackingEventItems => Set<TrackingEventItem>();
    public DbSet<TrackingPageView> TrackingPageViews => Set<TrackingPageView>();
    public DbSet<TrackingClick> TrackingClicks => Set<TrackingClick>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);

        modelBuilder.Entity<TrackingVisitor>(e =>
        {
            e.ToTable("TrackingVisitors");
            e.HasKey(x => x.VisitorId);
            e.Property(x => x.ContactName).HasMaxLength(150);
            e.Property(x => x.ContactPhone).HasMaxLength(30);
            e.Property(x => x.ContactEmail).HasMaxLength(200);
            e.Property(x => x.FirstUtmSource).HasMaxLength(100);
            e.Property(x => x.FirstUtmMedium).HasMaxLength(100);
            e.Property(x => x.FirstUtmCampaign).HasMaxLength(200);
            e.HasIndex(x => x.CustomerId);
            e.HasIndex(x => x.ContactPhone);
        });

        modelBuilder.Entity<TrackingEvent>(e =>
        {
            e.ToTable("TrackingEvents");
            e.Property(x => x.EventType).HasMaxLength(32);
            e.Property(x => x.TotalValue).HasPrecision(18, 2);
            e.Property(x => x.PageUrl).HasMaxLength(500);
            e.Property(x => x.UtmSource).HasMaxLength(100);
            e.Property(x => x.UtmMedium).HasMaxLength(100);
            e.Property(x => x.UtmCampaign).HasMaxLength(200);
            e.Property(x => x.Fbclid).HasMaxLength(500);
            e.HasIndex(x => x.EventId).IsUnique();
            e.HasIndex(x => new { x.EventType, x.CreatedAtUtc });
            e.HasIndex(x => x.CheckoutToken);
            e.HasIndex(x => x.CustomerId);
            e.HasIndex(x => x.SessionId);
            e.HasOne(x => x.Visitor).WithMany(v => v.Events).HasForeignKey(x => x.VisitorId);
            e.HasMany(x => x.Items).WithOne().HasForeignKey(i => i.TrackingEventId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TrackingEventItem>(e =>
        {
            e.ToTable("TrackingEventItems");
            e.Property(x => x.ProductName).HasMaxLength(200);
            e.Property(x => x.VariantLabel).HasMaxLength(200);
            e.Property(x => x.UnitPrice).HasPrecision(18, 2);
            e.HasIndex(x => x.ProductId);
        });

        modelBuilder.Entity<TrackingPageView>(e =>
        {
            e.ToTable("TrackingPageViews");
            e.Property(x => x.PageType).HasMaxLength(20);
            e.Property(x => x.Path).HasMaxLength(300);
            e.Property(x => x.ReferrerHost).HasMaxLength(200);
            e.Property(x => x.UtmSource).HasMaxLength(100);
            e.Property(x => x.UtmCampaign).HasMaxLength(200);
            e.HasIndex(x => x.PageViewId).IsUnique();
            e.HasIndex(x => new { x.PageType, x.CreatedAtUtc });
            e.HasIndex(x => x.SessionId);
            e.HasIndex(x => x.ProductId);
        });

        modelBuilder.Entity<TrackingClick>(e =>
        {
            e.ToTable("TrackingClicks");
            e.Property(x => x.PageType).HasMaxLength(20);
            e.Property(x => x.Element).HasMaxLength(100);
            e.Property(x => x.TargetPath).HasMaxLength(300);
            e.HasIndex(x => x.ClickId).IsUnique();
            e.HasIndex(x => new { x.PageType, x.CreatedAtUtc });
            e.HasIndex(x => x.PageViewId);
        });
    }
}

/// <summary>For <c>dotnet ef migrations add</c> only: PostgreSQL, as in production (kanabco-postgres-prod). Nothing connects to it.</summary>
public sealed class TrackingDbContextDesignFactory : IDesignTimeDbContextFactory<TrackingDbContext>
{
    public TrackingDbContext CreateDbContext(string[] args) =>
        new(new DbContextOptionsBuilder<TrackingDbContext>()
            .UseNpgsql(
                "Host=localhost;Database=kanabco_design_time",
                pg => pg.MigrationsHistoryTable(TrackingDbContext.MigrationsHistoryTable))
            .Options);
}
