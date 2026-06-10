using Dapper;
using Microsoft.AspNetCore.Mvc;
using QuinielaMundial.Api.Contracts.Knockout;
using QuinielaMundial.Infrastructure.Data;

namespace QuinielaMundial.Api.Controllers;

[ApiController]
[Route("api/participants/{participantId:int}/knockout-brackets")]
public sealed class KnockoutBracketsController(ISqlConnectionFactory connectionFactory) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<KnockoutBracketResponse>>> GetForParticipant(int participantId, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT Id, ParticipantId, BracketMatchNumber, RoundName, HomeTeamId, AwayTeamId,
                   HomeTeamName, AwayTeamName, HomeSource, AwaySource, UpdatedAtUtc
            FROM dbo.ParticipantKnockoutBrackets
            WHERE ParticipantId = @ParticipantId
            ORDER BY BracketMatchNumber;
            """;

        using var connection = connectionFactory.CreateConnection();
        var brackets = await connection.QueryAsync<KnockoutBracketResponse>(new CommandDefinition(
            sql,
            new { ParticipantId = participantId },
            cancellationToken: cancellationToken));

        return Ok(brackets.ToList());
    }

    [HttpPut]
    public async Task<ActionResult<IReadOnlyList<KnockoutBracketResponse>>> Upsert(
        int participantId,
        UpsertKnockoutBracketsRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Brackets is null)
        {
            return BadRequest("La lista de cruces es requerida.");
        }

        var validationError = Validate(request.Brackets);
        if (validationError is not null)
        {
            return BadRequest(validationError);
        }

        using var connection = connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        const string participantExistsSql = "SELECT COUNT(1) FROM dbo.Participants WHERE Id = @ParticipantId;";
        var participantExists = await connection.ExecuteScalarAsync<int>(new CommandDefinition(
            participantExistsSql,
            new { ParticipantId = participantId },
            transaction,
            cancellationToken: cancellationToken)) > 0;

        if (!participantExists)
        {
            return NotFound("Participante no encontrado.");
        }

        if (request.Brackets.Count == 0)
        {
            const string deleteAllSql = "DELETE FROM dbo.ParticipantKnockoutBrackets WHERE ParticipantId = @ParticipantId;";
            await connection.ExecuteAsync(new CommandDefinition(
                deleteAllSql,
                new { ParticipantId = participantId },
                transaction,
                cancellationToken: cancellationToken));
        }
        else
        {
            const string deleteStaleSql = """
                DELETE FROM dbo.ParticipantKnockoutBrackets
                WHERE ParticipantId = @ParticipantId
                  AND BracketMatchNumber NOT IN @BracketMatchNumbers;
                """;

            await connection.ExecuteAsync(new CommandDefinition(
                deleteStaleSql,
                new { ParticipantId = participantId, BracketMatchNumbers = request.Brackets.Select(bracket => bracket.BracketMatchNumber).ToArray() },
                transaction,
                cancellationToken: cancellationToken));
        }

        const string upsertSql = """
            DECLARE @HomeTeamId INT = (SELECT TOP (1) Id FROM dbo.Teams WHERE Name = @HomeTeamName);
            DECLARE @AwayTeamId INT = (SELECT TOP (1) Id FROM dbo.Teams WHERE Name = @AwayTeamName);

            MERGE dbo.ParticipantKnockoutBrackets AS target
            USING (SELECT @ParticipantId AS ParticipantId, @BracketMatchNumber AS BracketMatchNumber) AS source
                ON target.ParticipantId = source.ParticipantId AND target.BracketMatchNumber = source.BracketMatchNumber
            WHEN MATCHED THEN
                UPDATE SET RoundName = @RoundName,
                           HomeTeamId = @HomeTeamId,
                           AwayTeamId = @AwayTeamId,
                           HomeTeamName = @HomeTeamName,
                           AwayTeamName = @AwayTeamName,
                           HomeSource = @HomeSource,
                           AwaySource = @AwaySource,
                           UpdatedAtUtc = SYSUTCDATETIME()
            WHEN NOT MATCHED THEN
                INSERT (ParticipantId, BracketMatchNumber, RoundName, HomeTeamId, AwayTeamId, HomeTeamName, AwayTeamName, HomeSource, AwaySource)
                VALUES (@ParticipantId, @BracketMatchNumber, @RoundName, @HomeTeamId, @AwayTeamId, @HomeTeamName, @AwayTeamName, @HomeSource, @AwaySource);
            """;

        foreach (var bracket in request.Brackets)
        {
            await connection.ExecuteAsync(new CommandDefinition(
                upsertSql,
                new
                {
                    ParticipantId = participantId,
                    bracket.BracketMatchNumber,
                    RoundName = bracket.RoundName.Trim(),
                    HomeTeamName = bracket.HomeTeamName.Trim(),
                    AwayTeamName = bracket.AwayTeamName.Trim(),
                    HomeSource = Clean(bracket.HomeSource),
                    AwaySource = Clean(bracket.AwaySource)
                },
                transaction,
                cancellationToken: cancellationToken));
        }

        const string selectSql = """
            SELECT Id, ParticipantId, BracketMatchNumber, RoundName, HomeTeamId, AwayTeamId,
                   HomeTeamName, AwayTeamName, HomeSource, AwaySource, UpdatedAtUtc
            FROM dbo.ParticipantKnockoutBrackets
            WHERE ParticipantId = @ParticipantId
            ORDER BY BracketMatchNumber;
            """;

        var saved = await connection.QueryAsync<KnockoutBracketResponse>(new CommandDefinition(
            selectSql,
            new { ParticipantId = participantId },
            transaction,
            cancellationToken: cancellationToken));

        transaction.Commit();
        return Ok(saved.ToList());
    }

    private static string? Validate(IReadOnlyList<UpsertKnockoutBracketItem> brackets)
    {
        var repeated = brackets
            .GroupBy(bracket => bracket.BracketMatchNumber)
            .FirstOrDefault(group => group.Count() > 1);

        if (repeated is not null)
        {
            return $"El partido de eliminatoria {repeated.Key} está duplicado.";
        }

        foreach (var bracket in brackets)
        {
            if (bracket.BracketMatchNumber is < 1 or > 32)
            {
                return "El número de partido de eliminatoria debe estar entre 1 y 32.";
            }

            if (string.IsNullOrWhiteSpace(bracket.RoundName) || string.IsNullOrWhiteSpace(bracket.HomeTeamName) || string.IsNullOrWhiteSpace(bracket.AwayTeamName))
            {
                return "Ronda y equipos son requeridos para cada cruce.";
            }

            if (bracket.RoundName.Length > 80 || bracket.HomeTeamName.Length > 160 || bracket.AwayTeamName.Length > 160 || bracket.HomeSource?.Length > 120 || bracket.AwaySource?.Length > 120)
            {
                return "Uno o más campos de cruce exceden la longitud permitida.";
            }
        }

        return null;
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
