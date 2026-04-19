namespace trelloApp.Endpoints
{
    public static class TasksEnpoints
    {
        // data.json is saved in the project root 
        
        private static readonly string DataFilePath =
            Path.Combine(Directory.GetCurrentDirectory(), "data.json");

        //  userId → their boards  
        private static Dictionary<string, List<Board>> userBoards = Load();

        // Load, read data.json from disk into memory
        private static Dictionary<string, List<Board>> Load()
        {
            try
            {
                if (File.Exists(DataFilePath))
                {
                    var json = File.ReadAllText(DataFilePath);
                    var result = System.Text.Json.JsonSerializer.Deserialize
                        <Dictionary<string, List<Board>>>(json);
                    return result ?? new Dictionary<string, List<Board>>();
                }
            }
            catch
            {
                // If file is corrupted → start fresh
            }

            return new Dictionary<string, List<Board>>();
        }

        //  write all user data to disk
        private static void Save()
        {
            var json = System.Text.Json.JsonSerializer.Serialize(
                userBoards,
                new System.Text.Json.JsonSerializerOptions { WriteIndented = true }
            );
            File.WriteAllText(DataFilePath, json);
        }

       
        // Get / create board list for user
        private static List<Board> GetUserBoards(string userId)
        {
            if (!userBoards.ContainsKey(userId))
            {
                userBoards[userId] = new List<Board>();
            }

            return userBoards[userId];
        }

        // read user Id header , return null if missing
        private static string? GetUserId(HttpRequest request)
        {
            return request.Headers.TryGetValue("X-User-Id", out var values)
                ? values.FirstOrDefault()
                : null;
        }

        //  ENDPOINTS 
        public static void MapTasksEndpoints(this WebApplication app)
        {
            // GET ,  only user boards
            app.MapGet("/boards", (HttpRequest request) =>
            {
                var userId = GetUserId(request);
                if (userId is null) { return Results.Unauthorized(); }

                return Results.Ok(GetUserBoards(userId));
            });

            // GET 
            app.MapGet("/boards/{id}", (string id, HttpRequest request) =>
            {
                var userId = GetUserId(request);
                if (userId is null) {
                    return Results.Unauthorized(); 
                }

                var board = GetUserBoards(userId).FirstOrDefault(b => b.Id == id);
                return board is null ? Results.NotFound() : Results.Ok(board);
            });

            // POST /boards
            app.MapPost("/boards", (CreateBoardRequest req, HttpRequest request) =>
            {
                var userId = GetUserId(request);
                if (userId is null) {
                    return Results.Unauthorized();
                }

                var board = new Board
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = req.Title,
                    Lists = new List<BoardList>()
                };

                GetUserBoards(userId).Add(board);
                Save(); 
                return Results.Created($"/boards/{board.Id}", board);
            });

            // DELETE 
            app.MapDelete("/boards/{id}", (string id, HttpRequest request) =>
            {
                var userId = GetUserId(request);
                if (userId is null) {
                    return Results.Unauthorized();
                }

                var boards = GetUserBoards(userId);
                var board = boards.FirstOrDefault(b => b.Id == id);
                if (board is null) {
                    return Results.NotFound();
                }

                boards.Remove(board);
                Save(); 
                return Results.NoContent();
            });

            // POST
            app.MapPost("/boards/{boardId}/lists", (string boardId, CreateBoardListRequest req, HttpRequest request) =>
            {
                var userId = GetUserId(request);
                if (userId is null) {
                    return Results.Unauthorized();
                }

                var board = GetUserBoards(userId).FirstOrDefault(b => b.Id == boardId);
                if (board is null) {
                    return Results.NotFound();
                }

                var list = new BoardList
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = req.Title,
                    Cards = new List<Card>()
                };

                board.Lists.Add(list);
                Save(); 
                return Results.Created($"/boards/{boardId}/lists/{list.Id}", list);
            });

            // DELETE 
            app.MapDelete("/boards/{boardId}/lists/{listId}", (string boardId, string listId, HttpRequest request) =>
            {
                var userId = GetUserId(request);
                if (userId is null) {
                    return Results.Unauthorized(); 
                }

                var board = GetUserBoards(userId).FirstOrDefault(b => b.Id == boardId);
                if (board is null) {
                    return Results.NotFound();
                }

                var list = board.Lists.FirstOrDefault(l => l.Id == listId);
                if (list is null) {
                    return Results.NotFound();
                }

                board.Lists.Remove(list);
                Save(); 
                return Results.NoContent();
            });

            // PUT 
            app.MapPut("/boards/{boardId}/lists/{listId}", (string boardId, string listId, CreateBoardListRequest req, HttpRequest request) =>
            {
                var userId = GetUserId(request);
                if (userId is null) {
                    return Results.Unauthorized(); 
                }

                var board = GetUserBoards(userId).FirstOrDefault(b => b.Id == boardId);
                if (board is null) { 
                    return Results.NotFound(); 
                }

                var list = board.Lists.FirstOrDefault(l => l.Id == listId);
                if (list is null) {
                    return Results.NotFound();
                }

                list.Title = req.Title;
                Save(); 
                return Results.Ok("success");
            });

            // POST 
            app.MapPost("/boards/{boardId}/lists/{listId}/cards", (string boardId, string listId, CreateCardRequest req, HttpRequest request) =>
            {
                var userId = GetUserId(request);
                if (userId is null) { return Results.Unauthorized(); }

                var board = GetUserBoards(userId).FirstOrDefault(b => b.Id == boardId);
                if (board is null) { return Results.NotFound(); }

                var list = board.Lists.FirstOrDefault(l => l.Id == listId);
                if (list is null) { return Results.NotFound(); }

                var card = new Card
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = req.Title,
                    Description = req.Description
                };

                list.Cards.Add(card);
                Save(); //  to disk
                return Results.Created($"/boards/{boardId}/lists/{listId}/cards/{card.Id}", card);
            });

            // PUT
            app.MapPut("/boards/{boardId}/lists/{listId}/cards/{cardId}", (string boardId, string listId, string cardId, CreateCardRequest req, HttpRequest request) =>
            {
                var userId = GetUserId(request);
                if (userId is null) {
                    return Results.Unauthorized(); 
                }

                var board = GetUserBoards(userId).FirstOrDefault(b => b.Id == boardId);
                if (board is null) {
                    return Results.NotFound();
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
                Save(); 
                return Results.Ok(card);
            });

            // DELETE
            app.MapDelete("/boards/{boardId}/lists/{listId}/cards/{cardId}", (string boardId, string listId, string cardId, HttpRequest request) =>
            {
                var userId = GetUserId(request);
                if (userId is null) {
                    return Results.Unauthorized(); 
                }

                var board = GetUserBoards(userId).FirstOrDefault(b => b.Id == boardId);
                if (board is null) {
                    return Results.NotFound();
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
                Save(); 
                return Results.Ok();
            });

            // POST 
            app.MapPost("/boards/{boardId}/lists/{listId}/cards/{cardId}/move", (string boardId, string listId, string cardId, MoveCardRequest req, HttpRequest request) =>
            {
                var userId = GetUserId(request);
                if (userId is null) { 
                    return Results.Unauthorized(); 
                }

                var board = GetUserBoards(userId).FirstOrDefault(b => b.Id == boardId);
                if (board is null) {
                    return Results.NotFound();
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

                sourceList.Cards.Remove(card);
                targetList.Cards.Add(card);
                Save(); 
                return Results.Ok(card);
            });
        }
    }
}