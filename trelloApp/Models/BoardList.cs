public class BoardList
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "";
    public List<Card> Cards { get; set; } = new();
}
