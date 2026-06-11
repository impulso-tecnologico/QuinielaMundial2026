namespace QuinielaMundial.Api.Contracts.Matches;

public sealed class MatchPredictionPercentagesResponse
{
    public int MatchId { get; set; }
    public int TotalPredictions { get; set; }
    public int HomeWinPredictions { get; set; }
    public int DrawPredictions { get; set; }
    public int AwayWinPredictions { get; set; }
    public int HomeWinPercentage { get; set; }
    public int DrawPercentage { get; set; }
    public int AwayWinPercentage { get; set; }
}
