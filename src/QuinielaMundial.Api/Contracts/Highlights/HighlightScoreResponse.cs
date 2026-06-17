namespace QuinielaMundial.Api.Contracts.Highlights;

public sealed class HighlightScoreResponse
{
    public string Score { get; set; } = string.Empty;
    public int Predictions { get; set; }
}
