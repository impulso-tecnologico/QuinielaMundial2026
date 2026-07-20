USE QuinielaMundial2026;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

SET XACT_ABORT ON;

BEGIN TRANSACTION;

DECLARE @FinalMatchTeams TABLE
(
    MatchNumber INT NOT NULL,
    HomeTeam NVARCHAR(160) NOT NULL,
    AwayTeam NVARCHAR(160) NOT NULL
);

INSERT INTO @FinalMatchTeams (MatchNumber, HomeTeam, AwayTeam)
VALUES
    (103, N'Francia', N'Inglaterra'),
    (104, N'España', N'Argentina');

IF EXISTS
(
    SELECT 1
    FROM @FinalMatchTeams fmt
    WHERE NOT EXISTS
    (
        SELECT 1
        FROM dbo.Matches m
        WHERE m.MatchNumber = fmt.MatchNumber
    )
)
BEGIN
    THROW 50001, 'No existen todos los partidos 103 y 104 en dbo.Matches.', 1;
END;

IF EXISTS
(
    SELECT 1
    FROM @FinalMatchTeams fmt
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Teams t WHERE t.Name = fmt.HomeTeam)
       OR NOT EXISTS (SELECT 1 FROM dbo.Teams t WHERE t.Name = fmt.AwayTeam)
)
BEGIN
    THROW 50002, 'No existen todos los equipos requeridos en dbo.Teams.', 1;
END;

UPDATE m
SET
    HomeTeamId = ht.Id,
    AwayTeamId = at.Id,
    HomePlaceholder = NULL,
    AwayPlaceholder = NULL
FROM dbo.Matches m
INNER JOIN @FinalMatchTeams fmt ON fmt.MatchNumber = m.MatchNumber
INNER JOIN dbo.Teams ht ON ht.Name = fmt.HomeTeam
INNER JOIN dbo.Teams at ON at.Name = fmt.AwayTeam;

SELECT
    m.MatchNumber,
    m.BracketMatchNumber,
    s.Name AS StageName,
    ht.Name AS HomeTeam,
    at.Name AS AwayTeam,
    m.Stadium,
    m.City,
    m.MatchDate,
    m.MatchTime
FROM dbo.Matches m
INNER JOIN dbo.TournamentStages s ON s.Id = m.StageId
INNER JOIN dbo.Teams ht ON ht.Id = m.HomeTeamId
INNER JOIN dbo.Teams at ON at.Id = m.AwayTeamId
WHERE m.MatchNumber IN (103, 104)
ORDER BY m.MatchNumber;

COMMIT TRANSACTION;
GO
