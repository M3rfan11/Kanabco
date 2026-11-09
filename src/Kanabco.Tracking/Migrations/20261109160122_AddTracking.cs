using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Kanabco.Tracking.Migrations
{
    /// <inheritdoc />
    public partial class AddTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TrackingClicks",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClickId = table.Column<Guid>(type: "uuid", nullable: false),
                    PageViewId = table.Column<Guid>(type: "uuid", nullable: false),
                    VisitorId = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    PageType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Element = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ProductId = table.Column<int>(type: "integer", nullable: true),
                    TargetPath = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrackingClicks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TrackingPageViews",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PageViewId = table.Column<Guid>(type: "uuid", nullable: false),
                    VisitorId = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<int>(type: "integer", nullable: true),
                    PageType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ProductId = table.Column<int>(type: "integer", nullable: true),
                    Path = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    IsEntry = table.Column<bool>(type: "boolean", nullable: false),
                    ReferrerHost = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UtmSource = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    UtmCampaign = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ActiveSeconds = table.Column<int>(type: "integer", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrackingPageViews", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TrackingVisitors",
                columns: table => new
                {
                    VisitorId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<int>(type: "integer", nullable: true),
                    ContactName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    ContactPhone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    ContactEmail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    FirstUtmSource = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    FirstUtmMedium = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    FirstUtmCampaign = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    FirstSeenUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastSeenUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrackingVisitors", x => x.VisitorId);
                });

            migrationBuilder.CreateTable(
                name: "TrackingEvents",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<Guid>(type: "uuid", nullable: false),
                    EventType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    VisitorId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<int>(type: "integer", nullable: true),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: true),
                    CheckoutToken = table.Column<Guid>(type: "uuid", nullable: true),
                    OrderId = table.Column<int>(type: "integer", nullable: true),
                    SupersededAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TotalValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ItemCount = table.Column<int>(type: "integer", nullable: false),
                    PageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    UtmSource = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    UtmMedium = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    UtmCampaign = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Fbclid = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrackingEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrackingEvents_TrackingVisitors_VisitorId",
                        column: x => x.VisitorId,
                        principalTable: "TrackingVisitors",
                        principalColumn: "VisitorId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TrackingEventItems",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TrackingEventId = table.Column<long>(type: "bigint", nullable: false),
                    ProductId = table.Column<int>(type: "integer", nullable: false),
                    VariantId = table.Column<int>(type: "integer", nullable: true),
                    ProductName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    VariantLabel = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrackingEventItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrackingEventItems_TrackingEvents_TrackingEventId",
                        column: x => x.TrackingEventId,
                        principalTable: "TrackingEvents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TrackingClicks_ClickId",
                table: "TrackingClicks",
                column: "ClickId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TrackingClicks_PageType_CreatedAtUtc",
                table: "TrackingClicks",
                columns: new[] { "PageType", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_TrackingClicks_PageViewId",
                table: "TrackingClicks",
                column: "PageViewId");

            migrationBuilder.CreateIndex(
                name: "IX_TrackingEventItems_ProductId",
                table: "TrackingEventItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_TrackingEventItems_TrackingEventId",
                table: "TrackingEventItems",
                column: "TrackingEventId");

            migrationBuilder.CreateIndex(
                name: "IX_TrackingEvents_CheckoutToken",
                table: "TrackingEvents",
                column: "CheckoutToken");

            migrationBuilder.CreateIndex(
                name: "IX_TrackingEvents_CustomerId",
                table: "TrackingEvents",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_TrackingEvents_EventId",
                table: "TrackingEvents",
                column: "EventId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TrackingEvents_EventType_CreatedAtUtc",
                table: "TrackingEvents",
                columns: new[] { "EventType", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_TrackingEvents_SessionId",
                table: "TrackingEvents",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_TrackingEvents_VisitorId",
                table: "TrackingEvents",
                column: "VisitorId");

            migrationBuilder.CreateIndex(
                name: "IX_TrackingPageViews_PageType_CreatedAtUtc",
                table: "TrackingPageViews",
                columns: new[] { "PageType", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_TrackingPageViews_PageViewId",
                table: "TrackingPageViews",
                column: "PageViewId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TrackingPageViews_ProductId",
                table: "TrackingPageViews",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_TrackingPageViews_SessionId",
                table: "TrackingPageViews",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_TrackingVisitors_ContactPhone",
                table: "TrackingVisitors",
                column: "ContactPhone");

            migrationBuilder.CreateIndex(
                name: "IX_TrackingVisitors_CustomerId",
                table: "TrackingVisitors",
                column: "CustomerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TrackingClicks");

            migrationBuilder.DropTable(
                name: "TrackingEventItems");

            migrationBuilder.DropTable(
                name: "TrackingPageViews");

            migrationBuilder.DropTable(
                name: "TrackingEvents");

            migrationBuilder.DropTable(
                name: "TrackingVisitors");
        }
    }
}
