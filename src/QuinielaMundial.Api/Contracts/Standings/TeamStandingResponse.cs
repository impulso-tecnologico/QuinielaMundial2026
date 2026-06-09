namespace QuinielaMundial.Api.Contracts.Standings;

public sealed record TeamStandingResponse(
    string Team,
    string Group,
    int Played,
    int Points,
    int GoalsFor,
    int GoalsAgainst,
    int GoalDifference,
    int Position);
