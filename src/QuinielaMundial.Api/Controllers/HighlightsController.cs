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

        const string mostPopularScoreSql = """
            WITH ScorePredictions AS
            (
                SELECT HomeScore, AwayScore
                FROM dbo.Predictions
                WHERE HomeScore IS NOT NULL
                  AND AwayScore IS NOT NULL

                UNION ALL

                SELECT HomeScore, AwayScore
                FROM dbo.KnockoutPredictions
                WHERE HomeScore IS NOT NULL
                  AND AwayScore IS NOT NULL
            )
            SELECT TOP (1)
                CONCAT(HomeScore, N' - ', AwayScore) AS Score,
                COUNT(1) AS Predictions
            FROM ScorePredictions
            GROUP BY HomeScore, AwayScore
            ORDER BY COUNT(1) DESC, HomeScore + AwayScore DESC, HomeScore DESC, AwayScore DESC;
            """;

        const string mostDividedMatchSql = """
            WITH MatchVotes AS
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
                WHERE p.HomeScore IS NOT NULL
                  AND p.AwayScore IS NOT NULL
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

        using var connection = connectionFactory.CreateConnection();
        var finalWinner = await connection.QueryFirstOrDefaultAsync<HighlightVoteResponse>(new CommandDefinition(
            finalWinnerSql,
            cancellationToken: cancellationToken));
        var ballonDOr = await connection.QueryFirstOrDefaultAsync<HighlightVoteResponse>(new CommandDefinition(
            ballonDOrSql,
            cancellationToken: cancellationToken));

        var mostPopularScore = await connection.QueryFirstOrDefaultAsync<HighlightScoreResponse>(new CommandDefinition(
            mostPopularScoreSql,
            cancellationToken: cancellationToken));
        var mostDividedMatch = await connection.QueryFirstOrDefaultAsync<HighlightMatchResponse>(new CommandDefinition(
            mostDividedMatchSql,
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

        return Ok(new PublicHighlightsResponse
        {
            FinalWinner = finalWinner,
            BallonDOr = ballonDOr,
            MostPopularScore = mostPopularScore,
            MostDividedMatch = mostDividedMatch,
            AlmostExactKing = almostExactKing,
            WeeklySalted = weeklySalted,
            ExactScoreWizard = exactScoreWizard
        });
    }
}
