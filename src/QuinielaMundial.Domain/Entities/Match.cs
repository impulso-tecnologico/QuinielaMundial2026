namespace QuinielaMundial.Domain.Entities;

public sealed class Match
{
    public int Id { get; set; }
    public int MatchNumber { get; set; }
    public int StageId { get; set; }
    public required string Group { get; set; }
    public int? HomeTeamId { get; set; }
    public int? AwayTeamId { get; set; }
    public string? HomePlaceholder { get; set; }
    public string? AwayPlaceholder { get; set; }
    public string? HomeTeam { get; set; }
    public string? AwayTeam { get; set; }
    public required string Stadium { get; set; }
    public required string City { get; set; }
    public DateTime MatchDate { get; set; }
    public TimeSpan MatchTime { get; set; }
    public int? HomeScore { get; set; }
    public int? AwayScore { get; set; }
    public int? ResultRegisteredByParticipantId { get; set; }
    public DateTime? ResultRegisteredAtUtc { get; set; }

    public ICollection<Prediction> Predictions { get; set; } = [];
}
