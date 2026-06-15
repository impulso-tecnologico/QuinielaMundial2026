using Dapper;
using Microsoft.AspNetCore.Mvc;
using QuinielaMundial.Api.Contracts.Highlights;
using QuinielaMundial.Infrastructure.Data;

namespace QuinielaMundial.Api.Controllers;

[ApiController]
[Route("api/highlights")]
public sealed class HighlightsController(ISqlConnectionFactory connectionFactory) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PublicHighlightsResponse>> Get(CancellationToken cancellationToken)
    {
        const string finalWinnerSql = """
            WITH FinalVotes AS
            (
                SELECT
                    CASE
                        WHEN kp.HomeScore > kp.AwayScore THEN pkb.HomeTeamName
                        WHEN kp.AwayScore > kp.HomeScore THEN pkb.AwayTeamName
                        ELSE NULL
                    END AS WinnerName
                FROM dbo.KnockoutPredictions kp
                INNER JOIN dbo.ParticipantKnockoutBrackets pkb
                    ON pkb.ParticipantId = kp.ParticipantId
                   AND pkb.BracketMatchNumber = 32
                WHERE kp.BracketMatchNumber = 32
                  AND kp.HomeScore IS NOT NULL
                  AND kp.AwayScore IS NOT NULL
                  AND kp.HomeScore <> kp.AwayScore
            )
            SELECT TOP (1)
                LTRIM(RTRIM(WinnerName)) AS Name,
                COUNT(1) AS Votes
            FROM FinalVotes
            WHERE NULLIF(LTRIM(RTRIM(WinnerName)), N'') IS NOT NULL
            GROUP BY LTRIM(RTRIM(WinnerName))
            ORDER BY COUNT(1) DESC, LTRIM(RTRIM(WinnerName)) ASC;
            """;

        const string ballonDOrSql = """
            SELECT TOP (1)
                LTRIM(RTRIM(BallonDOr)) AS Name,
                COUNT(1) AS Votes
            FROM dbo.AwardPredictions
            WHERE NULLIF(LTRIM(RTRIM(BallonDOr)), N'') IS NOT NULL
            GROUP BY LTRIM(RTRIM(BallonDOr))
            ORDER BY COUNT(1) DESC, LTRIM(RTRIM(BallonDOr)) ASC;
            """;

        const string predictedGoalsSql = """
            WITH GoalPredictions AS
            (
                SELECT ParticipantId, HomeScore + AwayScore AS Goals
                FROM dbo.Predictions
                WHERE HomeScore IS NOT NULL
                  AND AwayScore IS NOT NULL

                UNION ALL

                SELECT ParticipantId, HomeScore + AwayScore AS Goals
                FROM dbo.KnockoutPredictions
                WHERE HomeScore IS NOT NULL
                  AND AwayScore IS NOT NULL
            ), Totals AS
            (
                SELECT
                    p.Name,
                    SUM(g.Goals) AS Goals,
                    COUNT(1) AS PredictionsCount
                FROM GoalPredictions g
                INNER JOIN dbo.Participants p ON p.Id = g.ParticipantId
                GROUP BY p.Id, p.Name
            )
            SELECT TOP (1) Name, Goals
            FROM Totals
            ORDER BY Goals DESC, PredictionsCount DESC, Name ASC;

            WITH GoalPredictions AS
            (
                SELECT ParticipantId, HomeScore + AwayScore AS Goals
                FROM dbo.Predictions
                WHERE HomeScore IS NOT NULL
                  AND AwayScore IS NOT NULL

                UNION ALL

                SELECT ParticipantId, HomeScore + AwayScore AS Goals
                FROM dbo.KnockoutPredictions
                WHERE HomeScore IS NOT NULL
                  AND AwayScore IS NOT NULL
            ), Totals AS
            (
                SELECT
                    p.Name,
                    SUM(g.Goals) AS Goals,
                    COUNT(1) AS PredictionsCount
                FROM GoalPredictions g
                INNER JOIN dbo.Participants p ON p.Id = g.ParticipantId
                GROUP BY p.Id, p.Name
            )
            SELECT TOP (1) Name, Goals
            FROM Totals
            ORDER BY Goals ASC, PredictionsCount DESC, Name ASC;
            """;

        const string longestCorrectStreakSql = """
            WITH EvaluatedPredictions AS
            (
                SELECT
                    pa.Id AS ParticipantId,
                    pa.Name,
                    m.MatchNumber,
                    CASE
                        WHEN p.HomeScore IS NOT NULL
                             AND p.AwayScore IS NOT NULL
                             AND SIGN(p.HomeScore - p.AwayScore) = SIGN(m.HomeScore - m.AwayScore) THEN 1
                        ELSE 0
                    END AS IsCorrect,
                    ROW_NUMBER() OVER (PARTITION BY pa.Id ORDER BY m.MatchNumber) AS MatchRow
                FROM dbo.Participants pa
                CROSS JOIN dbo.Matches m
                LEFT JOIN dbo.Predictions p
                    ON p.ParticipantId = pa.Id
                   AND p.MatchId = m.Id
                WHERE m.HomeScore IS NOT NULL
                  AND m.AwayScore IS NOT NULL
            ), CorrectRows AS
            (
                SELECT
                    ParticipantId,
                    Name,
                    MatchNumber,
                    MatchRow - ROW_NUMBER() OVER (PARTITION BY ParticipantId ORDER BY MatchNumber) AS StreakGroup
                FROM EvaluatedPredictions
                WHERE IsCorrect = 1
            ), Streaks AS
            (
                SELECT
                    ParticipantId,
                    Name,
                    COUNT(1) AS Streak
                FROM CorrectRows
                GROUP BY ParticipantId, Name, StreakGroup
            ), BestStreaks AS
            (
                SELECT
                    ParticipantId,
                    Name,
                    MAX(Streak) AS Streak
                FROM Streaks
                GROUP BY ParticipantId, Name
            ), MaxStreak AS
            (
                SELECT MAX(Streak) AS Streak
                FROM BestStreaks
            )
            SELECT
                b.Name,
                b.Streak
            FROM BestStreaks b
            WHERE b.Streak = (SELECT Streak FROM MaxStreak)
              AND b.Streak > 0
            ORDER BY b.Name;
            """;

        using var connection = connectionFactory.CreateConnection();
        var finalWinner = await connection.QueryFirstOrDefaultAsync<HighlightVoteResponse>(new CommandDefinition(
            finalWinnerSql,
            cancellationToken: cancellationToken));
        var ballonDOr = await connection.QueryFirstOrDefaultAsync<HighlightVoteResponse>(new CommandDefinition(
            ballonDOrSql,
            cancellationToken: cancellationToken));

        HighlightGoalsResponse? mostPredictedGoals;
        HighlightGoalsResponse? fewestPredictedGoals;
        using (var goalsGrid = await connection.QueryMultipleAsync(new CommandDefinition(
            predictedGoalsSql,
            cancellationToken: cancellationToken)))
        {
            mostPredictedGoals = await goalsGrid.ReadFirstOrDefaultAsync<HighlightGoalsResponse>();
            fewestPredictedGoals = await goalsGrid.ReadFirstOrDefaultAsync<HighlightGoalsResponse>();
        }

        var longestCorrectStreakRows = (await connection.QueryAsync<HighlightStreakRow>(new CommandDefinition(
            longestCorrectStreakSql,
            cancellationToken: cancellationToken))).ToList();
        var longestCorrectStreak = longestCorrectStreakRows.Count > 0
            ? new HighlightStreakResponse
            {
                Names = longestCorrectStreakRows.Select(row => row.Name).ToList(),
                Streak = longestCorrectStreakRows[0].Streak
            }
            : null;

        return Ok(new PublicHighlightsResponse
        {
            FinalWinner = finalWinner,
            BallonDOr = ballonDOr,
            MostPredictedGoals = mostPredictedGoals,
            FewestPredictedGoals = fewestPredictedGoals,
            LongestCorrectStreak = longestCorrectStreak
        });
    }

    private sealed class HighlightStreakRow
    {
        public string Name { get; set; } = string.Empty;
        public int Streak { get; set; }
    }
}
