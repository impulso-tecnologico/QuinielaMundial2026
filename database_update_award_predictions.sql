USE QuinielaMundial2026;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'dbo.AwardPredictions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AwardPredictions
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_AwardPredictions PRIMARY KEY,
        ParticipantId INT NOT NULL,
        BallonDOr NVARCHAR(160) NULL,
        GoldenBoot NVARCHAR(160) NULL,
        GoldenGlove NVARCHAR(160) NULL,
        UpdatedAtUtc DATETIME2(0) NOT NULL CONSTRAINT DF_AwardPredictions_UpdatedAtUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_AwardPredictions_Participants FOREIGN KEY (ParticipantId) REFERENCES dbo.Participants (Id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX UX_AwardPredictions_Participant
    ON dbo.AwardPredictions (ParticipantId);
END;
GO
