namespace QuinielaMundial.Domain.Entities;

public sealed class TournamentStage
{
    public int Id { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public int SortOrder { get; set; }
}
