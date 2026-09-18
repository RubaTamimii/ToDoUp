using Microsoft.EntityFrameworkCore;
using trelloApp.Data;

namespace trelloApp.Endpoints
{
    public static class TasksEnpoints
    {

        // بيتأكد هل اليوزر عضو بهالبورد (owner أو مدعو)
        private static bool IsMember(Board board, string userId)
        {
            return board.BoardMembers.Any(m => m.UserId == userId);
        }


        // read user Id header , return null if missing
        //Endpoint  بدل ما اكتب بكل اندبوينت  نفس الكود ,  بعمله مرة هون وبستدعيه في كل 
        private static string? GetUserId(HttpRequest request)
        {
            return request.Headers.TryGetValue("X-User-Id", out var values)
                ? values.FirstOrDefault()
                : null;
        }


        // بيرجع board كامل مع الـ Lists والـ Cards والـ Members محملين مسبقاً
        private static IQueryable<Board> FullBoardQuery(AppDbContext db)
        {
            return db.Boards
                .Include(b => b.Lists)
                    .ThenInclude(l => l.Cards)
                .Include(b => b.BoardMembers);
        }



                              // Extension Method for ENDPOINTS 
          //Program.cs بضيف كل اندبوينت في هاد الميثود ,  وبستدعيها في 
        public static void MapTasksEndpoints(this WebApplication app)
        {

            // -----------------------------  Boards Endpoints ---------------------------------



            // GET boards 
            app.MapGet("/boards", async (AppDbContext db, HttpRequest request) =>
            {
                var userId = GetUserId(request);
                if (userId is null) {
                    return Results.Unauthorized();
                }

                var boards = await FullBoardQuery(db)
                    .Where(b => b.BoardMembers.Any(m => m.UserId == userId))
                    .ToListAsync();

                return Results.Ok(boards);
            });



            // GET    ex: /boards/15 -> route parameter 15 → id
            app.MapGet("/boards/{id}", async (string id, AppDbContext db, HttpRequest request) =>
            {
                var userId = GetUserId(request);
                if (userId is null) {
                    return Results.Unauthorized();
                }

                var board = await FullBoardQuery(db).FirstOrDefaultAsync(b => b.Id == id);

                if (board is null) {
                    return Results.NotFound();
                }

                if (!IsMember(board, userId)) {
                    return Results.Forbid();
                }

                return Results.Ok(board);
            });



            // POST /boards  -> create board received in the request body CreateBoardRequest req  
            app.MapPost("/boards", async (CreateBoardRequest req, AppDbContext db, HttpRequest request) =>
            {
                var userId = GetUserId(request);
                if (userId is null) {
                    return Results.Unauthorized();
                }

                var board = new Board
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = req.Title,
                    OwnerId = userId,
                };

                board.BoardMembers.Add(new BoardMember
                {
                    BoardId = board.Id,
                    UserId = userId,
                    Role = "owner",
                });

                db.Boards.Add(board);
                await db.SaveChangesAsync();

                return Results.Created($"/boards/{board.Id}", board);
            });




            // DELETE  ->post  عكس  

            app.MapDelete("/boards/{id}", async (string id, AppDbContext db, HttpRequest request) =>
            {
                var userId = GetUserId(request);
                if (userId is null) {
                    return Results.Unauthorized();
                }

                var board = await db.Boards.FirstOrDefaultAsync(b => b.Id == id);

                if (board is null) {
                    return Results.NotFound();
                }

                if (board.OwnerId != userId) {
                    return Results.Forbid();
                }

                db.Boards.Remove(board); // Cascade بيشيل كل الـ Lists/Cards/Members تبعها تلقائياً
                await db.SaveChangesAsync();

                return Results.NoContent();
            });



            // -----------------------------  Board Members Endpoints ---------------------------------


            // GET members  -> يجيب لستة الأعضاء بهالبورد (بترجع أرقام userId بس, زي ما الفرونت اند متوقع)
            app.MapGet("/boards/{boardId}/members", async (string boardId, AppDbContext db, HttpRequest request) =>
            {
                var userId = GetUserId(request);
                if (userId is null) {
                    return Results.Unauthorized();
                }

                var board = await db.Boards
                    .Include(b => b.BoardMembers)
                    .FirstOrDefaultAsync(b => b.Id == boardId);

                if (board is null) {
                    return Results.NotFound();
                }

                if (!IsMember(board, userId)) {
                    return Results.Forbid();
                }

                var memberIds = board.BoardMembers.Select(m => m.UserId).ToList();
                return Results.Ok(memberIds);
            });


