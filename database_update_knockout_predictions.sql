USE QuinielaMundial2026;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'dbo.KnockoutPredictions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.KnockoutPredictions
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_KnockoutPredictions PRIMARY KEY,
        ParticipantId INT NOT NULL,
        BracketMatchNumber INT NOT NULL,
        HomeScore INT NULL,
        AwayScore INT NULL,
        UpdatedAtUtc DATETIME2(0) NOT NULL CONSTRAINT DF_KnockoutPredictions_UpdatedAtUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_KnockoutPredictions_Participants FOREIGN KEY (ParticipantId) REFERENCES dbo.Participants (Id) ON DELETE CASCADE,
        CONSTRAINT CK_KnockoutPredictions_BracketMatchNumber CHECK (BracketMatchNumber BETWEEN 1 AND 32),
        CONSTRAINT CK_KnockoutPredictions_HomeScore CHECK (HomeScore IS NULL OR HomeScore >= 0),
        CONSTRAINT CK_KnockoutPredictions_AwayScore CHECK (AwayScore IS NULL OR AwayScore >= 0)
    );

    CREATE UNIQUE INDEX UX_KnockoutPredictions_Participant_Match
    ON dbo.KnockoutPredictions (ParticipantId, BracketMatchNumber);
END;
GO
