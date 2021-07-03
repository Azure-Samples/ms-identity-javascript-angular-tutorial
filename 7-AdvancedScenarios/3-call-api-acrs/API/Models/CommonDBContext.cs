using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

//using System.Data.Entity;

namespace TodoListService.Models
{
    public class CommonDBContext : DbContext
    {
        private readonly IConfiguration Configuration;

        public CommonDBContext(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public CommonDBContext(DbContextOptions<CommonDBContext> options, IConfiguration configuration) : base(options)
        {
            Configuration = configuration;
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            var connstr = Configuration.GetConnectionString("DefaultConnection");

            //optionsBuilder.UseSqlServer(@"Server=(localdb)\\mssqllocaldb;Database=CommonDBContext;Trusted_Connection=True;MultipleActiveResultSets=true");
            optionsBuilder.UseSqlServer(connstr);
        }

        public DbSet<Todo> Todo { get; set; }
        public DbSet<AuthContext> AuthContext { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<AuthContext>().HasKey(x => new { x.TenantId, x.Operation });
        }
    }
}