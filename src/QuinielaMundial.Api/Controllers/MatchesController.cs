using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuinielaMundial.Api.Contracts.Matches;
using QuinielaMundial.Infrastructure.Persistence;

namespace QuinielaMundial.Api.Controllers;

[ApiController]
[Route("api/matches")]
public sealed class MatchesController(QuinielaDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MatchResponse>>> GetAll([FromQuery] string? group, CancellationToken cancellationToken)
    {
        var query = db.Matches.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(group))
        {
            query = query.Where(x => x.Group == group.Trim().ToUpper());
        }

        var matches = await query
            .OrderBy(x => x.MatchNumber)
            .Select(x => new MatchResponse(
                x.Id,
                x.MatchNumber,
                x.Group,
                x.HomeTeam,
                x.AwayTeam,
                x.Stadium,
                x.City,
                x.MatchDate,
                x.MatchTime,
                x.HomeScore,
                x.AwayScore))
            .ToListAsync(cancellationToken);

        return Ok(matches);
    }

    [HttpPut("{matchId:int}/result")]
    public async Task<IActionResult> UpdateResult(int matchId, UpdateResultRequest request, CancellationToken cancellationToken)
    {
        if (request.HomeScore < 0 || request.AwayScore < 0)
        {
            return BadRequest("Los marcadores no pueden ser negativos.");
        }

        var match = await db.Matches.FindAsync([matchId], cancellationToken);
        if (match is null)
        {
            return NotFound();
        }

        match.HomeScore = request.HomeScore;
        match.AwayScore = request.AwayScore;
        await db.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}
