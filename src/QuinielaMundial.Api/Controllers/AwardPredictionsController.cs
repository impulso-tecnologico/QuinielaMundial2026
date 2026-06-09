using Dapper;
using Microsoft.AspNetCore.Mvc;
using QuinielaMundial.Api.Contracts.Awards;
using QuinielaMundial.Infrastructure.Data;

namespace QuinielaMundial.Api.Controllers;

[ApiController]
[Route("api/participants/{participantId:int}/award-predictions")]
public sealed class AwardPredictionsController(ISqlConnectionFactory connectionFactory) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<AwardPredictionResponse?>> GetForParticipant(int participantId, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT Id, ParticipantId, BallonDOr, GoldenBoot, GoldenGlove, UpdatedAtUtc
            FROM dbo.AwardPredictions
            WHERE ParticipantId = @ParticipantId;
            """;

        using var connection = connectionFactory.CreateConnection();
        var prediction = await connection.QueryFirstOrDefaultAsync<AwardPredictionResponse>(new CommandDefinition(
            sql,
            new { ParticipantId = participantId },
            cancellationToken: cancellationToken));

        return Ok(prediction);
    }

    [HttpPut]
    public async Task<ActionResult<AwardPredictionResponse>> Upsert(
        int participantId,
        UpsertAwardPredictionRequest request,
        CancellationToken cancellationToken)
    {
        static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        var ballonDOr = Clean(request.BallonDOr);
        var goldenBoot = Clean(request.GoldenBoot);
        var goldenGlove = Clean(request.GoldenGlove);

        if (ballonDOr?.Length > 160 || goldenBoot?.Length > 160 || goldenGlove?.Length > 160)
        {
            return BadRequest("Cada premio debe tener 160 caracteres o menos.");
        }

        const string sql = """
            IF NOT EXISTS (SELECT 1 FROM dbo.Participants WHERE Id = @ParticipantId)
            BEGIN
                SELECT CAST(NULL AS INT) AS Id, @ParticipantId AS ParticipantId,
                       @BallonDOr AS BallonDOr, @GoldenBoot AS GoldenBoot, @GoldenGlove AS GoldenGlove,
                       SYSUTCDATETIME() AS UpdatedAtUtc
                WHERE 1 = 0;
                RETURN;
            END;

            MERGE dbo.AwardPredictions AS target
            USING (SELECT @ParticipantId AS ParticipantId) AS source
                ON target.ParticipantId = source.ParticipantId
            WHEN MATCHED THEN
                UPDATE SET BallonDOr = @BallonDOr, GoldenBoot = @GoldenBoot, GoldenGlove = @GoldenGlove, UpdatedAtUtc = SYSUTCDATETIME()
            WHEN NOT MATCHED THEN
                INSERT (ParticipantId, BallonDOr, GoldenBoot, GoldenGlove)
                VALUES (@ParticipantId, @BallonDOr, @GoldenBoot, @GoldenGlove)
            OUTPUT INSERTED.Id, INSERTED.ParticipantId, INSERTED.BallonDOr, INSERTED.GoldenBoot, INSERTED.GoldenGlove, INSERTED.UpdatedAtUtc;
            """;

        using var connection = connectionFactory.CreateConnection();
        var saved = await connection.QueryFirstOrDefaultAsync<AwardPredictionResponse>(new CommandDefinition(
            sql,
            new { ParticipantId = participantId, BallonDOr = ballonDOr, GoldenBoot = goldenBoot, GoldenGlove = goldenGlove },
            cancellationToken: cancellationToken));

        if (saved is null)
        {
            return NotFound("Participante no encontrado.");
        }

        return Ok(saved);
    }
}
