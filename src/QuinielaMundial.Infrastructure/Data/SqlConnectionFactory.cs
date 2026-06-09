using System.Data;
using Microsoft.Data.SqlClient;

namespace QuinielaMundial.Infrastructure.Data;

public sealed class SqlConnectionFactory(string connectionString) : ISqlConnectionFactory
{
    public IDbConnection CreateConnection()
    {
        return new SqlConnection(connectionString);
    }
}
