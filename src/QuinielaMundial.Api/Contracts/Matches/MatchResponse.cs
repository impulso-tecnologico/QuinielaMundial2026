namespace QuinielaMundial.Api.Contracts.Matches;

public sealed class MatchResponse
{
    public int Id { get; set; }
    public int MatchNumber { get; set; }
    public int StageId { get; set; }
    public string StageName { get; set; } = string.Empty;
    public string? Group { get; set; }
    public int? HomeTeamId { get; set; }
    public string HomeTeam { get; set; } = string.Empty;
    public int? AwayTeamId { get; set; }
    public string AwayTeam { get; set; } = string.Empty;
    public string Stadium { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public DateTime MatchDate { get; set; }
    public TimeSpan MatchTime { get; set; }
    public int? HomeScore { get; set; }
    public int? AwayScore { get; set; }
    public int? ResultRegisteredByParticipantId { get; set; }
    public string? ResultRegisteredByParticipantName { get; set; }
    public DateTime? ResultRegisteredAtUtc { get; set; }
}
