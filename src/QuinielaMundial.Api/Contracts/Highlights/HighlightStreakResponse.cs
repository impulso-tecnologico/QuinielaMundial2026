namespace QuinielaMundial.Api.Contracts.Highlights;

public sealed class HighlightStreakResponse
{
    public IReadOnlyList<string> Names { get; set; } = Array.Empty<string>();
    public int Streak { get; set; }
}