            // POST members -> إضافة عضو جديد للبورد عن طريق الـ email (invite)
            app.MapPost("/boards/{boardId}/members",
                 async (string boardId, InviteMemberRequest req, AppDbContext db, HttpRequest request, IHttpClientFactory httpClientFactory) =>
            {
                var userId = GetUserId(request);
                if (userId is null) {
                    return Results.Unauthorized();
                }

                var board = await db.Boards
                    .Include(b => b.BoardMembers)
                    .FirstOrDefaultAsync(b => b.Id == boardId);

                if (board is null) {
                    return Results.NotFound();
                }

                if (board.OwnerId != userId) {
                    return Results.Forbid();
                }

                if (req.Email == "") {
                    return Results.BadRequest("Email is required.");
                }

                var clerkClient = httpClientFactory.CreateClient("Clerk");
                var clerkResponse = await clerkClient.GetAsync(
                    "users?email_address[]=" + Uri.EscapeDataString(req.Email)
                );

                if (!clerkResponse.IsSuccessStatusCode) {
                    return Results.Problem("Could not reach Clerk to look up the user.");
                }

                var clerkJson = await clerkResponse.Content.ReadAsStringAsync();
                var clerkUsers = System.Text.Json.JsonSerializer.Deserialize<List<ClerkUser>>(
                    clerkJson,
                    new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );

                if (clerkUsers is null || clerkUsers.Count == 0) {
                    return Results.NotFound("No ToDoUp user found with that email.");
                }

                var invitedUserId = clerkUsers[0].Id;

                if (invitedUserId == "" || invitedUserId is null) {
                    return Results.Problem("Could not resolve the invited user's id.");
                }

                if (board.BoardMembers.Any(m => m.UserId == invitedUserId)) {
                    var existingIds = board.BoardMembers.Select(m => m.UserId).ToList();
                    return Results.Ok(existingIds); // عضو أصلاً
                }

                board.BoardMembers.Add(new BoardMember
                {
                    BoardId = board.Id,
                    UserId = invitedUserId,
                    Role = "member",
                });

                await db.SaveChangesAsync();

                var memberIds = board.BoardMembers.Select(m => m.UserId).ToList();
                return Results.Ok(memberIds);
            });

            // DELETE members -> حذف عضو من البورد
            app.MapDelete("/boards/{boardId}/members/{memberId}",
                 async (string boardId, string memberId, AppDbContext db, HttpRequest request) =>
            {
                var userId = GetUserId(request);
                if (userId is null) {
                    return Results.Unauthorized();
                }

                var board = await db.Boards
                    .Include(b => b.BoardMembers)
                    .FirstOrDefaultAsync(b => b.Id == boardId);

                if (board is null) {
                    return Results.NotFound();
                }

                if (board.OwnerId != userId) {
                    return Results.Forbid();
                }

                if (memberId == board.OwnerId) {
                    return Results.BadRequest("Cannot remove the board owner.");
                }

                var member = board.BoardMembers.FirstOrDefault(m => m.UserId == memberId);
                if (member is not null) {
                    board.BoardMembers.Remove(member);
                    await db.SaveChangesAsync();
                }

                var memberIds = board.BoardMembers.Select(m => m.UserId).ToList();
                return Results.Ok(memberIds);
            });



            // -----------------------------  Lists Endpoints ---------------------------------


            // POST
            app.MapPost("/boards/{boardId}/lists",
                 async (string boardId, CreateBoardListRequest req, AppDbContext db, HttpRequest request) =>
            {
                var userId = GetUserId(request);
                if (userId is null) {
                    return Results.Unauthorized();
                }

                var board = await db.Boards
                    .Include(b => b.BoardMembers)
                    .Include(b => b.Lists)
                    .FirstOrDefaultAsync(b => b.Id == boardId);

                if (board is null) {
                    return Results.NotFound();
                }

                if (!IsMember(board, userId)) {
                    return Results.Forbid();
                }

                var list = new BoardList
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = req.Title,
                    BoardId = board.Id,
                };

                board.Lists.Add(list);
                await db.SaveChangesAsync();

                return Results.Created($"/boards/{boardId}/lists/{list.Id}", list);
            });

            // DELETE 
            app.MapDelete("/boards/{boardId}/lists/{listId}",
                 async (string boardId, string listId, AppDbContext db, HttpRequest request) =>
            {
                var userId = GetUserId(request);
                if (userId is null) {
                    return Results.Unauthorized();
                }

                var board = await db.Boards
                    .Include(b => b.BoardMembers)
                    .Include(b => b.Lists)
                    .FirstOrDefaultAsync(b => b.Id == boardId);

                if (board is null) {
                    return Results.NotFound();
                }

                if (!IsMember(board, userId)) {
                    return Results.Forbid();
                }

                var list = board.Lists.FirstOrDefault(l => l.Id == listId);
                if (list is null) {
                    return Results.NotFound();
                }

                board.Lists.Remove(list); // Cascade بيشيل الـ Cards تبعها
                await db.SaveChangesAsync();

                return Results.NoContent();
            });

            // PUT 
            app.MapPut("/boards/{boardId}/lists/{listId}",
                 async (string boardId, string listId, CreateBoardListRequest req, AppDbContext db, HttpRequest request) =>
            {
                var userId = GetUserId(request);
                if (userId is null) {
                    return Results.Unauthorized();
                }

                var board = await db.Boards
                    .Include(b => b.BoardMembers)
                    .Include(b => b.Lists)
                    .FirstOrDefaultAsync(b => b.Id == boardId);

                if (board is null) {
                    return Results.NotFound();
                }

                if (!IsMember(board, userId)) {
                    return Results.Forbid();
                }

                var list = board.Lists.FirstOrDefault(l => l.Id == listId);
                if (list is null) {
                    return Results.NotFound();
                }

                list.Title = req.Title;
                await db.SaveChangesAsync();

                return Results.Ok("success");
            });


