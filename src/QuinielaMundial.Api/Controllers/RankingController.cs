using Dapper;
using Microsoft.AspNetCore.Mvc;
using QuinielaMundial.Api.Contracts.Ranking;
using QuinielaMundial.Infrastructure.Data;

namespace QuinielaMundial.Api.Controllers;

[ApiController]
[Route("api/ranking")]
public sealed class RankingController(ISqlConnectionFactory connectionFactory) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RankingParticipantResponse>>> Get(CancellationToken cancellationToken)
    {
        const string sql = """
            WITH ScoredPredictions AS
            (
                SELECT
                    pa.Id AS ParticipantId,
                    pa.Name,
                    CASE
                        WHEN p.Id IS NULL OR p.HomeScore IS NULL OR p.AwayScore IS NULL OR m.HomeScore IS NULL OR m.AwayScore IS NULL THEN 0
                        ELSE
                            CASE WHEN SIGN(p.HomeScore - p.AwayScore) = SIGN(m.HomeScore - m.AwayScore) THEN 1 ELSE 0 END +
                            CASE WHEN p.HomeScore = m.HomeScore AND p.AwayScore = m.AwayScore THEN 1 ELSE 0 END
                    END AS Points,
                    CASE
                        WHEN p.Id IS NOT NULL AND p.HomeScore = m.HomeScore AND p.AwayScore = m.AwayScore THEN 1
                        ELSE 0
                    END AS ExactScore,
                    CASE
                        WHEN p.Id IS NOT NULL AND p.HomeScore IS NOT NULL AND p.AwayScore IS NOT NULL
                             AND m.HomeScore IS NOT NULL AND m.AwayScore IS NOT NULL
                             AND SIGN(p.HomeScore - p.AwayScore) = SIGN(m.HomeScore - m.AwayScore) THEN 1
                        ELSE 0
                    END AS CorrectResult,
                    CASE
                        WHEN p.Id IS NOT NULL AND p.HomeScore IS NOT NULL AND p.AwayScore IS NOT NULL
                             AND m.HomeScore IS NOT NULL AND m.AwayScore IS NOT NULL THEN 1
                        ELSE 0
                    END AS PredictionScored
                FROM dbo.Participants pa
                LEFT JOIN dbo.Predictions p ON p.ParticipantId = pa.Id
                LEFT JOIN dbo.Matches m ON m.Id = p.MatchId
            ), Totals AS
            (
                SELECT
                    ParticipantId,
                    Name,
                    SUM(Points) AS Points,
                    SUM(ExactScore) AS ExactScores,
                    SUM(CorrectResult) AS CorrectResults,
                    SUM(PredictionScored) AS PredictionsScored
                FROM ScoredPredictions
                GROUP BY ParticipantId, Name
            )
            SELECT
                ROW_NUMBER() OVER (ORDER BY Points DESC, ExactScores DESC, CorrectResults DESC, Name ASC) AS Position,
                ParticipantId,
                Name,
                Points,
                ExactScores,
                CorrectResults,
                PredictionsScored
            FROM Totals
            ORDER BY Position;
            """;

        using var connection = connectionFactory.CreateConnection();
        var ranking = await connection.QueryAsync<RankingParticipantResponse>(new CommandDefinition(
            sql,
            cancellationToken: cancellationToken));

        return Ok(ranking.ToList());
    }
}
