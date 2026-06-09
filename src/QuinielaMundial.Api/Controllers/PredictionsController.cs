using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuinielaMundial.Api.Contracts.Predictions;
using QuinielaMundial.Domain.Entities;
using QuinielaMundial.Domain.Scoring;
using QuinielaMundial.Infrastructure.Persistence;

namespace QuinielaMundial.Api.Controllers;

[ApiController]
[Route("api/participants/{participantId:int}/predictions")]
public sealed class PredictionsController(QuinielaDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PredictionResponse>>> GetForParticipant(int participantId, CancellationToken cancellationToken)
    {
        var exists = await db.Participants.AnyAsync(x => x.Id == participantId, cancellationToken);
        if (!exists)
        {
            return NotFound("Participante no encontrado.");
        }

        var predictions = await db.Predictions
            .AsNoTracking()
            .Include(x => x.Match)
            .Where(x => x.ParticipantId == participantId)
            .OrderBy(x => x.Match!.MatchNumber)
            .Select(x => new PredictionResponse(
                x.Id,
                x.ParticipantId,
                x.MatchId,
                x.HomeScore,
                x.AwayScore,
                ScoreCalculator.Calculate(x.HomeScore, x.AwayScore, x.Match!.HomeScore, x.Match.AwayScore),
                x.UpdatedAtUtc))
            .ToListAsync(cancellationToken);

        return Ok(predictions);
    }

    [HttpPut("{matchId:int}")]
    public async Task<ActionResult<PredictionResponse>> Upsert(
        int participantId,
        int matchId,
        UpsertPredictionRequest request,
        CancellationToken cancellationToken)
    {
        if (request.HomeScore < 0 || request.AwayScore < 0)
        {
            return BadRequest("Los marcadores no pueden ser negativos.");
        }

        var participantExists = await db.Participants.AnyAsync(x => x.Id == participantId, cancellationToken);
        if (!participantExists)
        {
            return NotFound("Participante no encontrado.");
        }

        var match = await db.Matches.FindAsync([matchId], cancellationToken);
        if (match is null)
        {
            return NotFound("Partido no encontrado.");
        }

        var prediction = await db.Predictions
            .FirstOrDefaultAsync(x => x.ParticipantId == participantId && x.MatchId == matchId, cancellationToken);

        if (prediction is null)
        {
            prediction = new Prediction
            {
                ParticipantId = participantId,
                MatchId = matchId
            };
            db.Predictions.Add(prediction);
        }

        prediction.HomeScore = request.HomeScore;
        prediction.AwayScore = request.AwayScore;
        prediction.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        return Ok(new PredictionResponse(
            prediction.Id,
            prediction.ParticipantId,
            prediction.MatchId,
            prediction.HomeScore,
            prediction.AwayScore,
            ScoreCalculator.Calculate(prediction.HomeScore, prediction.AwayScore, match.HomeScore, match.AwayScore),
            prediction.UpdatedAtUtc));
    }
}
