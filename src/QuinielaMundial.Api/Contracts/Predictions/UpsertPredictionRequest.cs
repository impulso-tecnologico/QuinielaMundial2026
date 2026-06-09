namespace QuinielaMundial.Api.Contracts.Predictions;

public sealed record UpsertPredictionRequest(int? HomeScore, int? AwayScore);
