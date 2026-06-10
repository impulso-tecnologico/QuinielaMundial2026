USE QuinielaMundial2026;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF COL_LENGTH(N'dbo.Matches', N'BracketMatchNumber') IS NULL
BEGIN
    ALTER TABLE dbo.Matches ADD BracketMatchNumber INT NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Matches_BracketMatchNumber')
BEGIN
    ALTER TABLE dbo.Matches WITH CHECK ADD CONSTRAINT CK_Matches_BracketMatchNumber
    CHECK (BracketMatchNumber IS NULL OR BracketMatchNumber BETWEEN 1 AND 32);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Matches_BracketMatchNumber' AND object_id = OBJECT_ID(N'dbo.Matches'))
BEGIN
    CREATE UNIQUE INDEX UX_Matches_BracketMatchNumber
    ON dbo.Matches (BracketMatchNumber)
    WHERE BracketMatchNumber IS NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.ParticipantKnockoutBrackets', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ParticipantKnockoutBrackets
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ParticipantKnockoutBrackets PRIMARY KEY,
        ParticipantId INT NOT NULL,
        BracketMatchNumber INT NOT NULL,
        RoundName NVARCHAR(80) NOT NULL,
        HomeTeamId INT NULL,
        AwayTeamId INT NULL,
        HomeTeamName NVARCHAR(160) NOT NULL,
        AwayTeamName NVARCHAR(160) NOT NULL,
        HomeSource NVARCHAR(120) NULL,
        AwaySource NVARCHAR(120) NULL,
        UpdatedAtUtc DATETIME2(0) NOT NULL CONSTRAINT DF_ParticipantKnockoutBrackets_UpdatedAtUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_ParticipantKnockoutBrackets_Participants FOREIGN KEY (ParticipantId) REFERENCES dbo.Participants (Id) ON DELETE CASCADE,
        CONSTRAINT FK_ParticipantKnockoutBrackets_HomeTeam FOREIGN KEY (HomeTeamId) REFERENCES dbo.Teams (Id),
        CONSTRAINT FK_ParticipantKnockoutBrackets_AwayTeam FOREIGN KEY (AwayTeamId) REFERENCES dbo.Teams (Id),
        CONSTRAINT CK_ParticipantKnockoutBrackets_BracketMatchNumber CHECK (BracketMatchNumber BETWEEN 1 AND 32),
        CONSTRAINT CK_ParticipantKnockoutBrackets_DifferentTeams CHECK (HomeTeamId IS NULL OR AwayTeamId IS NULL OR HomeTeamId <> AwayTeamId)
    );

    CREATE UNIQUE INDEX UX_ParticipantKnockoutBrackets_Participant_Match
    ON dbo.ParticipantKnockoutBrackets (ParticipantId, BracketMatchNumber);
END;
GO
