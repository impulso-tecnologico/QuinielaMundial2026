namespace QuinielaMundial.Domain.Entities;

public sealed class Match
{
    public int Id { get; set; }
    public int MatchNumber { get; set; }
    public required string Group { get; set; }
    public required string HomeTeam { get; set; }
    public required string AwayTeam { get; set; }
    public required string Stadium { get; set; }
    public required string City { get; set; }
    public DateOnly MatchDate { get; set; }
    public TimeOnly MatchTime { get; set; }
    public int? HomeScore { get; set; }
    public int? AwayScore { get; set; }

    public ICollection<Prediction> Predictions { get; set; } = [];
}
