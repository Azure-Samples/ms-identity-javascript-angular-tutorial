using Microsoft.EntityFrameworkCore;

namespace ProfileAPI.Models
{
    public class ProfileContext : DbContext
    {
        public ProfileContext(DbContextOptions<ProfileContext> options)
            : base(options)
        {

        }
        public DbSet<ProfileItem> ProfileItems { get; set; }
    }
}
