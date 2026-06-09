namespace QuinielaMundial.Domain.Entities;

public sealed class Participant
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Email { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<Prediction> Predictions { get; set; } = [];
}
