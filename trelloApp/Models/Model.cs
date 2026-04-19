
public record CreateBoardRequest(string Title);
public record CreateBoardListRequest(string Title);
public record CreateCardRequest(string Title, string Description);
public record MoveCardRequest(string TargetListId);