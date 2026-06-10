namespace QuinielaMundial.Api.Contracts.Knockout;

public sealed class KnockoutBracketResponse
{
    public int Id { get; set; }
    public int ParticipantId { get; set; }
    public int BracketMatchNumber { get; set; }
    public string RoundName { get; set; } = string.Empty;
    public int? HomeTeamId { get; set; }
    public int? AwayTeamId { get; set; }
    public string HomeTeamName { get; set; } = string.Empty;
    public string AwayTeamName { get; set; } = string.Empty;
    public string? HomeSource { get; set; }
    public string? AwaySource { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
