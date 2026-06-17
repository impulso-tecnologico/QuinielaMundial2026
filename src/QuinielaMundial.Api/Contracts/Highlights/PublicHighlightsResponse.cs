namespace QuinielaMundial.Api.Contracts.Highlights;

public sealed class PublicHighlightsResponse
{
    public HighlightVoteResponse? FinalWinner { get; set; }
    public HighlightVoteResponse? BallonDOr { get; set; }
    public HighlightScoreResponse? MostPopularScore { get; set; }
    public HighlightMatchResponse? MostDividedMatch { get; set; }
    public HighlightAlmostExactResponse? AlmostExactKing { get; set; }
    public HighlightWeeklySaltedResponse? WeeklySalted { get; set; }
    public HighlightExactScoreResponse? ExactScoreWizard { get; set; }
}