            // -----------------------------  Cards Endpoints ---------------------------------



            // POST 
            app.MapPost("/boards/{boardId}/lists/{listId}/cards",
                 async (string boardId, string listId, CreateCardRequest req, AppDbContext db, HttpRequest request) =>
            {
                var userId = GetUserId(request);
                if (userId is null) {
                    return Results.Unauthorized();
                }

                var board = await db.Boards
                    .Include(b => b.BoardMembers)
                    .Include(b => b.Lists)
                        .ThenInclude(l => l.Cards)
                    .FirstOrDefaultAsync(b => b.Id == boardId);

                if (board is null) {
                    return Results.NotFound();
                }

                if (!IsMember(board, userId)) {
                    return Results.Forbid();
                }

                var list = board.Lists.FirstOrDefault(l => l.Id == listId);
                if (list is null) {
                    return Results.NotFound();
                }

                var card = new Card
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = req.Title,
                    Description = req.Description,
                    BoardListId = list.Id,
                };

                list.Cards.Add(card);
                await db.SaveChangesAsync();

                return Results.Created($"/boards/{boardId}/lists/{listId}/cards/{card.Id}", card);
            });


            // PUT
            app.MapPut("/boards/{boardId}/lists/{listId}/cards/{cardId}",
                 async (string boardId, string listId, string cardId, CreateCardRequest req, AppDbContext db, HttpRequest request) =>
            {
                var userId = GetUserId(request);
                if (userId is null) {
                    return Results.Unauthorized();
                }

                var board = await db.Boards
                    .Include(b => b.BoardMembers)
                    .Include(b => b.Lists)
                        .ThenInclude(l => l.Cards)
                    .FirstOrDefaultAsync(b => b.Id == boardId);

                if (board is null) {
                    return Results.NotFound();
                }

                if (!IsMember(board, userId)) {
                    return Results.Forbid();
                }

                var list = board.Lists.FirstOrDefault(l => l.Id == listId);
                if (list is null) {
                    return Results.NotFound();
                }

                var card = list.Cards.FirstOrDefault(c => c.Id == cardId);
                if (card is null) {
                    return Results.NotFound();
                }

                card.Title = req.Title;
                card.Description = req.Description;
                await db.SaveChangesAsync();

                return Results.Ok(card);
            });


            // DELETE
            app.MapDelete("/boards/{boardId}/lists/{listId}/cards/{cardId}",
                 async (string boardId, string listId, string cardId, AppDbContext db, HttpRequest request) =>
            {
                var userId = GetUserId(request);
                if (userId is null) {
                    return Results.Unauthorized();
                }

                var board = await db.Boards
                    .Include(b => b.BoardMembers)
                    .Include(b => b.Lists)
                        .ThenInclude(l => l.Cards)
                    .FirstOrDefaultAsync(b => b.Id == boardId);

                if (board is null) {
                    return Results.NotFound();
                }

                if (!IsMember(board, userId)) {
                    return Results.Forbid();
                }

                var list = board.Lists.FirstOrDefault(l => l.Id == listId);
                if (list is null) {
                    return Results.NotFound();
                }

                var card = list.Cards.FirstOrDefault(c => c.Id == cardId);
                if (card is null) {
                    return Results.NotFound();
                }

                list.Cards.Remove(card);
                await db.SaveChangesAsync();

                return Results.Ok();
            });


            // POST 
            app.MapPost("/boards/{boardId}/lists/{listId}/cards/{cardId}/move",
                 async (string boardId, string listId, string cardId, MoveCardRequest req, AppDbContext db, HttpRequest request) =>
            {
                var userId = GetUserId(request);
                if (userId is null) {
                    return Results.Unauthorized();
                }

                var board = await db.Boards
                    .Include(b => b.BoardMembers)
                    .Include(b => b.Lists)
                        .ThenInclude(l => l.Cards)
                    .FirstOrDefaultAsync(b => b.Id == boardId);

                if (board is null) {
                    return Results.NotFound();
                }

                if (!IsMember(board, userId)) {
                    return Results.Forbid();
                }

                var sourceList = board.Lists.FirstOrDefault(l => l.Id == listId);
                if (sourceList is null) {
                    return Results.NotFound();
                }

                var card = sourceList.Cards.FirstOrDefault(c => c.Id == cardId);
                if (card is null) {
                    return Results.NotFound();
                }

                var targetList = board.Lists.FirstOrDefault(l => l.Id == req.TargetListId);
                if (targetList is null) {
                    return Results.NotFound();
                }

                card.BoardListId = targetList.Id; // بدل نقل الكائن يدوياً بين قوائم بالذاكرة, هلأ بس بنغيّر الـ FK
                sourceList.Cards.Remove(card);
                targetList.Cards.Add(card);
                await db.SaveChangesAsync();

                return Results.Ok(card);
            });
        }
    }
}