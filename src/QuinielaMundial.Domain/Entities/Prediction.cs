namespace QuinielaMundial.Domain.Entities;

public sealed class Prediction
{
    public int Id { get; set; }
    public int ParticipantId { get; set; }
    public int MatchId { get; set; }
    public int? HomeScore { get; set; }
    public int? AwayScore { get; set; }
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public Participant? Participant { get; set; }
    public Match? Match { get; set; }
}
