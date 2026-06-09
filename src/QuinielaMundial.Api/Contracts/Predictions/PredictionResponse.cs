namespace QuinielaMundial.Api.Contracts.Predictions;

public sealed record PredictionResponse(
    int Id,
    int ParticipantId,
    int MatchId,
    int? HomeScore,
    int? AwayScore,
    int? Points,
    DateTime UpdatedAtUtc);
