using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuinielaMundial.Api.Contracts.Standings;
using QuinielaMundial.Infrastructure.Persistence;

namespace QuinielaMundial.Api.Controllers;

[ApiController]
[Route("api/standings")]
public sealed class StandingsController(QuinielaDbContext db) : ControllerBase
{
    [HttpGet("groups")]
    public async Task<ActionResult<IReadOnlyDictionary<string, IReadOnlyList<TeamStandingResponse>>>> GetGroups(CancellationToken cancellationToken)
    {
        var matches = await db.Matches.AsNoTracking().OrderBy(x => x.MatchNumber).ToListAsync(cancellationToken);
        var standings = StandingsBuilder.Build(matches);

        return Ok(standings);
    }
}
