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
            WITH LatestScoredMatch AS
            (
                SELECT TOP (1)
                    Id AS MatchId
                FROM dbo.Matches
                WHERE HomeScore IS NOT NULL
                  AND AwayScore IS NOT NULL
                ORDER BY ResultRegisteredAtUtc DESC, MatchDate DESC, MatchTime DESC, MatchNumber DESC
            ), ScoredPredictions AS
            (
                SELECT
                    pa.Id AS ParticipantId,
                    pa.Name,
                    m.Id AS MatchId,
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
            ), LatestMatchScores AS
            (
                SELECT
                    ParticipantId,
                    SUM(Points) AS Points,
                    SUM(ExactScore) AS ExactScores,
                    SUM(CorrectResult) AS CorrectResults,
                    SUM(PredictionScored) AS PredictionsScored
                FROM ScoredPredictions
                WHERE MatchId = (SELECT MatchId FROM LatestScoredMatch)
                GROUP BY ParticipantId
            ), PreviousTotals AS
            (
                SELECT
                    t.ParticipantId,
                    t.Name,
                    t.Points - COALESCE(l.Points, 0) AS Points,
                    t.ExactScores - COALESCE(l.ExactScores, 0) AS ExactScores,
                    t.CorrectResults - COALESCE(l.CorrectResults, 0) AS CorrectResults,
                    t.PredictionsScored - COALESCE(l.PredictionsScored, 0) AS PredictionsScored
                FROM Totals t
                LEFT JOIN LatestMatchScores l ON l.ParticipantId = t.ParticipantId
            ), CurrentRank AS
            (
                SELECT
                    CAST(DENSE_RANK() OVER (ORDER BY Points DESC) AS INT) AS Position,
                    ParticipantId,
                    Name,
                    Points,
                    ExactScores,
                    CorrectResults,
                    PredictionsScored
                FROM Totals
            ), PreviousRank AS
            (
                SELECT
                    CAST(DENSE_RANK() OVER (ORDER BY Points DESC) AS INT) AS PreviousPosition,
                    ParticipantId
                FROM PreviousTotals
            )
            SELECT
                c.Position,
                c.ParticipantId,
                c.Name,
                c.Points,
                c.ExactScores,
                c.CorrectResults,
                c.PredictionsScored,
                COALESCE(p.PreviousPosition, c.Position) AS PreviousPosition,
                CAST(COALESCE(p.PreviousPosition, c.Position) - c.Position AS INT) AS PositionChange
            FROM CurrentRank c
            LEFT JOIN PreviousRank p ON p.ParticipantId = c.ParticipantId
            ORDER BY c.Position, c.ExactScores DESC, c.CorrectResults DESC, c.Name;
            """;

        using var connection = connectionFactory.CreateConnection();
        var ranking = await connection.QueryAsync<RankingParticipantResponse>(new CommandDefinition(
            sql,
            cancellationToken: cancellationToken));

        return Ok(ranking.ToList());
    }
}
