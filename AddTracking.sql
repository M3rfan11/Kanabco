IF OBJECT_ID(N'[__TrackingMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__TrackingMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___TrackingMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__TrackingMigrationsHistory]
    WHERE [MigrationId] = N'20261109141713_AddTracking'
)
BEGIN
    CREATE TABLE [TrackingClicks] (
        [Id] bigint NOT NULL IDENTITY,
        [ClickId] uniqueidentifier NOT NULL,
        [PageViewId] uniqueidentifier NOT NULL,
        [VisitorId] uniqueidentifier NOT NULL,
        [SessionId] uniqueidentifier NOT NULL,
        [PageType] nvarchar(20) NOT NULL,
        [Element] nvarchar(100) NOT NULL,
        [ProductId] int NULL,
        [TargetPath] nvarchar(300) NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_TrackingClicks] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__TrackingMigrationsHistory]
    WHERE [MigrationId] = N'20261109141713_AddTracking'
)
BEGIN
    CREATE TABLE [TrackingPageViews] (
        [Id] bigint NOT NULL IDENTITY,
        [PageViewId] uniqueidentifier NOT NULL,
        [VisitorId] uniqueidentifier NOT NULL,
        [SessionId] uniqueidentifier NOT NULL,
        [CustomerId] int NULL,
        [PageType] nvarchar(20) NOT NULL,
        [ProductId] int NULL,
        [Path] nvarchar(300) NULL,
        [IsEntry] bit NOT NULL,
        [ReferrerHost] nvarchar(200) NULL,
        [UtmSource] nvarchar(100) NULL,
        [UtmCampaign] nvarchar(200) NULL,
        [ActiveSeconds] int NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_TrackingPageViews] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__TrackingMigrationsHistory]
    WHERE [MigrationId] = N'20261109141713_AddTracking'
)
BEGIN
    CREATE TABLE [TrackingVisitors] (
        [VisitorId] uniqueidentifier NOT NULL,
        [CustomerId] int NULL,
        [ContactName] nvarchar(150) NULL,
        [ContactPhone] nvarchar(30) NULL,
        [ContactEmail] nvarchar(200) NULL,
        [FirstUtmSource] nvarchar(100) NULL,
        [FirstUtmMedium] nvarchar(100) NULL,
        [FirstUtmCampaign] nvarchar(200) NULL,
        [FirstSeenUtc] datetime2 NOT NULL,
        [LastSeenUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_TrackingVisitors] PRIMARY KEY ([VisitorId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__TrackingMigrationsHistory]
    WHERE [MigrationId] = N'20261109141713_AddTracking'
)
BEGIN
    CREATE TABLE [TrackingEvents] (
        [Id] bigint NOT NULL IDENTITY,
        [EventId] uniqueidentifier NOT NULL,
        [EventType] nvarchar(32) NOT NULL,
        [VisitorId] uniqueidentifier NOT NULL,
        [CustomerId] int NULL,
        [SessionId] uniqueidentifier NULL,
        [CheckoutToken] uniqueidentifier NULL,
        [OrderId] int NULL,
        [SupersededAtUtc] datetime2 NULL,
        [TotalValue] decimal(18,2) NOT NULL,
        [ItemCount] int NOT NULL,
        [PageUrl] nvarchar(500) NULL,
        [UtmSource] nvarchar(100) NULL,
        [UtmMedium] nvarchar(100) NULL,
        [UtmCampaign] nvarchar(200) NULL,
        [Fbclid] nvarchar(500) NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_TrackingEvents] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TrackingEvents_TrackingVisitors_VisitorId] FOREIGN KEY ([VisitorId]) REFERENCES [TrackingVisitors] ([VisitorId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__TrackingMigrationsHistory]
    WHERE [MigrationId] = N'20261109141713_AddTracking'
)
BEGIN
    CREATE TABLE [TrackingEventItems] (
        [Id] bigint NOT NULL IDENTITY,
        [TrackingEventId] bigint NOT NULL,
        [ProductId] int NOT NULL,
        [VariantId] int NULL,
        [ProductName] nvarchar(200) NOT NULL,
        [VariantLabel] nvarchar(200) NULL,
        [Quantity] int NOT NULL,
        [UnitPrice] decimal(18,2) NOT NULL,
        CONSTRAINT [PK_TrackingEventItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TrackingEventItems_TrackingEvents_TrackingEventId] FOREIGN KEY ([TrackingEventId]) REFERENCES [TrackingEvents] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__TrackingMigrationsHistory]
    WHERE [MigrationId] = N'20261109141713_AddTracking'
)
BEGIN
    CREATE UNIQUE INDEX [IX_TrackingClicks_ClickId] ON [TrackingClicks] ([ClickId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__TrackingMigrationsHistory]
    WHERE [MigrationId] = N'20261109141713_AddTracking'
)
BEGIN
    CREATE INDEX [IX_TrackingClicks_PageType_CreatedAtUtc] ON [TrackingClicks] ([PageType], [CreatedAtUtc]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__TrackingMigrationsHistory]
    WHERE [MigrationId] = N'20261109141713_AddTracking'
)
BEGIN
    CREATE INDEX [IX_TrackingClicks_PageViewId] ON [TrackingClicks] ([PageViewId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__TrackingMigrationsHistory]
    WHERE [MigrationId] = N'20261109141713_AddTracking'
)
BEGIN
    CREATE INDEX [IX_TrackingEventItems_ProductId] ON [TrackingEventItems] ([ProductId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__TrackingMigrationsHistory]
    WHERE [MigrationId] = N'20261109141713_AddTracking'
)
BEGIN
    CREATE INDEX [IX_TrackingEventItems_TrackingEventId] ON [TrackingEventItems] ([TrackingEventId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__TrackingMigrationsHistory]
    WHERE [MigrationId] = N'20261109141713_AddTracking'
)
BEGIN
    CREATE INDEX [IX_TrackingEvents_CheckoutToken] ON [TrackingEvents] ([CheckoutToken]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__TrackingMigrationsHistory]
    WHERE [MigrationId] = N'20261109141713_AddTracking'
)
BEGIN
    CREATE INDEX [IX_TrackingEvents_CustomerId] ON [TrackingEvents] ([CustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__TrackingMigrationsHistory]
    WHERE [MigrationId] = N'20261109141713_AddTracking'
)
BEGIN
    CREATE UNIQUE INDEX [IX_TrackingEvents_EventId] ON [TrackingEvents] ([EventId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__TrackingMigrationsHistory]
    WHERE [MigrationId] = N'20261109141713_AddTracking'
)
BEGIN
    CREATE INDEX [IX_TrackingEvents_EventType_CreatedAtUtc] ON [TrackingEvents] ([EventType], [CreatedAtUtc]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__TrackingMigrationsHistory]
    WHERE [MigrationId] = N'20261109141713_AddTracking'
)
BEGIN
    CREATE INDEX [IX_TrackingEvents_SessionId] ON [TrackingEvents] ([SessionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__TrackingMigrationsHistory]
    WHERE [MigrationId] = N'20261109141713_AddTracking'
)
BEGIN
    CREATE INDEX [IX_TrackingEvents_VisitorId] ON [TrackingEvents] ([VisitorId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__TrackingMigrationsHistory]
    WHERE [MigrationId] = N'20261109141713_AddTracking'
)
BEGIN
    CREATE INDEX [IX_TrackingPageViews_PageType_CreatedAtUtc] ON [TrackingPageViews] ([PageType], [CreatedAtUtc]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__TrackingMigrationsHistory]
    WHERE [MigrationId] = N'20261109141713_AddTracking'
)
BEGIN
    CREATE UNIQUE INDEX [IX_TrackingPageViews_PageViewId] ON [TrackingPageViews] ([PageViewId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__TrackingMigrationsHistory]
    WHERE [MigrationId] = N'20261109141713_AddTracking'
)
BEGIN
    CREATE INDEX [IX_TrackingPageViews_ProductId] ON [TrackingPageViews] ([ProductId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__TrackingMigrationsHistory]
    WHERE [MigrationId] = N'20261109141713_AddTracking'
)
BEGIN
    CREATE INDEX [IX_TrackingPageViews_SessionId] ON [TrackingPageViews] ([SessionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__TrackingMigrationsHistory]
    WHERE [MigrationId] = N'20261109141713_AddTracking'
)
BEGIN
    CREATE INDEX [IX_TrackingVisitors_ContactPhone] ON [TrackingVisitors] ([ContactPhone]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__TrackingMigrationsHistory]
    WHERE [MigrationId] = N'20261109141713_AddTracking'
)
BEGIN
    CREATE INDEX [IX_TrackingVisitors_CustomerId] ON [TrackingVisitors] ([CustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__TrackingMigrationsHistory]
    WHERE [MigrationId] = N'20261109141713_AddTracking'
)
BEGIN
    INSERT INTO [__TrackingMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261109141713_AddTracking', N'8.0.11');
END;
GO

COMMIT;
GO

