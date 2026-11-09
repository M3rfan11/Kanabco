namespace Kanabco.Tracking;

/// <summary>Whole days in Kanabco's time zone, as UTC instants for the queries.</summary>
public static class TrackingDates
{
    public const int MaxDays = 366;

    public static TimeZoneInfo Zone(string id)
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(id);
        }
        catch (TimeZoneNotFoundException) when (id == "Africa/Cairo")
        {
            // Windows without ICU knows Cairo by its Windows name only.
            return TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
        }
    }

    /// <summary>
    /// From the start of <paramref name="from"/> to the end of <paramref name="to"/>, local days both
    /// included; the last 30 days to today when not given; at most a year.
    /// </summary>
    public static (DateTime FromUtc, DateTime ToUtc) Range(DateOnly? from, DateOnly? to, TimeZoneInfo zone, DateTimeOffset now)
    {
        ArgumentNullException.ThrowIfNull(zone);
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(now, zone).DateTime);
        var last = to ?? today;
        var first = from ?? last.AddDays(-29);
        if (first > last)
        {
            (first, last) = (last, first);
        }
        if (last.DayNumber - first.DayNumber >= MaxDays)
        {
            first = last.AddDays(-(MaxDays - 1));
        }
        return (StartOf(first, zone), StartOf(last.AddDays(1), zone));
    }

    /// <summary>The first instant of a local day. Egypt moves its clocks at midnight, so a day can start at 01:00.</summary>
    public static DateTime StartOf(DateOnly day, TimeZoneInfo zone)
    {
        ArgumentNullException.ThrowIfNull(zone);
        var local = day.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
        while (zone.IsInvalidTime(local))
        {
            local = local.AddMinutes(30);
        }
        return TimeZoneInfo.ConvertTimeToUtc(local, zone);
    }
}
