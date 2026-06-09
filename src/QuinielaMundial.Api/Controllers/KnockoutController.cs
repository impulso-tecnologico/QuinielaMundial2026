using Dapper;
using Microsoft.AspNetCore.Mvc;
using QuinielaMundial.Api.Contracts.Knockout;
using QuinielaMundial.Domain.Entities;
using QuinielaMundial.Infrastructure.Data;

namespace QuinielaMundial.Api.Controllers;

[ApiController]
[Route("api/knockout")]
public sealed class KnockoutController(ISqlConnectionFactory connectionFactory) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<KnockoutMatchResponse>>> GetProjectedBracket(CancellationToken cancellationToken)
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

        if (matches.Count == 0)
        {
            return Ok(Array.Empty<KnockoutMatchResponse>());
        }

        if (matches.Any(x => x.HomeScore is null || x.AwayScore is null))
        {
            return BadRequest("Captura todos los resultados de fase de grupos antes de generar la llave.");
        }

        var standings = StandingsBuilder.Build(matches);
        var qualified = standings.Values
            .SelectMany(group => group.Take(3))
            .GroupBy(team => team.Position)
            .SelectMany(group => group.Key switch
            {
                1 => group.OrderByDescending(x => x.Points).ThenByDescending(x => x.GoalDifference).ThenByDescending(x => x.GoalsFor).ThenBy(x => x.GoalsAgainst).ThenBy(x => x.Team),
                2 => group.OrderByDescending(x => x.Points).ThenByDescending(x => x.GoalDifference).ThenByDescending(x => x.GoalsFor).ThenBy(x => x.GoalsAgainst).ThenBy(x => x.Team),
                _ => group.OrderByDescending(x => x.Points).ThenByDescending(x => x.GoalDifference).ThenByDescending(x => x.GoalsFor).ThenBy(x => x.GoalsAgainst).ThenBy(x => x.Team).Take(8)
            })
            .ToList();

        var seedPairs = new[]
        {
            (1, 32), (16, 17), (8, 25), (9, 24),
            (4, 29), (13, 20), (5, 28), (12, 21),
            (2, 31), (15, 18), (7, 26), (10, 23),
            (3, 30), (14, 19), (6, 27), (11, 22)
        };

        var response = seedPairs.Select((pair, index) =>
        {
            var home = qualified[pair.Item1 - 1];
            var away = qualified[pair.Item2 - 1];
            return new KnockoutMatchResponse(
                $"D{index + 1}",
                "Dieciseisavos",
                home.Team,
                $"{home.Position} Grupo {home.Group}",
                away.Team,
                $"{away.Position} Grupo {away.Group}");
        }).ToList();

        return Ok(response);
    }
}
