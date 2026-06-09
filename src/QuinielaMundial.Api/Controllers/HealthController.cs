using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using QuinielaMundial.Infrastructure.Data;

namespace QuinielaMundial.Api.Controllers;

[ApiController]
[Route("api/health")]
public sealed class HealthController(ISqlConnectionFactory connectionFactory) : ControllerBase
{
    [HttpGet("database")]
    public async Task<IActionResult> Database(CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                DB_NAME() AS DatabaseName,
                COUNT_BIG(*) AS MatchCount
            FROM dbo.Matches;
            """;

        try
        {
            using var connection = connectionFactory.CreateConnection();
            var result = await connection.QuerySingleAsync<DatabaseHealthResponse>(new CommandDefinition(
                sql,
                cancellationToken: cancellationToken));

            return Ok(new
            {
                status = "OK",
                database = result.DatabaseName,
                matches = result.MatchCount
            });
        }
        catch (SqlException ex)
        {
            return Problem(
                title: "No se pudo conectar a SQL Server.",
                detail: ex.Message,
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    }

    private sealed record DatabaseHealthResponse(string DatabaseName, long MatchCount);
}
