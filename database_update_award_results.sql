USE QuinielaMundial2026;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'dbo.AwardResults', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AwardResults
    (
        AwardCode NVARCHAR(30) NOT NULL CONSTRAINT PK_AwardResults PRIMARY KEY,
        AwardName NVARCHAR(80) NOT NULL,
        WinnerName NVARCHAR(160) NULL,
        Points INT NOT NULL CONSTRAINT DF_AwardResults_Points DEFAULT 5,
        UpdatedAtUtc DATETIME2(0) NOT NULL CONSTRAINT DF_AwardResults_UpdatedAtUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_AwardResults_Points CHECK (Points > 0)
    );
END;
GO

MERGE dbo.AwardResults AS target
USING
(
    VALUES
        (N'BALLON_DOR', N'Balón de oro', 5),
        (N'GOLDEN_BOOT', N'Bota de oro', 5),
        (N'GOLDEN_GLOVE', N'Guante de oro', 5)
) AS source (AwardCode, AwardName, Points)
ON target.AwardCode = source.AwardCode
WHEN MATCHED THEN
    UPDATE SET
        AwardName = source.AwardName,
        Points = source.Points
WHEN NOT MATCHED THEN
    INSERT (AwardCode, AwardName, Points)
    VALUES (source.AwardCode, source.AwardName, source.Points);
GO

-- Actualiza WinnerName con los ganadores oficiales cuando los tengas confirmados.
-- UPDATE dbo.AwardResults SET WinnerName = N'Nombre del Balón de oro', UpdatedAtUtc = SYSUTCDATETIME() WHERE AwardCode = N'BALLON_DOR';
-- UPDATE dbo.AwardResults SET WinnerName = N'Nombre del goleador', UpdatedAtUtc = SYSUTCDATETIME() WHERE AwardCode = N'GOLDEN_BOOT';
-- UPDATE dbo.AwardResults SET WinnerName = N'Nombre del portero', UpdatedAtUtc = SYSUTCDATETIME() WHERE AwardCode = N'GOLDEN_GLOVE';
