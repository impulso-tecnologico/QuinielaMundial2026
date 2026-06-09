/*
  Quiniela Mundial 2026 - SQL Server + Dapper
  Relaciones por Id, resultados con 0 permitidos y auditoría de captura de resultados.
*/

IF DB_ID(N'QuinielaMundial2026') IS NULL
BEGIN
    CREATE DATABASE QuinielaMundial2026;
END;
GO

USE QuinielaMundial2026;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'dbo.Predictions', N'U') IS NOT NULL DROP TABLE dbo.Predictions;
IF OBJECT_ID(N'dbo.Matches', N'U') IS NOT NULL DROP TABLE dbo.Matches;
IF OBJECT_ID(N'dbo.TournamentStages', N'U') IS NOT NULL DROP TABLE dbo.TournamentStages;
IF OBJECT_ID(N'dbo.Teams', N'U') IS NOT NULL DROP TABLE dbo.Teams;
IF OBJECT_ID(N'dbo.Participants', N'U') IS NOT NULL DROP TABLE dbo.Participants;
GO

CREATE TABLE dbo.Participants
(
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Participants PRIMARY KEY,
    Name NVARCHAR(120) NOT NULL,
    Email NVARCHAR(180) NULL,
    CreatedAtUtc DATETIME2(0) NOT NULL CONSTRAINT DF_Participants_CreatedAtUtc DEFAULT SYSUTCDATETIME()
);
GO

CREATE UNIQUE INDEX UX_Participants_Email ON dbo.Participants (Email) WHERE Email IS NOT NULL;
GO

CREATE TABLE dbo.Teams
(
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Teams PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL
);
GO

CREATE UNIQUE INDEX UX_Teams_Name ON dbo.Teams (Name);
GO

CREATE TABLE dbo.TournamentStages
(
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_TournamentStages PRIMARY KEY,
    Code NVARCHAR(20) NOT NULL,
    Name NVARCHAR(80) NOT NULL,
    SortOrder INT NOT NULL
);
GO

CREATE UNIQUE INDEX UX_TournamentStages_Code ON dbo.TournamentStages (Code);
GO

CREATE TABLE dbo.Matches
(
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Matches PRIMARY KEY,
    MatchNumber INT NOT NULL,
    StageId INT NOT NULL,
    [Group] NVARCHAR(2) NULL,
    HomeTeamId INT NULL,
    AwayTeamId INT NULL,
    HomePlaceholder NVARCHAR(120) NULL,
    AwayPlaceholder NVARCHAR(120) NULL,
    Stadium NVARCHAR(140) NOT NULL,
    City NVARCHAR(120) NOT NULL,
    MatchDate DATE NOT NULL,
    MatchTime TIME(0) NOT NULL,
    HomeScore INT NULL,
    AwayScore INT NULL,
    ResultRegisteredByParticipantId INT NULL,
    ResultRegisteredAtUtc DATETIME2(0) NULL,
    CONSTRAINT FK_Matches_Stages FOREIGN KEY (StageId) REFERENCES dbo.TournamentStages (Id),
    CONSTRAINT FK_Matches_HomeTeam FOREIGN KEY (HomeTeamId) REFERENCES dbo.Teams (Id),
    CONSTRAINT FK_Matches_AwayTeam FOREIGN KEY (AwayTeamId) REFERENCES dbo.Teams (Id),
    CONSTRAINT FK_Matches_ResultRegisteredBy FOREIGN KEY (ResultRegisteredByParticipantId) REFERENCES dbo.Participants (Id),
    CONSTRAINT CK_Matches_MatchNumber CHECK (MatchNumber > 0),
    CONSTRAINT CK_Matches_HomeScore CHECK (HomeScore IS NULL OR HomeScore >= 0),
    CONSTRAINT CK_Matches_AwayScore CHECK (AwayScore IS NULL OR AwayScore >= 0),
    CONSTRAINT CK_Matches_DifferentTeams CHECK (HomeTeamId IS NULL OR AwayTeamId IS NULL OR HomeTeamId <> AwayTeamId),
    CONSTRAINT CK_Matches_HomeSource CHECK (HomeTeamId IS NOT NULL OR HomePlaceholder IS NOT NULL),
    CONSTRAINT CK_Matches_AwaySource CHECK (AwayTeamId IS NOT NULL OR AwayPlaceholder IS NOT NULL),
    CONSTRAINT CK_Matches_ResultAudit CHECK ((HomeScore IS NULL AND AwayScore IS NULL) OR ResultRegisteredByParticipantId IS NOT NULL)
);
GO

