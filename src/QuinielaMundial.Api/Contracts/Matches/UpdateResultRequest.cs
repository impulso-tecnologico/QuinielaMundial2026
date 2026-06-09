namespace QuinielaMundial.Api.Contracts.Matches;

public sealed record UpdateResultRequest(int? HomeScore, int? AwayScore, int RegisteredByParticipantId);
