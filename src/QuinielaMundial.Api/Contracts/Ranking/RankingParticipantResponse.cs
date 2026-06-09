namespace QuinielaMundial.Api.Contracts.Ranking;

public sealed class RankingParticipantResponse
{
    public int Position { get; set; }
    public int ParticipantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Points { get; set; }
    public int ExactScores { get; set; }
    public int CorrectResults { get; set; }
    public int PredictionsScored { get; set; }
}