CREATE UNIQUE INDEX UX_Matches_MatchNumber ON dbo.Matches (MatchNumber);
CREATE INDEX IX_Matches_Stage_Group ON dbo.Matches (StageId, [Group], MatchNumber);
CREATE INDEX IX_Matches_HomeTeamId ON dbo.Matches (HomeTeamId);
CREATE INDEX IX_Matches_AwayTeamId ON dbo.Matches (AwayTeamId);
GO

CREATE TABLE dbo.Predictions
(
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Predictions PRIMARY KEY,
    ParticipantId INT NOT NULL,
    MatchId INT NOT NULL,
    HomeScore INT NULL,
    AwayScore INT NULL,
    UpdatedAtUtc DATETIME2(0) NOT NULL CONSTRAINT DF_Predictions_UpdatedAtUtc DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Predictions_Participants FOREIGN KEY (ParticipantId) REFERENCES dbo.Participants (Id) ON DELETE CASCADE,
    CONSTRAINT FK_Predictions_Matches FOREIGN KEY (MatchId) REFERENCES dbo.Matches (Id) ON DELETE CASCADE,
    CONSTRAINT CK_Predictions_HomeScore CHECK (HomeScore IS NULL OR HomeScore >= 0),
    CONSTRAINT CK_Predictions_AwayScore CHECK (AwayScore IS NULL OR AwayScore >= 0)
);
GO

CREATE UNIQUE INDEX UX_Predictions_Participant_Match ON dbo.Predictions (ParticipantId, MatchId);
CREATE INDEX IX_Predictions_MatchId ON dbo.Predictions (MatchId);
GO

INSERT INTO dbo.TournamentStages (Code, Name, SortOrder)
VALUES
    (N'GROUPS', N'Fase de grupos', 1),
    (N'R32', N'Dieciseisavos', 2),
    (N'R16', N'Octavos', 3),
    (N'QF', N'Cuartos', 4),
    (N'SF', N'Semifinales', 5),
    (N'F', N'Final', 6);
GO

DECLARE @GroupMatches TABLE
(
    MatchNumber INT NOT NULL,
    [Group] NVARCHAR(2) NOT NULL,
    HomeTeam NVARCHAR(100) NOT NULL,
    AwayTeam NVARCHAR(100) NOT NULL,
    Stadium NVARCHAR(140) NOT NULL,
    City NVARCHAR(120) NOT NULL,
    MatchDate DATE NOT NULL,
    MatchTime TIME(0) NOT NULL
);

