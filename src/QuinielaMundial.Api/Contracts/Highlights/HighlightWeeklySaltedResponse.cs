namespace QuinielaMundial.Api.Contracts.Highlights;

public sealed class HighlightWeeklySaltedResponse
{
    public string Name { get; set; } = string.Empty;
    public int CorrectPredictions { get; set; }
    public int EvaluatedMatches { get; set; }
}
