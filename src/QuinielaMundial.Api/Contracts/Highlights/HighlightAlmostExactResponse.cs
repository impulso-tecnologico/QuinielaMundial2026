namespace QuinielaMundial.Api.Contracts.Highlights;

public sealed class HighlightAlmostExactResponse
{
    public string Name { get; set; } = string.Empty;
    public int NearMisses { get; set; }
}
