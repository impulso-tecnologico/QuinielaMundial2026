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
            ), RegularScores AS
            (
                SELECT
                    pa.Id AS ParticipantId,
                    pa.Name,
                    m.Id AS MatchId,
                    CASE
                        WHEN p.Id IS NULL OR p.HomeScore IS NULL OR p.AwayScore IS NULL THEN 0
                        ELSE
                            CASE WHEN SIGN(p.HomeScore - p.AwayScore) = SIGN(m.HomeScore - m.AwayScore) THEN 1 ELSE 0 END +
                            CASE WHEN p.HomeScore = m.HomeScore AND p.AwayScore = m.AwayScore THEN 1 ELSE 0 END
                    END AS Points,
                    CASE
                        WHEN p.Id IS NOT NULL AND p.HomeScore = m.HomeScore AND p.AwayScore = m.AwayScore THEN 1
                        ELSE 0
                    END AS ExactScore,
                    CASE
                        WHEN p.Id IS NOT NULL
                             AND p.HomeScore IS NOT NULL
                             AND p.AwayScore IS NOT NULL
                             AND SIGN(p.HomeScore - p.AwayScore) = SIGN(m.HomeScore - m.AwayScore) THEN 1
                        ELSE 0
                    END AS CorrectResult,
                    CASE
                        WHEN p.Id IS NOT NULL AND p.HomeScore IS NOT NULL AND p.AwayScore IS NOT NULL THEN 1
                        ELSE 0
                    END AS PredictionScored
                FROM dbo.Participants pa
                CROSS JOIN dbo.Matches m
                LEFT JOIN dbo.Predictions p
                    ON p.ParticipantId = pa.Id
                   AND p.MatchId = m.Id
                WHERE m.StageId = 1
                  AND m.HomeScore IS NOT NULL
                  AND m.AwayScore IS NOT NULL
            ), KnockoutScores AS
            (
                SELECT
                    pa.Id AS ParticipantId,
                    pa.Name,
                    m.Id AS MatchId,
                    CASE
                        WHEN kp.Id IS NULL
                          OR kp.HomeScore IS NULL
                          OR kp.AwayScore IS NULL
                          OR normalized.HomeScore IS NULL
                          OR normalized.AwayScore IS NULL THEN 0
                        ELSE
                            1 +
                            CASE WHEN SIGN(normalized.HomeScore - normalized.AwayScore) = SIGN(m.HomeScore - m.AwayScore) THEN 1 ELSE 0 END +
                            CASE WHEN normalized.HomeScore = m.HomeScore AND normalized.AwayScore = m.AwayScore THEN 1 ELSE 0 END
                    END AS Points,
                    CASE
                        WHEN normalized.HomeScore = m.HomeScore AND normalized.AwayScore = m.AwayScore THEN 1
                        ELSE 0
                    END AS ExactScore,
                    CASE
                        WHEN normalized.HomeScore IS NOT NULL
                             AND normalized.AwayScore IS NOT NULL
                             AND SIGN(normalized.HomeScore - normalized.AwayScore) = SIGN(m.HomeScore - m.AwayScore) THEN 1
                        ELSE 0
                    END AS CorrectResult,
                    CASE
                        WHEN kp.Id IS NOT NULL AND kp.HomeScore IS NOT NULL AND kp.AwayScore IS NOT NULL THEN 1
                        ELSE 0
                    END AS PredictionScored
                FROM dbo.Participants pa
                CROSS JOIN dbo.Matches m
                LEFT JOIN dbo.KnockoutPredictions kp
                    ON kp.ParticipantId = pa.Id
                   AND kp.BracketMatchNumber = m.BracketMatchNumber
                LEFT JOIN dbo.ParticipantKnockoutBrackets pkb
                    ON pkb.ParticipantId = pa.Id
                   AND pkb.BracketMatchNumber = m.BracketMatchNumber
                CROSS APPLY
                (
                    SELECT
                        CASE
                            WHEN pkb.Id IS NOT NULL
                             AND pkb.HomeTeamId IS NOT NULL
                             AND pkb.AwayTeamId IS NOT NULL
                             AND m.HomeTeamId IS NOT NULL
                             AND m.AwayTeamId IS NOT NULL
                             AND pkb.HomeTeamId = m.HomeTeamId
                             AND pkb.AwayTeamId = m.AwayTeamId THEN kp.HomeScore
                            WHEN pkb.Id IS NOT NULL
                             AND pkb.HomeTeamId IS NOT NULL
                             AND pkb.AwayTeamId IS NOT NULL
                             AND m.HomeTeamId IS NOT NULL
                             AND m.AwayTeamId IS NOT NULL
                             AND pkb.HomeTeamId = m.AwayTeamId
                             AND pkb.AwayTeamId = m.HomeTeamId THEN kp.AwayScore
                            ELSE NULL
                        END AS HomeScore,
                        CASE
                            WHEN pkb.Id IS NOT NULL
                             AND pkb.HomeTeamId IS NOT NULL
                             AND pkb.AwayTeamId IS NOT NULL
                             AND m.HomeTeamId IS NOT NULL
                             AND m.AwayTeamId IS NOT NULL
                             AND pkb.HomeTeamId = m.HomeTeamId
                             AND pkb.AwayTeamId = m.AwayTeamId THEN kp.AwayScore
                            WHEN pkb.Id IS NOT NULL
                             AND pkb.HomeTeamId IS NOT NULL
                             AND pkb.AwayTeamId IS NOT NULL
                             AND m.HomeTeamId IS NOT NULL
                             AND m.AwayTeamId IS NOT NULL
                             AND pkb.HomeTeamId = m.AwayTeamId
                             AND pkb.AwayTeamId = m.HomeTeamId THEN kp.HomeScore
                            ELSE NULL
                        END AS AwayScore
                ) normalized
                WHERE m.StageId > 1
                  AND m.HomeScore IS NOT NULL
                  AND m.AwayScore IS NOT NULL
            ), ScoredPredictions AS
            (
                SELECT ParticipantId, Name, MatchId, Points, ExactScore, CorrectResult, PredictionScored FROM RegularScores

                UNION ALL

                SELECT ParticipantId, Name, MatchId, Points, ExactScore, CorrectResult, PredictionScored FROM KnockoutScores
            ), ScoreTotals AS
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
            ), Totals AS
            (
                SELECT
                    pa.Id AS ParticipantId,
                    pa.Name,
                    COALESCE(st.Points, 0) AS Points,
                    COALESCE(st.ExactScores, 0) AS ExactScores,
                    COALESCE(st.CorrectResults, 0) AS CorrectResults,
                    COALESCE(st.PredictionsScored, 0) AS PredictionsScored
                FROM dbo.Participants pa
                LEFT JOIN ScoreTotals st ON st.ParticipantId = pa.Id
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
