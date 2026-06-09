# Quiniela Mundial 2026

Aplicación para capturar pronósticos, resultados de fase de grupos y proyectar eliminatorias del Mundial 2026.

## Estructura

- `src/QuinielaMundial.Api`: API ASP.NET Core, Swagger, CORS y frontend estático en `wwwroot`.
- `src/QuinielaMundial.Domain`: entidades y lógica de dominio.
- `src/QuinielaMundial.Infrastructure`: Entity Framework Core y conexión a SQL Server.
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

## Endpoints iniciales

- `GET /api/matches`: lista partidos.
- `PUT /api/matches/{matchId}/result`: actualiza resultado real.
- `GET /api/participants`: lista participantes.
- `POST /api/participants`: crea participante.
- `GET /api/participants/{participantId}/predictions`: lista pronósticos.
- `PUT /api/participants/{participantId}/predictions/{matchId}`: crea o actualiza pronóstico.
- `GET /api/standings/groups`: calcula tablas de grupos desde resultados.
- `GET /api/knockout`: proyecta dieciseisavos desde los resultados capturados.

## Siguiente paso recomendado

Crear la primera migración de EF Core y precargar los 72 partidos en SQL Server.
