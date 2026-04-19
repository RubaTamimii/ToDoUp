using trelloApp.Endpoints;

var builder = WebApplication.CreateBuilder(args);

// this : security access for the website
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin() //  صلاحية للكل 
        .AllowAnyHeader() // أي هيدر مسموح Authorization
        .AllowAnyMethod(); // أي طريقة طلب   , GET, POST, DELETE 
    });
});

var app = builder.Build();

app.UseCors();
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapTasksEndpoints();

// ---------------------- open web page
app.MapGet("/", () =>
{
    var path = Path.Combine(AppContext.BaseDirectory, "wwwroot", "UserAccount.html");

    return Results.Redirect("/UserAccount.html");
});

app.Run();


// dotnet run --project "C:\Users\2024\Desktop\trelloApp\trelloApp\trelloApp.csproj"