using Dapper;
using Microsoft.AspNetCore.Mvc;
using QuinielaMundial.Api.Contracts.Predictions;
using QuinielaMundial.Infrastructure.Data;

namespace QuinielaMundial.Api.Controllers;

[ApiController]
[Route("api/participants/{participantId:int}/predictions")]
public sealed class PredictionsController(ISqlConnectionFactory connectionFactory) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PredictionResponse>>> GetForParticipant(int participantId, CancellationToken cancellationToken)
    {
        using var connection = connectionFactory.CreateConnection();

        const string existsSql = "SELECT COUNT(1) FROM dbo.Participants WHERE Id = @ParticipantId;";
        var exists = await connection.ExecuteScalarAsync<int>(new CommandDefinition(
            existsSql,
            new { ParticipantId = participantId },
            cancellationToken: cancellationToken)) > 0;

        if (!exists)
        {
            return NotFound("Participante no encontrado.");
        }

        const string sql = """
            SELECT
                p.Id,
                p.ParticipantId,
                p.MatchId,
                p.HomeScore,
                p.AwayScore,
                CASE
                    WHEN p.HomeScore IS NULL OR p.AwayScore IS NULL OR m.HomeScore IS NULL OR m.AwayScore IS NULL THEN NULL
                    WHEN p.HomeScore = m.HomeScore AND p.AwayScore = m.AwayScore THEN 3
                    WHEN SIGN(p.HomeScore - p.AwayScore) = SIGN(m.HomeScore - m.AwayScore) THEN 1
                    ELSE 0
                END AS Points,
                p.UpdatedAtUtc
            FROM dbo.Predictions p
            INNER JOIN dbo.Matches m ON m.Id = p.MatchId
            WHERE p.ParticipantId = @ParticipantId
            ORDER BY m.MatchNumber;
            """;

        var predictions = await connection.QueryAsync<PredictionResponse>(new CommandDefinition(
            sql,
            new { ParticipantId = participantId },
            cancellationToken: cancellationToken));

        return Ok(predictions.ToList());
    }

    [HttpPut("{matchId:int}")]
    public async Task<ActionResult<PredictionResponse>> Upsert(
        int participantId,
        int matchId,
        UpsertPredictionRequest request,
        CancellationToken cancellationToken)
    {
        if (request.HomeScore < 0 || request.AwayScore < 0)
        {
            return BadRequest("Los marcadores no pueden ser negativos.");
        }

        using var connection = connectionFactory.CreateConnection();

        const string participantExistsSql = "SELECT COUNT(1) FROM dbo.Participants WHERE Id = @ParticipantId;";
        var participantExists = await connection.ExecuteScalarAsync<int>(new CommandDefinition(
            participantExistsSql,
            new { ParticipantId = participantId },
            cancellationToken: cancellationToken)) > 0;

        if (!participantExists)
        {
            return NotFound("Participante no encontrado.");
        }

        const string matchExistsSql = "SELECT COUNT(1) FROM dbo.Matches WHERE Id = @MatchId;";
        var matchExists = await connection.ExecuteScalarAsync<int>(new CommandDefinition(
            matchExistsSql,
            new { MatchId = matchId },
            cancellationToken: cancellationToken)) > 0;

        if (!matchExists)
        {
            return NotFound("Partido no encontrado.");
        }

        const string sql = """
            MERGE dbo.Predictions AS target
            USING (SELECT @ParticipantId AS ParticipantId, @MatchId AS MatchId) AS source
                ON target.ParticipantId = source.ParticipantId AND target.MatchId = source.MatchId
            WHEN MATCHED THEN
                UPDATE SET HomeScore = @HomeScore, AwayScore = @AwayScore, UpdatedAtUtc = SYSUTCDATETIME()
            WHEN NOT MATCHED THEN
                INSERT (ParticipantId, MatchId, HomeScore, AwayScore)
                VALUES (@ParticipantId, @MatchId, @HomeScore, @AwayScore)
            OUTPUT INSERTED.Id, INSERTED.ParticipantId, INSERTED.MatchId, INSERTED.HomeScore, INSERTED.AwayScore, INSERTED.UpdatedAtUtc;
            """;

        var saved = await connection.QuerySingleAsync<SavedPrediction>(new CommandDefinition(
            sql,
            new { ParticipantId = participantId, MatchId = matchId, request.HomeScore, request.AwayScore },
            cancellationToken: cancellationToken));

        const string pointsSql = """
            SELECT CASE
                WHEN p.HomeScore IS NULL OR p.AwayScore IS NULL OR m.HomeScore IS NULL OR m.AwayScore IS NULL THEN NULL
                WHEN p.HomeScore = m.HomeScore AND p.AwayScore = m.AwayScore THEN 3
                WHEN SIGN(p.HomeScore - p.AwayScore) = SIGN(m.HomeScore - m.AwayScore) THEN 1
                ELSE 0
            END
            FROM dbo.Predictions p
            INNER JOIN dbo.Matches m ON m.Id = p.MatchId
            WHERE p.Id = @PredictionId;
            """;

        var points = await connection.ExecuteScalarAsync<int?>(new CommandDefinition(
            pointsSql,
            new { PredictionId = saved.Id },
            cancellationToken: cancellationToken));

        return Ok(new PredictionResponse(saved.Id, saved.ParticipantId, saved.MatchId, saved.HomeScore, saved.AwayScore, points, saved.UpdatedAtUtc));
    }

    private sealed record SavedPrediction(int Id, int ParticipantId, int MatchId, int? HomeScore, int? AwayScore, DateTime UpdatedAtUtc);
}
