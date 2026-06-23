namespace QuinielaMundial.Api.Contracts.Highlights;

public sealed class HighlightWeeklyRiseResponse
{
    public string Name { get; set; } = string.Empty;
    public int PositionsGained { get; set; }
    public int PreviousPosition { get; set; }
    public int CurrentPosition { get; set; }
}
