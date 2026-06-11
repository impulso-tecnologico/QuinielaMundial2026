namespace QuinielaMundial.Api.Contracts.Highlights;

public sealed class PublicHighlightsResponse
{
    public HighlightVoteResponse? FinalWinner { get; set; }
    public HighlightVoteResponse? BallonDOr { get; set; }
}
