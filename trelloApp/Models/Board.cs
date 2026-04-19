public class Board
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "";
    public List<BoardList> Lists { get; set; } = new();
}
