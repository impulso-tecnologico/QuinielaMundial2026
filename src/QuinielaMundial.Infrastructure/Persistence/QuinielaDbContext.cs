using Microsoft.EntityFrameworkCore;
using QuinielaMundial.Domain.Entities;

namespace QuinielaMundial.Infrastructure.Persistence;

public sealed class QuinielaDbContext(DbContextOptions<QuinielaDbContext> options) : DbContext(options)
{
    public DbSet<Participant> Participants => Set<Participant>();
    public DbSet<Match> Matches => Set<Match>();
    public DbSet<Prediction> Predictions => Set<Prediction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Participant>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(180);
            entity.HasIndex(x => x.Email).IsUnique().HasFilter("[Email] IS NOT NULL");
        });

        modelBuilder.Entity<Match>(entity =>
        {
            entity.Property(x => x.Group).HasMaxLength(2).IsRequired();
            entity.Property(x => x.HomeTeam).HasMaxLength(100).IsRequired();
            entity.Property(x => x.AwayTeam).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Stadium).HasMaxLength(140).IsRequired();
            entity.Property(x => x.City).HasMaxLength(120).IsRequired();
            entity.HasIndex(x => x.MatchNumber).IsUnique();
        });

        modelBuilder.Entity<Prediction>(entity =>
        {
            entity.HasIndex(x => new { x.ParticipantId, x.MatchId }).IsUnique();
            entity.HasOne(x => x.Participant)
                .WithMany(x => x.Predictions)
                .HasForeignKey(x => x.ParticipantId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Match)
                .WithMany(x => x.Predictions)
                .HasForeignKey(x => x.MatchId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
