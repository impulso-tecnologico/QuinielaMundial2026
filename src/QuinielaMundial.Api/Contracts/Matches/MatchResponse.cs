namespace QuinielaMundial.Api.Contracts.Matches;

public sealed record MatchResponse(
    int Id,
    int MatchNumber,
    int StageId,
    string StageName,
    string Group,
    int? HomeTeamId,
    string HomeTeam,
    int? AwayTeamId,
    string AwayTeam,
    string Stadium,
    string City,
    DateTime MatchDate,
    TimeSpan MatchTime,
    int? HomeScore,
    int? AwayScore,
    int? ResultRegisteredByParticipantId,
    string? ResultRegisteredByParticipantName,
    DateTime? ResultRegisteredAtUtc);
