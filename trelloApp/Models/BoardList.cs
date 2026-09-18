public class BoardList
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "";
    public string BoardId { get; set; } = ""; // Foreign Key 
    public List<Card> Cards { get; set; } = new();
}