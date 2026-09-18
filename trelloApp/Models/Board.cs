public class Board
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "";
    public string OwnerId { get; set; } = "";
    public List<BoardList> Lists { get; set; } = new();
    public List<BoardMember> BoardMembers { get; set; } = new();
}