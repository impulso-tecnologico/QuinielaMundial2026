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

        using var connection = connectionFactory.CreateConnection();
        var finalWinner = await connection.QueryFirstOrDefaultAsync<HighlightVoteResponse>(new CommandDefinition(
            finalWinnerSql,
            cancellationToken: cancellationToken));
        var ballonDOr = await connection.QueryFirstOrDefaultAsync<HighlightVoteResponse>(new CommandDefinition(
            ballonDOrSql,
            cancellationToken: cancellationToken));

        return Ok(new PublicHighlightsResponse
        {
            FinalWinner = finalWinner,
            BallonDOr = ballonDOr
        });
    }
}
