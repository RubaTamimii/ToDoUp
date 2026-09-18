using Microsoft.EntityFrameworkCore;

namespace trelloApp.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Board> Boards { get; set; }
        public DbSet<BoardList> BoardLists { get; set; }
        public DbSet<Card> Cards { get; set; }
        public DbSet<BoardMember> BoardMembers { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Board>()
                .HasMany(b => b.Lists)
                .WithOne()
                .HasForeignKey(l => l.BoardId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<BoardList>()
                .HasMany(l => l.Cards)
                .WithOne()
                .HasForeignKey(c => c.BoardListId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Board>()
                .HasMany(b => b.BoardMembers)
                .WithOne()
                .HasForeignKey(m => m.BoardId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}