namespace QuinielaMundial.Api.Contracts.Participants;

public sealed record ParticipantResponse(int Id, string Name, string? Email, DateTime CreatedAtUtc);
