namespace QuinielaMundial.Api.Contracts.Matches;

public sealed class MatchParticipantResultResponse
{
    public string ParticipantName { get; set; } = string.Empty;
    public int HomeScore { get; set; }
    public int AwayScore { get; set; }
}
