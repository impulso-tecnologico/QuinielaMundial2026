using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuinielaMundial.Api.Contracts.Participants;
using QuinielaMundial.Domain.Entities;
using QuinielaMundial.Infrastructure.Persistence;

namespace QuinielaMundial.Api.Controllers;

[ApiController]
[Route("api/participants")]
public sealed class ParticipantsController(QuinielaDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ParticipantResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var participants = await db.Participants
            .OrderBy(x => x.Name)
            .Select(x => new ParticipantResponse(x.Id, x.Name, x.Email, x.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        return Ok(participants);
    }

    [HttpPost]
    public async Task<ActionResult<ParticipantResponse>> Create(CreateParticipantRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("El nombre del participante es obligatorio.");
        }

        var participant = new Participant
        {
            Name = request.Name.Trim(),
            Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim()
        };

        db.Participants.Add(participant);
        await db.SaveChangesAsync(cancellationToken);

        var response = new ParticipantResponse(participant.Id, participant.Name, participant.Email, participant.CreatedAtUtc);
        return CreatedAtAction(nameof(GetAll), new { id = participant.Id }, response);
    }
}
