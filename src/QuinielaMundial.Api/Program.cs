using QuinielaMundial.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddInfrastructure(builder.Configuration);
// Leer los or�genes permitidos desde las variables de configuraci�n (Azure App Service)
var allowedOrigins = builder.Configuration["Cors:AllowedOrigins"]?
    .Split(";", StringSplitOptions.RemoveEmptyEntries);

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", cors =>
    {
        if (allowedOrigins != null)
        {
            cors.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .WithExposedHeaders("X-Mensaje");
        }
        else
        {
            cors.WithOrigins("https://localhost:5037")
               .AllowAnyHeader()
               .AllowAnyMethod()
               .WithExposedHeaders("X-Mensaje");
        }
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseCors("CorsPolicy");

app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();
 
