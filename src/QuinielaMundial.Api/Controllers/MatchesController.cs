using Dapper;
using Microsoft.AspNetCore.Mvc;
using QuinielaMundial.Api.Contracts.Matches;
using QuinielaMundial.Infrastructure.Data;

namespace QuinielaMundial.Api.Controllers;

[ApiController]
[Route("api/matches")]
public sealed class MatchesController(ISqlConnectionFactory connectionFactory) : ControllerBase
{
    [HttpGet("prediction-percentages")]
    public async Task<ActionResult<IReadOnlyList<MatchPredictionPercentagesResponse>>> GetPredictionPercentages(CancellationToken cancellationToken)
    {
        const string sql = """
            WITH Totals AS
            (
                SELECT
                    MatchId,
                    COUNT(1) AS TotalPredictions,
                    SUM(CASE WHEN HomeScore > AwayScore THEN 1 ELSE 0 END) AS HomeWinPredictions,
                    SUM(CASE WHEN HomeScore = AwayScore THEN 1 ELSE 0 END) AS DrawPredictions,
                    SUM(CASE WHEN AwayScore > HomeScore THEN 1 ELSE 0 END) AS AwayWinPredictions
                FROM dbo.Predictions
                WHERE HomeScore IS NOT NULL
                  AND AwayScore IS NOT NULL
                GROUP BY MatchId
            )
            SELECT
                MatchId,
                TotalPredictions,
                HomeWinPredictions,
                DrawPredictions,
                AwayWinPredictions,
                CAST(ROUND(100.0 * HomeWinPredictions / NULLIF(TotalPredictions, 0), 0) AS INT) AS HomeWinPercentage,
                CAST(ROUND(100.0 * DrawPredictions / NULLIF(TotalPredictions, 0), 0) AS INT) AS DrawPercentage,
                CAST(ROUND(100.0 * AwayWinPredictions / NULLIF(TotalPredictions, 0), 0) AS INT) AS AwayWinPercentage
            FROM Totals
            ORDER BY MatchId;
            """;

        using var connection = connectionFactory.CreateConnection();
        var percentages = await connection.QueryAsync<MatchPredictionPercentagesResponse>(new CommandDefinition(
            sql,
            cancellationToken: cancellationToken));

        return Ok(percentages.ToList());
    }

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

    [HttpGet("{matchId:int}/participant-results")]
    public async Task<ActionResult<IReadOnlyList<MatchParticipantResultResponse>>> GetParticipantResults(int matchId, CancellationToken cancellationToken)
    {
        const string matchExistsSql = "SELECT COUNT(1) FROM dbo.Matches WHERE Id = @MatchId;";
        const string sql = """
            WITH MatchInfo AS
            (
                SELECT Id, BracketMatchNumber
                FROM dbo.Matches
                WHERE Id = @MatchId
            ), Results AS
            (
                SELECT
                    pa.Name AS ParticipantName,
                    p.HomeScore,
                    p.AwayScore
                FROM MatchInfo mi
                INNER JOIN dbo.Predictions p
                    ON mi.BracketMatchNumber IS NULL
                   AND p.MatchId = mi.Id
                INNER JOIN dbo.Participants pa ON pa.Id = p.ParticipantId
                WHERE p.HomeScore IS NOT NULL
                  AND p.AwayScore IS NOT NULL

                UNION ALL

                SELECT
                    pa.Name AS ParticipantName,
                    kp.HomeScore,
                    kp.AwayScore
                FROM MatchInfo mi
                INNER JOIN dbo.KnockoutPredictions kp
                    ON mi.BracketMatchNumber IS NOT NULL
                   AND kp.BracketMatchNumber = mi.BracketMatchNumber
                INNER JOIN dbo.Participants pa ON pa.Id = kp.ParticipantId
                WHERE kp.HomeScore IS NOT NULL
                  AND kp.AwayScore IS NOT NULL
            )
            SELECT ParticipantName, HomeScore, AwayScore
            FROM Results
            ORDER BY ParticipantName;
            """;

        using var connection = connectionFactory.CreateConnection();
        var matchExists = await connection.ExecuteScalarAsync<int>(new CommandDefinition(
            matchExistsSql,
            new { MatchId = matchId },
            cancellationToken: cancellationToken)) > 0;

        if (!matchExists)
        {
            return NotFound("Partido no encontrado.");
        }

        var results = await connection.QueryAsync<MatchParticipantResultResponse>(new CommandDefinition(
            sql,
            new { MatchId = matchId },
            cancellationToken: cancellationToken));

        return Ok(results.ToList());
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
