namespace QuinielaMundial.Api.Contracts.Awards;

public sealed class AwardFinalScoreboardResponse
{
    public int MaxPoints { get; set; }
    public IReadOnlyList<AwardFinalResultResponse> Awards { get; set; } = [];
    public IReadOnlyList<AwardParticipantScoreResponse> ParticipantScores { get; set; } = [];
}

public sealed class AwardFinalResultResponse
{
    public string AwardCode { get; set; } = string.Empty;
    public string AwardName { get; set; } = string.Empty;
    public string WinnerName { get; set; } = string.Empty;
    public int Points { get; set; }
    public int CorrectPredictions { get; set; }
}

public sealed class AwardParticipantScoreResponse
{
    public int ParticipantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int AwardPoints { get; set; }
    public int CorrectAwards { get; set; }
    public bool BallonDOrCorrect { get; set; }
    public bool GoldenBootCorrect { get; set; }
    public bool GoldenGloveCorrect { get; set; }
}
