namespace QuinielaMundial.Api.Contracts.Knockout;

public sealed record UpsertKnockoutBracketsRequest(IReadOnlyList<UpsertKnockoutBracketItem> Brackets);

public sealed record UpsertKnockoutBracketItem(
    int BracketMatchNumber,
    string RoundName,
    string HomeTeamName,
    string AwayTeamName,
    string? HomeSource,
    string? AwaySource);
