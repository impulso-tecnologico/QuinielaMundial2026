namespace QuinielaMundial.Api.Contracts.Knockout;

public sealed class KnockoutPredictionResponse
{
    public int Id { get; set; }
    public int ParticipantId { get; set; }
    public int BracketMatchNumber { get; set; }
    public int? HomeScore { get; set; }
    public int? AwayScore { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
