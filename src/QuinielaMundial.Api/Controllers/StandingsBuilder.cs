using QuinielaMundial.Api.Contracts.Standings;
using QuinielaMundial.Domain.Entities;

namespace QuinielaMundial.Api.Controllers;

internal static class StandingsBuilder
{
    public static IReadOnlyDictionary<string, IReadOnlyList<TeamStandingResponse>> Build(IReadOnlyList<Match> matches)
    {
        var standings = new Dictionary<string, Dictionary<string, MutableStanding>>();

        foreach (var match in matches)
        {
            if (!standings.ContainsKey(match.Group))
            {
                standings[match.Group] = [];
            }

            AddTeam(standings[match.Group], match.HomeTeam, match.Group);
            AddTeam(standings[match.Group], match.AwayTeam, match.Group);

            if (match.HomeScore is null || match.AwayScore is null)
            {
                continue;
            }

            var home = standings[match.Group][match.HomeTeam];
            var away = standings[match.Group][match.AwayTeam];

            home.Played++;
            away.Played++;
            home.GoalsFor += match.HomeScore.Value;
            home.GoalsAgainst += match.AwayScore.Value;
            away.GoalsFor += match.AwayScore.Value;
            away.GoalsAgainst += match.HomeScore.Value;

            if (match.HomeScore > match.AwayScore)
            {
                home.Points += 3;
            }
            else if (match.AwayScore > match.HomeScore)
            {
                away.Points += 3;
            }
            else
            {
                home.Points++;
                away.Points++;
            }
        }

        return standings.ToDictionary(
            group => group.Key,
            group => (IReadOnlyList<TeamStandingResponse>)group.Value.Values
                .OrderByDescending(x => x.Points)
                .ThenByDescending(x => x.GoalDifference)
                .ThenByDescending(x => x.GoalsFor)
                .ThenBy(x => x.GoalsAgainst)
                .ThenBy(x => x.Team)
                .Select((x, index) => new TeamStandingResponse(
                    x.Team,
                    x.Group,
                    x.Played,
                    x.Points,
                    x.GoalsFor,
                    x.GoalsAgainst,
                    x.GoalDifference,
                    index + 1))
                .ToList());
    }

    private static void AddTeam(Dictionary<string, MutableStanding> standings, string team, string group)
    {
        if (!standings.ContainsKey(team))
        {
            standings[team] = new MutableStanding(team, group);
        }
    }

    private sealed class MutableStanding(string team, string group)
    {
        public string Team { get; } = team;
        public string Group { get; } = group;
        public int Played { get; set; }
        public int Points { get; set; }
        public int GoalsFor { get; set; }
        public int GoalsAgainst { get; set; }
        public int GoalDifference => GoalsFor - GoalsAgainst;
    }
}
