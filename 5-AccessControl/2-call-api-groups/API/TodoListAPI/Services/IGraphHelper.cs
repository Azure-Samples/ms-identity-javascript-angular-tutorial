using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using System.Threading.Tasks;

namespace TodoListAPI.Utils
{
    public interface IGraphHelper
    {
        bool CheckUsersGroupMembership(AuthorizationHandlerContext context, string GroupName);
        Task FetchSignedInUsersGroups();
    }
}