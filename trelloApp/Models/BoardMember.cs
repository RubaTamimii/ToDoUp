public class BoardMember
{
    public int Id { get; set; } // Primary Key رقمي, EF بيولده تلقائياً
    public string BoardId { get; set; } = ""; // Foreign Key → أي board
    public string UserId { get; set; } = ""; // الـ Clerk userId
    public string Role { get; set; } = "member"; // "owner" أو "member"
}