INSERT INTO @GroupMatches (MatchNumber, [Group], HomeTeam, AwayTeam, Stadium, City, MatchDate, MatchTime)
VALUES
    (1, N'A', N'México', N'Sudáfrica', N'Estadio Azteca', N'Ciudad de México', '2026-06-11', '13:00:00'),
    (2, N'A', N'Corea del Sur', N'Chequia', N'Estadio Akron', N'Guadalajara', '2026-06-11', '20:00:00'),
    (3, N'B', N'Canadá', N'Bosnia y Herzegovina', N'BMO Field', N'Toronto', '2026-06-12', '15:00:00'),
    (4, N'D', N'Estados Unidos', N'Paraguay', N'SoFi Stadium', N'Los Ángeles', '2026-06-12', '18:00:00'),
    (5, N'C', N'Haití', N'Escocia', N'Gillette Stadium', N'Boston', '2026-06-13', '21:00:00'),
    (6, N'D', N'Australia', N'Turquía', N'BC Place', N'Vancouver', '2026-06-13', '21:00:00'),
    (7, N'C', N'Brasil', N'Marruecos', N'MetLife Stadium', N'Nueva York/Nueva Jersey', '2026-06-13', '18:00:00'),
    (8, N'B', N'Qatar', N'Suiza', N'Levi''s Stadium', N'San Francisco Bay Area', '2026-06-13', '12:00:00'),
    (9, N'E', N'Costa de Marfil', N'Ecuador', N'Lincoln Financial Field', N'Filadelfia', '2026-06-14', '19:00:00'),
    (10, N'E', N'Alemania', N'Curazao', N'NRG Stadium', N'Houston', '2026-06-14', '12:00:00'),
    (11, N'F', N'Países Bajos', N'Japón', N'AT&T Stadium', N'Dallas', '2026-06-14', '15:00:00'),
    (12, N'F', N'Suecia', N'Túnez', N'Estadio BBVA', N'Monterrey', '2026-06-14', '20:00:00'),
    (13, N'H', N'Arabia Saudita', N'Uruguay', N'Hard Rock Stadium', N'Miami', '2026-06-15', '18:00:00'),
    (14, N'H', N'España', N'Cabo Verde', N'Mercedes-Benz Stadium', N'Atlanta', '2026-06-15', '12:00:00'),
    (15, N'G', N'Irán', N'Nueva Zelanda', N'SoFi Stadium', N'Los Ángeles', '2026-06-15', '18:00:00'),
    (16, N'G', N'Bélgica', N'Egipto', N'Lumen Field', N'Seattle', '2026-06-15', '12:00:00'),
    (17, N'I', N'Francia', N'Senegal', N'MetLife Stadium', N'Nueva York/Nueva Jersey', '2026-06-16', '15:00:00'),
    (18, N'I', N'Irak', N'Noruega', N'Gillette Stadium', N'Boston', '2026-06-16', '18:00:00'),
    (19, N'J', N'Argentina', N'Argelia', N'Arrowhead Stadium', N'Kansas City', '2026-06-16', '20:00:00'),
    (20, N'J', N'Austria', N'Jordania', N'Levi''s Stadium', N'San Francisco Bay Area', '2026-06-16', '21:00:00'),
    (21, N'L', N'Ghana', N'Panamá', N'BMO Field', N'Toronto', '2026-06-17', '19:00:00'),
    (22, N'L', N'Inglaterra', N'Croacia', N'AT&T Stadium', N'Dallas', '2026-06-17', '15:00:00'),
    (23, N'K', N'Portugal', N'RD Congo', N'NRG Stadium', N'Houston', '2026-06-17', '12:00:00'),
    (24, N'K', N'Uzbekistán', N'Colombia', N'Estadio Azteca', N'Ciudad de México', '2026-06-17', '20:00:00'),
    (25, N'A', N'Chequia', N'Sudáfrica', N'Mercedes-Benz Stadium', N'Atlanta', '2026-06-18', '12:00:00'),
    (26, N'B', N'Suiza', N'Bosnia y Herzegovina', N'SoFi Stadium', N'Los Ángeles', '2026-06-18', '12:00:00'),
    (27, N'B', N'Canadá', N'Qatar', N'BC Place', N'Vancouver', '2026-06-18', '15:00:00'),
    (28, N'A', N'México', N'Corea del Sur', N'Estadio Akron', N'Guadalajara', '2026-06-18', '19:00:00'),
    (29, N'C', N'Brasil', N'Haití', N'Lincoln Financial Field', N'Filadelfia', '2026-06-19', '21:00:00'),
    (30, N'C', N'Escocia', N'Marruecos', N'Gillette Stadium', N'Boston', '2026-06-19', '18:00:00'),
    (31, N'D', N'Turquía', N'Paraguay', N'Levi''s Stadium', N'San Francisco Bay Area', '2026-06-19', '20:00:00'),
    (32, N'D', N'Estados Unidos', N'Australia', N'Lumen Field', N'Seattle', '2026-06-19', '12:00:00'),
    (33, N'E', N'Alemania', N'Costa de Marfil', N'BMO Field', N'Toronto', '2026-06-20', '16:00:00'),
    (34, N'E', N'Ecuador', N'Curazao', N'Arrowhead Stadium', N'Kansas City', '2026-06-20', '19:00:00'),
    (35, N'F', N'Países Bajos', N'Suecia', N'NRG Stadium', N'Houston', '2026-06-20', '12:00:00'),
    (36, N'F', N'Túnez', N'Japón', N'Estadio BBVA', N'Monterrey', '2026-06-20', '22:00:00'),
    (37, N'H', N'Uruguay', N'Cabo Verde', N'Hard Rock Stadium', N'Miami', '2026-06-21', '18:00:00'),
    (38, N'H', N'España', N'Arabia Saudita', N'Mercedes-Benz Stadium', N'Atlanta', '2026-06-21', '12:00:00'),
    (39, N'G', N'Bélgica', N'Irán', N'SoFi Stadium', N'Los Ángeles', '2026-06-21', '12:00:00'),
    (40, N'G', N'Nueva Zelanda', N'Egipto', N'BC Place', N'Vancouver', '2026-06-21', '18:00:00'),
    (41, N'I', N'Noruega', N'Senegal', N'MetLife Stadium', N'Nueva York/Nueva Jersey', '2026-06-22', '20:00:00'),
    (42, N'I', N'Francia', N'Irak', N'Lincoln Financial Field', N'Filadelfia', '2026-06-22', '17:00:00'),
    (43, N'J', N'Argentina', N'Austria', N'AT&T Stadium', N'Dallas', '2026-06-22', '12:00:00'),
    (44, N'J', N'Jordania', N'Argelia', N'Levi''s Stadium', N'San Francisco Bay Area', '2026-06-22', '20:00:00'),
    (45, N'L', N'Inglaterra', N'Ghana', N'Gillette Stadium', N'Boston', '2026-06-23', '16:00:00'),
    (46, N'L', N'Panamá', N'Croacia', N'BMO Field', N'Toronto', '2026-06-23', '19:00:00'),
    (47, N'K', N'Portugal', N'Uzbekistán', N'NRG Stadium', N'Houston', '2026-06-23', '12:00:00'),
    (48, N'K', N'Colombia', N'RD Congo', N'Estadio Akron', N'Guadalajara', '2026-06-23', '20:00:00'),
    (49, N'C', N'Escocia', N'Brasil', N'Hard Rock Stadium', N'Miami', '2026-06-24', '18:00:00'),
    (50, N'C', N'Marruecos', N'Haití', N'Mercedes-Benz Stadium', N'Atlanta', '2026-06-24', '18:00:00'),
    (51, N'B', N'Suiza', N'Canadá', N'BC Place', N'Vancouver', '2026-06-24', '12:00:00'),
    (52, N'B', N'Bosnia y Herzegovina', N'Qatar', N'Lumen Field', N'Seattle', '2026-06-24', '12:00:00'),
    (53, N'A', N'Chequia', N'México', N'Estadio Azteca', N'Ciudad de México', '2026-06-24', '19:00:00'),
    (54, N'A', N'Sudáfrica', N'Corea del Sur', N'Estadio BBVA', N'Monterrey', '2026-06-24', '19:00:00'),
    (55, N'E', N'Curazao', N'Costa de Marfil', N'Lincoln Financial Field', N'Filadelfia', '2026-06-25', '16:00:00'),
    (56, N'E', N'Ecuador', N'Alemania', N'MetLife Stadium', N'Nueva York/Nueva Jersey', '2026-06-25', '16:00:00'),
    (57, N'F', N'Japón', N'Suecia', N'AT&T Stadium', N'Dallas', '2026-06-25', '18:00:00'),
    (58, N'F', N'Túnez', N'Países Bajos', N'Arrowhead Stadium', N'Kansas City', '2026-06-25', '18:00:00'),
    (59, N'D', N'Turquía', N'Estados Unidos', N'SoFi Stadium', N'Los Ángeles', '2026-06-25', '19:00:00'),
    (60, N'D', N'Paraguay', N'Australia', N'Levi''s Stadium', N'San Francisco Bay Area', '2026-06-25', '19:00:00'),
    (61, N'I', N'Noruega', N'Francia', N'Gillette Stadium', N'Boston', '2026-06-26', '15:00:00'),
    (62, N'I', N'Senegal', N'Irak', N'BMO Field', N'Toronto', '2026-06-26', '15:00:00'),
    (63, N'G', N'Egipto', N'Irán', N'Lumen Field', N'Seattle', '2026-06-26', '20:00:00'),
    (64, N'G', N'Nueva Zelanda', N'Bélgica', N'BC Place', N'Vancouver', '2026-06-26', '20:00:00'),
    (65, N'H', N'Cabo Verde', N'Arabia Saudita', N'NRG Stadium', N'Houston', '2026-06-26', '19:00:00'),
    (66, N'H', N'Uruguay', N'España', N'Estadio Akron', N'Guadalajara', '2026-06-26', '18:00:00'),
    (67, N'L', N'Panamá', N'Inglaterra', N'MetLife Stadium', N'Nueva York/Nueva Jersey', '2026-06-27', '17:00:00'),
    (68, N'L', N'Croacia', N'Ghana', N'Lincoln Financial Field', N'Filadelfia', '2026-06-27', '17:00:00'),
    (69, N'J', N'Argelia', N'Austria', N'Arrowhead Stadium', N'Kansas City', '2026-06-27', '21:00:00'),
    (70, N'J', N'Jordania', N'Argentina', N'AT&T Stadium', N'Dallas', '2026-06-27', '21:00:00'),
    (71, N'K', N'Colombia', N'Portugal', N'Hard Rock Stadium', N'Miami', '2026-06-27', '19:30:00'),
    (72, N'K', N'RD Congo', N'Uzbekistán', N'Mercedes-Benz Stadium', N'Atlanta', '2026-06-27', '19:30:00');

INSERT INTO dbo.Teams (Name)
SELECT TeamName
FROM
(
    SELECT HomeTeam AS TeamName FROM @GroupMatches
    UNION
    SELECT AwayTeam AS TeamName FROM @GroupMatches
) teams
ORDER BY TeamName;

INSERT INTO dbo.Matches (MatchNumber, StageId, [Group], HomeTeamId, AwayTeamId, Stadium, City, MatchDate, MatchTime)
SELECT
    gm.MatchNumber,
    s.Id,
    gm.[Group],
    ht.Id,
    at.Id,
    gm.Stadium,
    gm.City,
    gm.MatchDate,
    gm.MatchTime
FROM @GroupMatches gm
INNER JOIN dbo.TournamentStages s ON s.Code = N'GROUPS'
INNER JOIN dbo.Teams ht ON ht.Name = gm.HomeTeam
INNER JOIN dbo.Teams at ON at.Name = gm.AwayTeam;
GO
