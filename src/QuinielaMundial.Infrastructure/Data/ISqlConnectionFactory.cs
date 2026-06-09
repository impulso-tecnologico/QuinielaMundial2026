using System.Data;

namespace QuinielaMundial.Infrastructure.Data;

public interface ISqlConnectionFactory
{
    IDbConnection CreateConnection();
}
