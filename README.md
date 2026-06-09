# Quiniela Mundial 2026

Aplicación para capturar pronósticos, resultados de fase de grupos y proyectar eliminatorias del Mundial 2026.

## Estructura

- `src/QuinielaMundial.Api`: API ASP.NET Core, Swagger, CORS y frontend estático en `wwwroot`.
- `src/QuinielaMundial.Domain`: entidades y lógica de dominio.
- `src/QuinielaMundial.Infrastructure`: Dapper y conexión a SQL Server.
- `tests/QuinielaMundial.Tests`: pruebas automatizadas.
- `quiniela_mundial_2026.html`: frontend original.

## Configuración SQL Server

La cadena de conexión está en `src/QuinielaMundial.Api/appsettings.json`:

```json
"ConnectionStrings": {
  "QuinielaDb": "Server=localhost;Database=QuinielaMundial2026;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
}
```

Para usar usuario y contraseña:

```json
"ConnectionStrings": {
  "QuinielaDb": "Server=localhost;Database=QuinielaMundial2026;User Id=sa;Password=TU_PASSWORD;TrustServerCertificate=True;MultipleActiveResultSets=true"
}
```

## Comandos

```powershell
dotnet restore
dotnet build
dotnet run --project src/QuinielaMundial.Api
```

Swagger queda disponible en `/swagger` cuando la API corre en ambiente Development.

## Crear base de datos

Ejecuta `database.sql` en SQL Server Management Studio o Azure Data Studio. El script crea la base `QuinielaMundial2026`, las tablas, índices, constraints y carga los 72 partidos iniciales.

Las relaciones principales son por Id:

- `Matches.StageId` -> `TournamentStages.Id`
- `Matches.HomeTeamId` -> `Teams.Id`
- `Matches.AwayTeamId` -> `Teams.Id`
- `Matches.ResultRegisteredByParticipantId` -> `Participants.Id`
- `Predictions.ParticipantId` -> `Participants.Id`
- `Predictions.MatchId` -> `Matches.Id`

Los resultados aceptan `0` porque `HomeScore` y `AwayScore` permiten valores `>= 0`.

## Endpoints iniciales

- `GET /api/matches`: lista partidos.
- `PUT /api/matches/{matchId}/result`: actualiza resultado real e indica qué participante lo registró.
- `GET /api/participants`: lista participantes.
- `POST /api/participants`: crea participante.
- `GET /api/participants/{participantId}/predictions`: lista pronósticos.
- `PUT /api/participants/{participantId}/predictions/{matchId}`: crea o actualiza pronóstico.
- `GET /api/standings/groups`: calcula tablas de grupos desde resultados.
- `GET /api/knockout`: proyecta dieciseisavos desde los resultados capturados.

## Acceso a datos

El proyecto usa Dapper con consultas SQL parametrizadas. No usa Entity Framework Core.

Ejemplo para registrar resultado:

```json
{
  "homeScore": 0,
  "awayScore": 0,
  "registeredByParticipantId": 1
}
```
