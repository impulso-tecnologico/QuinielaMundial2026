namespace QuinielaMundial.Api.Contracts.Awards;

public sealed record UpsertAwardPredictionRequest(
    string? BallonDOr,
    string? GoldenBoot,
    string? GoldenGlove);
