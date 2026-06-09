namespace QuinielaMundial.Domain.Scoring;

public static class ScoreCalculator
{
    public static int? Calculate(int? predictedHome, int? predictedAway, int? realHome, int? realAway)
    {
        if (predictedHome is null || predictedAway is null || realHome is null || realAway is null)
        {
            return null;
        }

        if (predictedHome == realHome && predictedAway == realAway)
        {
            return 3;
        }

        return ResultType(predictedHome.Value, predictedAway.Value) == ResultType(realHome.Value, realAway.Value) ? 1 : 0;
    }

    private static int ResultType(int home, int away)
    {
        return home.CompareTo(away);
    }
}
