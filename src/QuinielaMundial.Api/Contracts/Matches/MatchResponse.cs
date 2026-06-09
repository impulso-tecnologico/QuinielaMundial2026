namespace QuinielaMundial.Api.Contracts.Matches;

public sealed record MatchResponse(
    int Id,
    int MatchNumber,
    string Group,
    string HomeTeam,
    string AwayTeam,
    string Stadium,
    string City,
    DateOnly MatchDate,
    TimeOnly MatchTime,
    int? HomeScore,
    int? AwayScore);
