namespace QuinielaMundial.Api.Contracts.Highlights;

public sealed class HighlightMatchResponse
{
    public string Name { get; set; } = string.Empty;
    public int Predictions { get; set; }
}
