using trelloApp.Endpoints;
using trelloApp.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// this : security access for the website
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin() // صلاحية للكل
.AllowAnyHeader() // أي هيدر مسموح Authorization
.AllowAnyMethod(); // أي طريقة طلب , GET, POST, DELETE
});
});


builder.Services.AddOpenApi();

// هيك بنضيف HttpClient مخصص للتواصل مع Clerk API عشان نلاقي يوزر بالـ email
builder.Services.AddHttpClient("Clerk", client =>
{
    client.BaseAddress = new Uri("https://api.clerk.com/v1/");
    client.DefaultRequestHeaders.Add(
        "Authorization",
        "Bearer " + builder.Configuration["Clerk:SecretKey"]
    );
});

// هيك بنسجل AppDbContext ونربطه بـ SQL Server عن طريق الـ connection string
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});

var app = builder.Build();

app.UseCors();
// app.UseDefaultFiles();
// app.UseStaticFiles();


// app.UseHttpsRedirection();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/api/test", () =>
{
    return "API is working";
});

// extension method
app.MapTasksEndpoints();

app.Run();