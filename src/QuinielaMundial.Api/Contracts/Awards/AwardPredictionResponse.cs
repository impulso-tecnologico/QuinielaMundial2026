namespace QuinielaMundial.Api.Contracts.Awards;

public sealed record AwardPredictionResponse(
    int Id,
    int ParticipantId,
    string? BallonDOr,
    string? GoldenBoot,
    string? GoldenGlove,
    DateTime UpdatedAtUtc);
