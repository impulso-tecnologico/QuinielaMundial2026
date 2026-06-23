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
    public async Task<ActionResult<PublicHighlightsResponse>> Get([FromQuery] DateOnly? date, CancellationToken cancellationToken)
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

        const string mostPopularScoreSql = """
            WITH SelectedDay AS
            (
                SELECT COALESCE(
                    @Date,
                    (
                        SELECT MAX(CONVERT(date, m.MatchDate))
                        FROM dbo.Matches m
                        WHERE EXISTS
                        (
                            SELECT 1
                            FROM dbo.Predictions p
                            WHERE p.MatchId = m.Id
                              AND p.HomeScore IS NOT NULL
                              AND p.AwayScore IS NOT NULL
                        )
                           OR EXISTS
                        (
                            SELECT 1
                            FROM dbo.KnockoutPredictions kp
                            WHERE kp.BracketMatchNumber = m.BracketMatchNumber
                              AND kp.HomeScore IS NOT NULL
                              AND kp.AwayScore IS NOT NULL
                        )
                    )
                ) AS MatchDay
            ), ScorePredictions AS
            (
                SELECT p.HomeScore, p.AwayScore
                FROM dbo.Predictions p
                INNER JOIN dbo.Matches m ON m.Id = p.MatchId
                CROSS JOIN SelectedDay sd
                WHERE p.HomeScore IS NOT NULL
                  AND p.AwayScore IS NOT NULL
                  AND CONVERT(date, m.MatchDate) = sd.MatchDay

                UNION ALL

                SELECT kp.HomeScore, kp.AwayScore
                FROM dbo.KnockoutPredictions kp
                INNER JOIN dbo.Matches m ON m.BracketMatchNumber = kp.BracketMatchNumber
                CROSS JOIN SelectedDay sd
                WHERE kp.HomeScore IS NOT NULL
                  AND kp.AwayScore IS NOT NULL
                  AND CONVERT(date, m.MatchDate) = sd.MatchDay
            )
            SELECT TOP (1)
                CONCAT(HomeScore, N' - ', AwayScore) AS Score,
                COUNT(1) AS Predictions
            FROM ScorePredictions
            GROUP BY HomeScore, AwayScore
            ORDER BY COUNT(1) DESC, HomeScore + AwayScore DESC, HomeScore DESC, AwayScore DESC;
            """;

        const string mostDividedMatchSql = """
            WITH SelectedDay AS
            (
                SELECT COALESCE(
                    @Date,
                    (
                        SELECT MAX(CONVERT(date, m.MatchDate))
                        FROM dbo.Matches m
                        WHERE EXISTS
                        (
                            SELECT 1
                            FROM dbo.Predictions p
                            WHERE p.MatchId = m.Id
                              AND p.HomeScore IS NOT NULL
                              AND p.AwayScore IS NOT NULL
                        )
                    )
                ) AS MatchDay
            ), MatchVotes AS
            (
                SELECT
                    m.Id,
                    m.MatchNumber,
                    COALESCE(ht.Name, m.HomePlaceholder) AS HomeTeam,
                    COALESCE(at.Name, m.AwayPlaceholder) AS AwayTeam,
                    COUNT(1) AS Predictions,
                    SUM(CASE WHEN p.HomeScore > p.AwayScore THEN 1 ELSE 0 END) AS HomeVotes,
                    SUM(CASE WHEN p.HomeScore = p.AwayScore THEN 1 ELSE 0 END) AS DrawVotes,
                    SUM(CASE WHEN p.AwayScore > p.HomeScore THEN 1 ELSE 0 END) AS AwayVotes
                FROM dbo.Matches m
                INNER JOIN dbo.Predictions p ON p.MatchId = m.Id
                LEFT JOIN dbo.Teams ht ON ht.Id = m.HomeTeamId
                LEFT JOIN dbo.Teams at ON at.Id = m.AwayTeamId
                CROSS JOIN SelectedDay sd
                WHERE p.HomeScore IS NOT NULL
                  AND p.AwayScore IS NOT NULL
                  AND CONVERT(date, m.MatchDate) = sd.MatchDay
                GROUP BY m.Id, m.MatchNumber, COALESCE(ht.Name, m.HomePlaceholder), COALESCE(at.Name, m.AwayPlaceholder)
            ), Totals AS
            (
                SELECT
                    Id,
                    MatchNumber,
                    CONCAT(HomeTeam, N' vs ', AwayTeam) AS Name,
                    Predictions,
                    Spread.MaxVotes - Spread.MinVotes AS VoteSpread
                FROM MatchVotes
                CROSS APPLY
                (
                    SELECT MAX(v.Votes) AS MaxVotes, MIN(v.Votes) AS MinVotes
                    FROM (VALUES (HomeVotes), (DrawVotes), (AwayVotes)) AS v(Votes)
                ) Spread
                WHERE Predictions >= 3
            )
            SELECT TOP (1) Name, Predictions
            FROM Totals
            ORDER BY VoteSpread ASC, Predictions DESC, MatchNumber ASC;
            """;

        const string almostExactKingSql = """
            WITH AlmostExactPredictions AS
            (
                SELECT
                    p.ParticipantId,
                    pa.Name
                FROM dbo.Predictions p
                INNER JOIN dbo.Participants pa ON pa.Id = p.ParticipantId
                INNER JOIN dbo.Matches m ON m.Id = p.MatchId
                WHERE m.HomeScore IS NOT NULL
                  AND m.AwayScore IS NOT NULL
                  AND p.HomeScore IS NOT NULL
                  AND p.AwayScore IS NOT NULL
                  AND ABS(p.HomeScore - m.HomeScore) + ABS(p.AwayScore - m.AwayScore) = 1

                UNION ALL

                SELECT
                    kp.ParticipantId,
                    pa.Name
                FROM dbo.KnockoutPredictions kp
                INNER JOIN dbo.Participants pa ON pa.Id = kp.ParticipantId
                INNER JOIN dbo.Matches m ON m.BracketMatchNumber = kp.BracketMatchNumber
                WHERE m.HomeScore IS NOT NULL
                  AND m.AwayScore IS NOT NULL
                  AND kp.HomeScore IS NOT NULL
                  AND kp.AwayScore IS NOT NULL
                  AND ABS(kp.HomeScore - m.HomeScore) + ABS(kp.AwayScore - m.AwayScore) = 1
            )
            SELECT TOP (1)
                Name,
                COUNT(1) AS NearMisses
            FROM AlmostExactPredictions
            GROUP BY ParticipantId, Name
            ORDER BY COUNT(1) DESC, Name ASC;
            """;

        const string weeklySaltedSql = """
            WITH LatestResult AS
            (
                SELECT MAX(MatchDate) AS LatestMatchDate
                FROM dbo.Matches
                WHERE HomeScore IS NOT NULL
                  AND AwayScore IS NOT NULL
            ), WeekWindow AS
            (
                SELECT
                    DATEADD(DAY, -(DATEDIFF(DAY, CONVERT(date, '19000101'), LatestMatchDate) % 7), LatestMatchDate) AS WeekStart,
                    DATEADD(DAY, 7 - (DATEDIFF(DAY, CONVERT(date, '19000101'), LatestMatchDate) % 7), LatestMatchDate) AS WeekEnd
                FROM LatestResult
                WHERE LatestMatchDate IS NOT NULL
            ), WeekMatches AS
            (
                SELECT
                    m.Id,
                    m.BracketMatchNumber,
                    m.HomeScore,
                    m.AwayScore
                FROM dbo.Matches m
                CROSS JOIN WeekWindow w
                WHERE m.HomeScore IS NOT NULL
                  AND m.AwayScore IS NOT NULL
                  AND m.MatchDate >= w.WeekStart
                  AND m.MatchDate < w.WeekEnd
            ), RegularScores AS
            (
                SELECT
                    pa.Id AS ParticipantId,
                    pa.Name,
                    CASE
                        WHEN p.Id IS NOT NULL
                             AND p.HomeScore IS NOT NULL
                             AND p.AwayScore IS NOT NULL
                             AND SIGN(p.HomeScore - p.AwayScore) = SIGN(wm.HomeScore - wm.AwayScore) THEN 1
                        ELSE 0
                    END AS CorrectPrediction,
                    CASE
                        WHEN p.Id IS NOT NULL
                             AND p.HomeScore IS NOT NULL
                             AND p.AwayScore IS NOT NULL THEN 1
                        ELSE 0
                    END AS SubmittedPrediction
                FROM dbo.Participants pa
                CROSS JOIN WeekMatches wm
                LEFT JOIN dbo.Predictions p
                    ON p.ParticipantId = pa.Id
                   AND p.MatchId = wm.Id
                WHERE wm.BracketMatchNumber IS NULL
            ), KnockoutScores AS
            (
                SELECT
                    pa.Id AS ParticipantId,
                    pa.Name,
                    CASE
                        WHEN kp.Id IS NOT NULL
                             AND kp.HomeScore IS NOT NULL
                             AND kp.AwayScore IS NOT NULL
                             AND SIGN(kp.HomeScore - kp.AwayScore) = SIGN(wm.HomeScore - wm.AwayScore) THEN 1
                        ELSE 0
                    END AS CorrectPrediction,
                    CASE
                        WHEN kp.Id IS NOT NULL
                             AND kp.HomeScore IS NOT NULL
                             AND kp.AwayScore IS NOT NULL THEN 1
                        ELSE 0
                    END AS SubmittedPrediction
                FROM dbo.Participants pa
                CROSS JOIN WeekMatches wm
                LEFT JOIN dbo.KnockoutPredictions kp
                    ON kp.ParticipantId = pa.Id
                   AND kp.BracketMatchNumber = wm.BracketMatchNumber
                WHERE wm.BracketMatchNumber IS NOT NULL
            ), Scores AS
            (
                SELECT ParticipantId, Name, CorrectPrediction, SubmittedPrediction FROM RegularScores

                UNION ALL

                SELECT ParticipantId, Name, CorrectPrediction, SubmittedPrediction FROM KnockoutScores
            ), Totals AS
            (
                SELECT
                    ParticipantId,
                    Name,
                    SUM(CorrectPrediction) AS CorrectPredictions,
                    COUNT(1) AS EvaluatedMatches,
                    SUM(SubmittedPrediction) AS SubmittedPredictions
                FROM Scores
                GROUP BY ParticipantId, Name
                HAVING SUM(SubmittedPrediction) > 0
            )
            SELECT TOP (1)
                Name,
                CorrectPredictions,
                EvaluatedMatches
            FROM Totals
            ORDER BY CorrectPredictions ASC, SubmittedPredictions DESC, Name ASC;
            """;

        const string exactScoreWizardSql = """
            WITH ExactScorePredictions AS
            (
                SELECT
                    p.ParticipantId,
                    pa.Name
                FROM dbo.Predictions p
                INNER JOIN dbo.Participants pa ON pa.Id = p.ParticipantId
                INNER JOIN dbo.Matches m ON m.Id = p.MatchId
                WHERE m.HomeScore IS NOT NULL
                  AND m.AwayScore IS NOT NULL
                  AND p.HomeScore = m.HomeScore
                  AND p.AwayScore = m.AwayScore

                UNION ALL

                SELECT
                    kp.ParticipantId,
                    pa.Name
                FROM dbo.KnockoutPredictions kp
                INNER JOIN dbo.Participants pa ON pa.Id = kp.ParticipantId
                INNER JOIN dbo.Matches m ON m.BracketMatchNumber = kp.BracketMatchNumber
                WHERE m.HomeScore IS NOT NULL
                  AND m.AwayScore IS NOT NULL
                  AND kp.HomeScore = m.HomeScore
                  AND kp.AwayScore = m.AwayScore
            )
            SELECT TOP (1)
                Name,
                COUNT(1) AS ExactScores
            FROM ExactScorePredictions
            GROUP BY ParticipantId, Name
            ORDER BY COUNT(1) DESC, Name ASC;
            """;

        const string weeklyRiseSql = """
            WITH LatestResult AS
            (
                SELECT MAX(MatchDate) AS LatestMatchDate
                FROM dbo.Matches
                WHERE HomeScore IS NOT NULL
                  AND AwayScore IS NOT NULL
            ), WeekWindow AS
            (
                SELECT DATEADD(DAY, -(DATEDIFF(DAY, CONVERT(date, '19000101'), LatestMatchDate) % 7), LatestMatchDate) AS WeekStart
                FROM LatestResult
                WHERE LatestMatchDate IS NOT NULL
            ), RegularScores AS
            (
                SELECT
                    pa.Id AS ParticipantId,
                    pa.Name,
                    m.MatchDate,
                    CASE
                        WHEN p.Id IS NOT NULL
                             AND p.HomeScore IS NOT NULL
                             AND p.AwayScore IS NOT NULL THEN
                            CASE WHEN SIGN(p.HomeScore - p.AwayScore) = SIGN(m.HomeScore - m.AwayScore) THEN 1 ELSE 0 END +
                            CASE WHEN p.HomeScore = m.HomeScore AND p.AwayScore = m.AwayScore THEN 1 ELSE 0 END
                        ELSE 0
                    END AS Points
                FROM dbo.Participants pa
                CROSS JOIN dbo.Matches m
                LEFT JOIN dbo.Predictions p
                    ON p.ParticipantId = pa.Id
                   AND p.MatchId = m.Id
                WHERE m.BracketMatchNumber IS NULL
                  AND m.HomeScore IS NOT NULL
                  AND m.AwayScore IS NOT NULL
            ), KnockoutScores AS
            (
                SELECT
                    pa.Id AS ParticipantId,
                    pa.Name,
                    m.MatchDate,
                    CASE
                        WHEN kp.Id IS NOT NULL
                             AND kp.HomeScore IS NOT NULL
                             AND kp.AwayScore IS NOT NULL THEN
                            CASE WHEN SIGN(kp.HomeScore - kp.AwayScore) = SIGN(m.HomeScore - m.AwayScore) THEN 1 ELSE 0 END +
                            CASE WHEN kp.HomeScore = m.HomeScore AND kp.AwayScore = m.AwayScore THEN 1 ELSE 0 END
                        ELSE 0
                    END AS Points
                FROM dbo.Participants pa
                CROSS JOIN dbo.Matches m
                LEFT JOIN dbo.KnockoutPredictions kp
                    ON kp.ParticipantId = pa.Id
                   AND kp.BracketMatchNumber = m.BracketMatchNumber
                WHERE m.BracketMatchNumber IS NOT NULL
                  AND m.HomeScore IS NOT NULL
                  AND m.AwayScore IS NOT NULL
            ), Scores AS
            (
                SELECT ParticipantId, Name, MatchDate, Points FROM RegularScores

                UNION ALL

                SELECT ParticipantId, Name, MatchDate, Points FROM KnockoutScores
            ), CurrentTotals AS
            (
                SELECT ParticipantId, Name, SUM(Points) AS Points
                FROM Scores
                GROUP BY ParticipantId, Name
            ), PreviousTotals AS
            (
                SELECT
                    s.ParticipantId,
                    s.Name,
                    SUM(CASE WHEN s.MatchDate < w.WeekStart THEN s.Points ELSE 0 END) AS Points
                FROM Scores s
                CROSS JOIN WeekWindow w
                GROUP BY s.ParticipantId, s.Name
            ), CurrentRank AS
            (
                SELECT
                    ParticipantId,
                    Name,
                    CAST(DENSE_RANK() OVER (ORDER BY Points DESC) AS INT) AS CurrentPosition
                FROM CurrentTotals
            ), PreviousRank AS
            (
                SELECT
                    ParticipantId,
                    CAST(DENSE_RANK() OVER (ORDER BY Points DESC) AS INT) AS PreviousPosition
                FROM PreviousTotals
            ), Movement AS
            (
                SELECT
                    c.Name,
                    p.PreviousPosition,
                    c.CurrentPosition,
                    p.PreviousPosition - c.CurrentPosition AS PositionsGained
                FROM CurrentRank c
                INNER JOIN PreviousRank p ON p.ParticipantId = c.ParticipantId
            )
            SELECT TOP (1)
                Name,
                PositionsGained,
                PreviousPosition,
                CurrentPosition
            FROM Movement
            WHERE PositionsGained > 0
            ORDER BY PositionsGained DESC, CurrentPosition ASC, Name ASC;
            """;

        const string rareProphetSql = """
            WITH MatchPredictionTotals AS
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
            ), RareHits AS
            (
                SELECT
                    p.ParticipantId,
                    pa.Name,
                    CASE
                        WHEN SIGN(m.HomeScore - m.AwayScore) = 1 THEN 100.0 - (100.0 * t.HomeWinPredictions / NULLIF(t.TotalPredictions, 0))
                        WHEN SIGN(m.HomeScore - m.AwayScore) = 0 THEN 100.0 - (100.0 * t.DrawPredictions / NULLIF(t.TotalPredictions, 0))
                        ELSE 100.0 - (100.0 * t.AwayWinPredictions / NULLIF(t.TotalPredictions, 0))
                    END AS RarePoints
                FROM dbo.Predictions p
                INNER JOIN dbo.Participants pa ON pa.Id = p.ParticipantId
                INNER JOIN dbo.Matches m ON m.Id = p.MatchId
                INNER JOIN MatchPredictionTotals t ON t.MatchId = p.MatchId
                WHERE m.HomeScore IS NOT NULL
                  AND m.AwayScore IS NOT NULL
                  AND p.HomeScore IS NOT NULL
                  AND p.AwayScore IS NOT NULL
                  AND SIGN(p.HomeScore - p.AwayScore) = SIGN(m.HomeScore - m.AwayScore)
            )
            SELECT TOP (1)
                Name,
                CAST(ROUND(SUM(RarePoints), 0) AS INT) AS RarePoints
            FROM RareHits
            GROUP BY ParticipantId, Name
            ORDER BY SUM(RarePoints) DESC, Name ASC;
            """;

        using var connection = connectionFactory.CreateConnection();
        var finalWinner = await connection.QueryFirstOrDefaultAsync<HighlightVoteResponse>(new CommandDefinition(
            finalWinnerSql,
            cancellationToken: cancellationToken));
        var ballonDOr = await connection.QueryFirstOrDefaultAsync<HighlightVoteResponse>(new CommandDefinition(
            ballonDOrSql,
            cancellationToken: cancellationToken));

        var parameters = new { Date = date?.ToDateTime(TimeOnly.MinValue).Date };

        var mostPopularScore = await connection.QueryFirstOrDefaultAsync<HighlightScoreResponse>(new CommandDefinition(
            mostPopularScoreSql,
            parameters,
            cancellationToken: cancellationToken));
        var mostDividedMatch = await connection.QueryFirstOrDefaultAsync<HighlightMatchResponse>(new CommandDefinition(
            mostDividedMatchSql,
            parameters,
            cancellationToken: cancellationToken));

        var almostExactKing = await connection.QueryFirstOrDefaultAsync<HighlightAlmostExactResponse>(new CommandDefinition(
            almostExactKingSql,
            cancellationToken: cancellationToken));
        var weeklySalted = await connection.QueryFirstOrDefaultAsync<HighlightWeeklySaltedResponse>(new CommandDefinition(
            weeklySaltedSql,
            cancellationToken: cancellationToken));
        var exactScoreWizard = await connection.QueryFirstOrDefaultAsync<HighlightExactScoreResponse>(new CommandDefinition(
            exactScoreWizardSql,
            cancellationToken: cancellationToken));
        var weeklyRise = await connection.QueryFirstOrDefaultAsync<HighlightWeeklyRiseResponse>(new CommandDefinition(
            weeklyRiseSql,
            cancellationToken: cancellationToken));
        var rareProphet = await connection.QueryFirstOrDefaultAsync<HighlightRarePredictionResponse>(new CommandDefinition(
            rareProphetSql,
            cancellationToken: cancellationToken));

        return Ok(new PublicHighlightsResponse
        {
            FinalWinner = finalWinner,
            BallonDOr = ballonDOr,
            MostPopularScore = mostPopularScore,
            MostDividedMatch = mostDividedMatch,
            AlmostExactKing = almostExactKing,
            WeeklySalted = weeklySalted,
            ExactScoreWizard = exactScoreWizard,
            WeeklyRise = weeklyRise,
            RareProphet = rareProphet
        });
    }
}
