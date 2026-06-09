using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using QuinielaMundial.Infrastructure.Persistence;

namespace QuinielaMundial.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("QuinielaDb")
            ?? throw new InvalidOperationException("Connection string 'QuinielaDb' was not found.");

        services.AddDbContext<QuinielaDbContext>(options => options.UseSqlServer(connectionString));

        return services;
    }
}
