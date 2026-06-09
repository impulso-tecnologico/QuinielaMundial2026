using Dapper;
using Microsoft.AspNetCore.Mvc;
using QuinielaMundial.Api.Contracts.Standings;
using QuinielaMundial.Domain.Entities;
using QuinielaMundial.Infrastructure.Data;

namespace QuinielaMundial.Api.Controllers;

[ApiController]
[Route("api/standings")]
public sealed class StandingsController(ISqlConnectionFactory connectionFactory) : ControllerBase
{
    [HttpGet("groups")]
    public async Task<ActionResult<IReadOnlyDictionary<string, IReadOnlyList<TeamStandingResponse>>>> GetGroups(CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                m.Id,
                m.MatchNumber,
                m.StageId,
                m.[Group],
                m.HomeTeamId,
                ht.Name AS HomeTeam,
                m.AwayTeamId,
                at.Name AS AwayTeam,
                m.Stadium,
                m.City,
                m.MatchDate,
                m.MatchTime,
                m.HomeScore,
                m.AwayScore
            FROM dbo.Matches m
            INNER JOIN dbo.TournamentStages s ON s.Id = m.StageId
            LEFT JOIN dbo.Teams ht ON ht.Id = m.HomeTeamId
            LEFT JOIN dbo.Teams at ON at.Id = m.AwayTeamId
            WHERE s.Code = 'GROUPS'
            ORDER BY m.MatchNumber;
            """;

        using var connection = connectionFactory.CreateConnection();
        var matches = (await connection.QueryAsync<Match>(new CommandDefinition(sql, cancellationToken: cancellationToken))).ToList();
        var standings = StandingsBuilder.Build(matches);

        return Ok(standings);
    }
}
