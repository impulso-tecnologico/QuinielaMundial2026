namespace QuinielaMundial.Api.Contracts.Highlights;

public sealed class PublicHighlightsResponse
{
    public HighlightVoteResponse? FinalWinner { get; set; }
    public HighlightVoteResponse? BallonDOr { get; set; }
    public HighlightGoalsResponse? MostPredictedGoals { get; set; }
    public HighlightGoalsResponse? FewestPredictedGoals { get; set; }
}
