using Dapper;
using Microsoft.AspNetCore.Mvc;
using QuinielaMundial.Api.Contracts.Matches;
using QuinielaMundial.Infrastructure.Data;

namespace QuinielaMundial.Api.Controllers;

[ApiController]
[Route("api/matches")]
public sealed class MatchesController(ISqlConnectionFactory connectionFactory) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MatchResponse>>> GetAll([FromQuery] string? group, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                m.Id,
                m.MatchNumber,
                m.StageId,
                s.Name AS StageName,
                m.[Group],
                m.HomeTeamId,
                COALESCE(ht.Name, m.HomePlaceholder) AS HomeTeam,
                m.AwayTeamId,
                COALESCE(at.Name, m.AwayPlaceholder) AS AwayTeam,
                m.Stadium,
                m.City,
                m.MatchDate,
                m.MatchTime,
                m.HomeScore,
                m.AwayScore,
                m.ResultRegisteredByParticipantId,
                rp.Name AS ResultRegisteredByParticipantName,
                m.ResultRegisteredAtUtc
            FROM dbo.Matches m
            INNER JOIN dbo.TournamentStages s ON s.Id = m.StageId
            LEFT JOIN dbo.Teams ht ON ht.Id = m.HomeTeamId
            LEFT JOIN dbo.Teams at ON at.Id = m.AwayTeamId
            LEFT JOIN dbo.Participants rp ON rp.Id = m.ResultRegisteredByParticipantId
            WHERE @Group IS NULL OR m.[Group] = @Group
            ORDER BY m.MatchNumber;
            """;

        using var connection = connectionFactory.CreateConnection();
        var matches = await connection.QueryAsync<MatchResponse>(new CommandDefinition(
            sql,
            new { Group = string.IsNullOrWhiteSpace(group) ? null : group.Trim().ToUpper() },
            cancellationToken: cancellationToken));

        return Ok(matches.ToList());
    }

    [HttpPut("{matchId:int}/result")]
    public async Task<IActionResult> UpdateResult(int matchId, UpdateResultRequest request, CancellationToken cancellationToken)
    {
        if (request.HomeScore < 0 || request.AwayScore < 0)
        {
            return BadRequest("Los marcadores no pueden ser negativos.");
        }

        if (request.RegisteredByParticipantId <= 0)
        {
            return BadRequest("Debes indicar el participante que registra el resultado.");
        }

        const string sql = """
            IF NOT EXISTS (SELECT 1 FROM dbo.Participants WHERE Id = @RegisteredByParticipantId)
            BEGIN
                SELECT CAST(-1 AS INT);
                RETURN;
            END;

            UPDATE dbo.Matches
            SET HomeScore = @HomeScore,
                AwayScore = @AwayScore,
                ResultRegisteredByParticipantId = @RegisteredByParticipantId,
                ResultRegisteredAtUtc = SYSUTCDATETIME()
            WHERE Id = @MatchId;

            SELECT @@ROWCOUNT;
            """;

        using var connection = connectionFactory.CreateConnection();
        var affectedRows = await connection.ExecuteScalarAsync<int>(new CommandDefinition(
            sql,
            new { MatchId = matchId, request.HomeScore, request.AwayScore, request.RegisteredByParticipantId },
            cancellationToken: cancellationToken));

        if (affectedRows == -1)
        {
            return BadRequest("El participante que registra el resultado no existe.");
        }

        if (affectedRows == 0)
        {
            return NotFound();
        }

        return NoContent();
    }
}
