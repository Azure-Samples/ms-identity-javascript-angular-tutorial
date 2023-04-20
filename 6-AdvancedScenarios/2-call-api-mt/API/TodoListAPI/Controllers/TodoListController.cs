using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using Microsoft.Identity.Web.Resource;
using TodoListAPI.Models;

namespace TodoListAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class TodoListController : ControllerBase
    {
        private readonly TodoContext _context;

        public TodoListController(TodoContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Indicates if the AT presented has application or delegated permissions.
        /// </summary>
        /// <returns></returns>
        private bool IsAppOnlyToken()
        {
            // Add in the optional 'idtyp' claim to check if the access token is coming from an application or user.
            // See: https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-optional-claims
            if (HttpContext.User.Claims.Any(c => c.Type == "idtyp"))
            {
                return HttpContext.User.Claims.Any(c => c.Type == "idtyp" && c.Value == "app");
            }
            else
            {
                // alternatively, if an AT contains the roles claim but no scp claim, that indicates it's an app token
                return HttpContext.User.Claims.Any(c => c.Type == "roles") && !HttpContext.User.Claims.Any(c => c.Type == "scp");
            }
        }

        // GET: api/TodoItems
        [HttpGet]
        /// <summary>
        /// Access tokens that have neither the 'scp' (for delegated permissions) nor
        /// 'roles' (for application permissions) claim are not to be honored.
        ///
        /// An access token issued by Azure AD will have at least one of the two claims. Access tokens
        /// issued to a user will have the 'scp' claim. Access tokens issued to an application will have
        /// the roles claim. Access tokens that contain both claims are issued only to users, where the scp
        /// claim designates the delegated permissions, while the roles claim designates the user's role.
        ///
        /// To determine whether an access token was issued to a user (i.e delegated) or an application
        /// more easily, we recommend enabling the optional claim 'idtyp'. For more information, see:
        /// https://docs.microsoft.com/azure/active-directory/develop/access-tokens#user-and-application-tokens
        /// </summary>
        [RequiredScopeOrAppPermission(
            RequiredScopesConfigurationKey = "AzureAD:Scopes:Read",
            RequiredAppPermissionsConfigurationKey = "AzureAD:AppPermissions:Read"
        )]
        public async Task<ActionResult<IEnumerable<TodoItem>>> GetTodoItems()
        {
            if (!IsAppOnlyToken())
            {
                /// <summary>
                /// The 'oid' (object id) is the only claim that should be used to uniquely identify
                /// a user in an Azure AD tenant. In multi-tenant scenarios, "oid" should be used together 
                /// with "tid" (tenant id) claim to uniquely and reliably identify a user across tenants.
                /// </summary>
                return await _context.TodoItems.Where(t => t.OwnerTenantId == HttpContext.User.GetTenantId()).ToListAsync();
            }
            else
            {
                return await _context.TodoItems.ToListAsync();
            }
        }

        // GET: api/TodoItems/5
        [HttpGet("{id}")]
        [RequiredScopeOrAppPermission(
            RequiredScopesConfigurationKey = "AzureAD:Scopes:Read",
            RequiredAppPermissionsConfigurationKey = "AzureAD:AppPermissions:Read"
        )]
        public async Task<ActionResult<TodoItem>> GetTodoItem(int id)
        {
            // if it only has delegated permissions, then it will be t.id==id && x.Owner == owner
            // if it has app permissions the it will return t.id==id
            if (!IsAppOnlyToken())
            {
                return await _context.TodoItems.FirstOrDefaultAsync(t => t.Id == id && t.OwnerTenantId == HttpContext.User.GetTenantId());
            }
            else
            {
                return await _context.TodoItems.FirstOrDefaultAsync(t => t.Id == id);
            }
        }

        // PUT: api/TodoItems/5
        // To protect from overposting attacks, please enable the specific properties you want to bind to, for
        // more details see https://aka.ms/RazorPagesCRUD.
        [HttpPut("{id}")]
        [RequiredScopeOrAppPermission(
            RequiredScopesConfigurationKey = "AzureAD:Scopes:Write",
            RequiredAppPermissionsConfigurationKey = "AzureAD:AppPermissions:Write"
        )]
        public async Task<IActionResult> PutTodoItem(int id, TodoItem todoItem)
        {
            if (id != todoItem.Id  || !_context.TodoItems.Any(t => t.Id == id))
            {
                return NotFound();
            }


            if ((!IsAppOnlyToken() && _context.TodoItems.Any(t => t.Id == id && t.OwnerId == HttpContext.User.GetObjectId() && t.OwnerTenantId == HttpContext.User.GetTenantId()))
                ||
                IsAppOnlyToken())
            {
                if (_context.TodoItems.Any(t => t.Id == id && t.OwnerId == HttpContext.User.GetObjectId() && t.OwnerTenantId == HttpContext.User.GetTenantId()))
                {
                    _context.Entry(todoItem).State = EntityState.Modified;

                    try
                    {
                        await _context.SaveChangesAsync();
                    }
                    catch (DbUpdateConcurrencyException)
                    {
                        if (!_context.TodoItems.Any(t => t.Id == id))
                        {
                            return NotFound();
                        }
                        else
                        {
                            throw;
                        }
                    }
                }
            }

            return NoContent();
        }

        // POST: api/TodoItems
        // To protect from overposting attacks, please enable the specific properties you want to bind to, for
        // more details see https://aka.ms/RazorPagesCRUD.
        [HttpPost]
        [RequiredScopeOrAppPermission(
            RequiredScopesConfigurationKey = "AzureAD:Scopes:Write",
            RequiredAppPermissionsConfigurationKey = "AzureAD:AppPermissions:Write"
        )]
        public async Task<ActionResult<TodoItem>> PostTodoItem(TodoItem todoItem)
        {
            string ownerId = HttpContext.User.GetObjectId();
            string tenantId = HttpContext.User.GetTenantId();
            string ownerDisplayName = HttpContext.User.GetDisplayName();

            if (IsAppOnlyToken())
            {
                // with such a permission any owner id is accepted
                ownerId = todoItem.OwnerId;
                tenantId = todoItem.OwnerTenantId;
                ownerDisplayName = todoItem.OwnerDisplayName;
            }

            // populate the owner id and tenant id
            todoItem.OwnerId = ownerId;
            todoItem.OwnerDisplayName = ownerDisplayName;
            todoItem.OwnerTenantId = tenantId;
            todoItem.Status = false;

            _context.TodoItems.Add(todoItem);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetTodoItem", new { id = todoItem.Id }, todoItem);
        }

        // DELETE: api/TodoItems/5
        [HttpDelete("{id}")]
        [RequiredScopeOrAppPermission(
            RequiredScopesConfigurationKey = "AzureAD:Scopes:Write",
            RequiredAppPermissionsConfigurationKey = "AzureAD:AppPermissions:Write"
        )]
        public async Task<ActionResult<TodoItem>> DeleteTodoItem(int id)
        {
            TodoItem todoItem = await _context.TodoItems.FindAsync(id);

            if (todoItem == null)
            {
                return NotFound();
            }

            if ((!IsAppOnlyToken() && _context.TodoItems.Any(t => t.Id == id && t.OwnerId == HttpContext.User.GetObjectId() && t.OwnerTenantId == HttpContext.User.GetTenantId()))
                ||
                IsAppOnlyToken())
            {
                _context.TodoItems.Remove(todoItem);
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }
    }
}
