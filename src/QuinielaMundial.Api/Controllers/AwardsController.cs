using Dapper;
using Microsoft.AspNetCore.Mvc;
using QuinielaMundial.Api.Contracts.Awards;
using QuinielaMundial.Infrastructure.Data;

namespace QuinielaMundial.Api.Controllers;

[ApiController]
[Route("api/awards")]
public sealed class AwardsController(ISqlConnectionFactory connectionFactory) : ControllerBase
{
    [HttpGet("final-scoreboard")]
    public async Task<ActionResult<AwardFinalScoreboardResponse>> GetFinalScoreboard(CancellationToken cancellationToken)
    {
        const string sql = """
            CREATE TABLE #AwardMatches
            (
                AwardCode NVARCHAR(30) NOT NULL,
                AwardName NVARCHAR(80) NOT NULL,
                WinnerName NVARCHAR(160) NOT NULL,
                Points INT NOT NULL,
                ParticipantId INT NOT NULL,
                Name NVARCHAR(120) NOT NULL,
                IsCorrect INT NOT NULL
            );

            IF OBJECT_ID(N'dbo.AwardResults', N'U') IS NOT NULL
            BEGIN
                EXEC sp_executesql N'
                    INSERT INTO #AwardMatches
                    (
                        AwardCode,
                        AwardName,
                        WinnerName,
                        Points,
                        ParticipantId,
                        Name,
                        IsCorrect
                    )
                    SELECT
                        ar.AwardCode,
                        ar.AwardName,
                        LTRIM(RTRIM(ar.WinnerName)) AS WinnerName,
                        ar.Points,
                        pa.Id AS ParticipantId,
                        pa.Name,
                        CASE
                            WHEN ar.AwardCode = N''BALLON_DOR''
                             AND NULLIF(LTRIM(RTRIM(ap.BallonDOr)), N'''') COLLATE Latin1_General_CI_AI = LTRIM(RTRIM(ar.WinnerName)) COLLATE Latin1_General_CI_AI THEN 1
                            WHEN ar.AwardCode = N''GOLDEN_BOOT''
                             AND NULLIF(LTRIM(RTRIM(ap.GoldenBoot)), N'''') COLLATE Latin1_General_CI_AI = LTRIM(RTRIM(ar.WinnerName)) COLLATE Latin1_General_CI_AI THEN 1
                            WHEN ar.AwardCode = N''GOLDEN_GLOVE''
                             AND NULLIF(LTRIM(RTRIM(ap.GoldenGlove)), N'''') COLLATE Latin1_General_CI_AI = LTRIM(RTRIM(ar.WinnerName)) COLLATE Latin1_General_CI_AI THEN 1
                            ELSE 0
                        END AS IsCorrect
                    FROM dbo.AwardResults ar
                    CROSS JOIN dbo.Participants pa
                    LEFT JOIN dbo.AwardPredictions ap ON ap.ParticipantId = pa.Id
                    WHERE NULLIF(LTRIM(RTRIM(ar.WinnerName)), N'''') IS NOT NULL;
                ';
            END;

            SELECT
                AwardCode,
                AwardName,
                WinnerName,
                Points,
                SUM(IsCorrect) AS CorrectPredictions
            FROM #AwardMatches
            GROUP BY AwardCode, AwardName, WinnerName, Points
            ORDER BY CASE AwardCode
                WHEN N'BALLON_DOR' THEN 1
                WHEN N'GOLDEN_BOOT' THEN 2
                WHEN N'GOLDEN_GLOVE' THEN 3
                ELSE 4
            END;

            SELECT
                ParticipantId,
                Name,
                SUM(IsCorrect * Points) AS AwardPoints,
                SUM(IsCorrect) AS CorrectAwards,
                CAST(MAX(CASE WHEN AwardCode = N'BALLON_DOR' THEN IsCorrect ELSE 0 END) AS bit) AS BallonDOrCorrect,
                CAST(MAX(CASE WHEN AwardCode = N'GOLDEN_BOOT' THEN IsCorrect ELSE 0 END) AS bit) AS GoldenBootCorrect,
                CAST(MAX(CASE WHEN AwardCode = N'GOLDEN_GLOVE' THEN IsCorrect ELSE 0 END) AS bit) AS GoldenGloveCorrect
            FROM #AwardMatches
            GROUP BY ParticipantId, Name
            HAVING SUM(IsCorrect * Points) > 0
            ORDER BY AwardPoints DESC, CorrectAwards DESC, Name ASC;
            """;

        using var connection = connectionFactory.CreateConnection();
        using var grid = await connection.QueryMultipleAsync(new CommandDefinition(
            sql,
            cancellationToken: cancellationToken));

        var awards = (await grid.ReadAsync<AwardFinalResultResponse>()).ToList();
        var participantScores = (await grid.ReadAsync<AwardParticipantScoreResponse>()).ToList();

        return Ok(new AwardFinalScoreboardResponse
        {
            MaxPoints = awards.Sum(award => award.Points),
            Awards = awards,
            ParticipantScores = participantScores
        });
    }
}
