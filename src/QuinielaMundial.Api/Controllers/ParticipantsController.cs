using Dapper;
using Microsoft.AspNetCore.Mvc;
using QuinielaMundial.Api.Contracts.Participants;
using QuinielaMundial.Infrastructure.Data;

namespace QuinielaMundial.Api.Controllers;

[ApiController]
[Route("api/participants")]
public sealed class ParticipantsController(ISqlConnectionFactory connectionFactory) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ParticipantResponse>>> GetAll(CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT Id, Name, Email, CreatedAtUtc
            FROM dbo.Participants
            ORDER BY Name;
            """;

        using var connection = connectionFactory.CreateConnection();
        var participants = await connection.QueryAsync<ParticipantResponse>(new CommandDefinition(sql, cancellationToken: cancellationToken));

        return Ok(participants.ToList());
    }

    [HttpPost]
    public async Task<ActionResult<ParticipantResponse>> Create(CreateParticipantRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("El nombre del participante es obligatorio.");
        }

        const string sql = """
            INSERT INTO dbo.Participants (Name, Email)
            OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.Email, INSERTED.CreatedAtUtc
            VALUES (@Name, @Email);
            """;

        using var connection = connectionFactory.CreateConnection();
        var response = await connection.QuerySingleAsync<ParticipantResponse>(new CommandDefinition(
            sql,
            new
            {
                Name = request.Name.Trim(),
                Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim()
            },
            cancellationToken: cancellationToken));

        return CreatedAtAction(nameof(GetAll), new { id = response.Id }, response);
    }
}
