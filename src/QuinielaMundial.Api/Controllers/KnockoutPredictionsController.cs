using Dapper;
using Microsoft.AspNetCore.Mvc;
using QuinielaMundial.Api.Contracts.Knockout;
using QuinielaMundial.Infrastructure.Data;

namespace QuinielaMundial.Api.Controllers;

[ApiController]
[Route("api/participants/{participantId:int}/knockout-predictions")]
public sealed class KnockoutPredictionsController(ISqlConnectionFactory connectionFactory) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<KnockoutPredictionResponse>>> GetForParticipant(int participantId, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT Id, ParticipantId, BracketMatchNumber, HomeScore, AwayScore, UpdatedAtUtc
            FROM dbo.KnockoutPredictions
            WHERE ParticipantId = @ParticipantId
            ORDER BY BracketMatchNumber;
            """;

        using var connection = connectionFactory.CreateConnection();
        var predictions = await connection.QueryAsync<KnockoutPredictionResponse>(new CommandDefinition(
            sql,
            new { ParticipantId = participantId },
            cancellationToken: cancellationToken));

        return Ok(predictions.ToList());
    }

    [HttpPut("{bracketMatchNumber:int}")]
    public async Task<ActionResult<KnockoutPredictionResponse>> Upsert(
        int participantId,
        int bracketMatchNumber,
        UpsertKnockoutPredictionRequest request,
        CancellationToken cancellationToken)
    {
        if (bracketMatchNumber is < 1 or > 32)
        {
            return BadRequest("El número de partido de eliminatoria debe estar entre 1 y 32.");
        }

        if (request.HomeScore < 0 || request.AwayScore < 0)
        {
            return BadRequest("Los marcadores no pueden ser negativos.");
        }

        const string sql = """
            IF NOT EXISTS (SELECT 1 FROM dbo.Participants WHERE Id = @ParticipantId)
            BEGIN
                SELECT CAST(NULL AS INT) AS Id, @ParticipantId AS ParticipantId, @BracketMatchNumber AS BracketMatchNumber,
                       @HomeScore AS HomeScore, @AwayScore AS AwayScore, SYSUTCDATETIME() AS UpdatedAtUtc
                WHERE 1 = 0;
                RETURN;
            END;

            MERGE dbo.KnockoutPredictions AS target
            USING (SELECT @ParticipantId AS ParticipantId, @BracketMatchNumber AS BracketMatchNumber) AS source
                ON target.ParticipantId = source.ParticipantId AND target.BracketMatchNumber = source.BracketMatchNumber
            WHEN MATCHED THEN
                UPDATE SET HomeScore = @HomeScore, AwayScore = @AwayScore, UpdatedAtUtc = SYSUTCDATETIME()
            WHEN NOT MATCHED THEN
                INSERT (ParticipantId, BracketMatchNumber, HomeScore, AwayScore)
                VALUES (@ParticipantId, @BracketMatchNumber, @HomeScore, @AwayScore)
            OUTPUT INSERTED.Id, INSERTED.ParticipantId, INSERTED.BracketMatchNumber, INSERTED.HomeScore, INSERTED.AwayScore, INSERTED.UpdatedAtUtc;
            """;

        using var connection = connectionFactory.CreateConnection();
        var saved = await connection.QueryFirstOrDefaultAsync<KnockoutPredictionResponse>(new CommandDefinition(
            sql,
            new { ParticipantId = participantId, BracketMatchNumber = bracketMatchNumber, request.HomeScore, request.AwayScore },
            cancellationToken: cancellationToken));

        if (saved is null)
        {
            return NotFound("Participante no encontrado.");
        }

        return Ok(saved);
    }
}
