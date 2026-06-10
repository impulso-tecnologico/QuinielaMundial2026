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
- `ParticipantKnockoutBrackets.ParticipantId` -> `Participants.Id`
- `ParticipantKnockoutBrackets.HomeTeamId` -> `Teams.Id`
- `ParticipantKnockoutBrackets.AwayTeamId` -> `Teams.Id`

Los resultados aceptan `0` porque `HomeScore` y `AwayScore` permiten valores `>= 0`.

`Matches.BracketMatchNumber` identifica el slot oficial de la llave de eliminación directa. Cuando se carguen partidos reales de knockout, ese campo permite comparar contra los cruces guardados del participante.

Si la base ya existe, ejecuta los scripts incrementales según aplique:

- `database_update_knockout_predictions.sql`
- `database_update_award_predictions.sql`
- `database_update_knockout_brackets.sql`

## Endpoints iniciales

- `GET /api/matches`: lista partidos.
- `PUT /api/matches/{matchId}/result`: actualiza resultado real e indica qué participante lo registró.
- `GET /api/participants`: lista participantes.
- `POST /api/participants`: crea participante.
- `GET /api/participants/{participantId}/predictions`: lista pronósticos.
- `PUT /api/participants/{participantId}/predictions/{matchId}`: crea o actualiza pronóstico.
- `GET /api/participants/{participantId}/knockout-brackets`: lista cruces de knockout generados por el participante.
- `PUT /api/participants/{participantId}/knockout-brackets`: guarda los cruces de knockout generados por el participante.
- `GET /api/participants/{participantId}/knockout-predictions`: lista marcadores pronosticados de knockout.
- `PUT /api/participants/{participantId}/knockout-predictions/{bracketMatchNumber}`: crea o actualiza marcador pronosticado de knockout.
- `GET /api/standings/groups`: calcula tablas de grupos desde resultados.
- `GET /api/knockout`: proyecta dieciseisavos desde los resultados capturados.

## Puntuación de knockout acordada

Los cruces generados se guardan en `ParticipantKnockoutBrackets` al presionar `Guardar predicciones`. Esto permite evaluar después contra partidos reales de `Matches` con `BracketMatchNumber`:

- 1 punto si acierta el cruce exacto.
- 1 punto si acierta quién pasa de ronda, solo si acertó el cruce exacto.
- 1 punto si acierta marcador exacto, solo si acertó el cruce exacto.

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
