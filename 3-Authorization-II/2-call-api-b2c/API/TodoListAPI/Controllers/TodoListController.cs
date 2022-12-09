using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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
        private readonly TodoContext _TodoListContext;
        private readonly IHttpContextAccessor _contextAccessor;
        private ClaimsPrincipal _currentPrincipal;

        /// <summary>
        /// We store the object id of the user/app derived from the presented Access token
        /// </summary>
        private string _currentPrincipalId = string.Empty;

        public TodoListController(TodoContext context, IHttpContextAccessor contextAccessor)
        {
            _TodoListContext = context;
            _contextAccessor = contextAccessor;

            // We seek the details of the user/app represented by the access token presented to this API, This can be empty unless authN succeeded
            // If a user signed-in, the value will be the unique identifier of the user.
            _currentPrincipal = GetCurrentClaimsPrincipal();

            if (!IsAppOnlyToken() && _currentPrincipal != null)
            {
                // The default behavior of the JwtSecurityTokenHandler is to map inbound claim names to new values in the generated ClaimsPrincipal. 
                // The result is that "sub" claim that identifies the subject of the incoming JWT token is mapped to a claim
                // named "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier". An alternative approach is to 
                // disable this mapping by setting JwtSecurityTokenHandler.DefaultMapInboundClaims to false in Startup.cs and
                // then calling _currentPrincipal.FindFirstValue(ClaimConstants.Sub) to obtain the value of the unmapped "sub" claim.
                _currentPrincipalId = _currentPrincipal.GetNameIdentifierId(); // use "sub" claim as a unique identifier in B2C
                PopulateDefaultToDos(_currentPrincipalId);
            }
        }

        // GET: api/todolist/getAll
        [HttpGet]
        [Route("getAll")]
        [RequiredScope(RequiredScopesConfigurationKey = "AzureAdB2C:Scopes:Read")]
        public async Task<ActionResult<IEnumerable<TodoItem>>> GetAll()
        {
            return await _TodoListContext.TodoItems.ToListAsync();
        }

        // GET: api/TodoItems
        [HttpGet]
        [RequiredScope(RequiredScopesConfigurationKey = "AzureAdB2C:Scopes:Read")]
        public async Task<ActionResult<IEnumerable<TodoItem>>> GetTodoItems()
        {
            /// <summary>
            /// The 'oid' (object id) is the only claim (alternatively "sub" claim in B2C) that should be used to uniquely 
            /// identify a user in an Azure AD tenant. The token might have one or more of the following claim,
            /// that might seem like a unique identifier, but is not and should not be used as such:
            ///
            /// - upn (user principal name): might be unique amongst the active set of users in a tenant
            /// but tend to get reassigned to new employees as employees leave the organization and others
            /// take their place or might change to reflect a personal change like marriage.
            ///
            /// - email: might be unique amongst the active set of users in a tenant but tend to get reassigned
            /// to new employees as employees leave the organization and others take their place.
            /// </summary>
            return await _TodoListContext.TodoItems.Where(x => x.Owner == _currentPrincipalId).ToListAsync();
        }

        // GET: api/TodoItems/5
        [HttpGet("{id}")]
        [RequiredScope(RequiredScopesConfigurationKey = "AzureAdB2C:Scopes:Read")]
        public async Task<ActionResult<TodoItem>> GetTodoItem(int id)
        {
            return await _TodoListContext.TodoItems.FirstOrDefaultAsync(t => t.Id == id && t.Owner == _currentPrincipalId);
        }

        // PUT: api/TodoItems/5
        // To protect from overposting attacks, please enable the specific properties you want to bind to, for
        // more details see https://aka.ms/RazorPagesCRUD.
        [HttpPut("{id}")]
        [RequiredScope(RequiredScopesConfigurationKey = "AzureAdB2C:Scopes:Write")]
        public async Task<IActionResult> PutTodoItem(int id, TodoItem todoItem)
        {
            if (id != todoItem.Id || !_TodoListContext.TodoItems.Any(x => x.Id == id))
            {
                return NotFound();
            }

            if (_TodoListContext.TodoItems.Any(x => x.Id == id && x.Owner == _currentPrincipalId))
            {
                _TodoListContext.Entry(todoItem).State = EntityState.Modified;

                try
                {
                    await _TodoListContext.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!_TodoListContext.TodoItems.Any(e => e.Id == id))
                    {
                        return NotFound();
                    }
                    else
                    {
                        throw;
                    }
                }
            }

            return NoContent();
        }

        // POST: api/TodoItems
        // To protect from overposting attacks, please enable the specific properties you want to bind to, for
        // more details see https://aka.ms/RazorPagesCRUD.
        [HttpPost]
        [RequiredScope(RequiredScopesConfigurationKey = "AzureAdB2C:Scopes:Write")]
        public async Task<ActionResult<TodoItem>> PostTodoItem(TodoItem todoItem)
        {
            todoItem.Owner = _currentPrincipalId;
            todoItem.Status = false;

            _TodoListContext.TodoItems.Add(todoItem);
            await _TodoListContext.SaveChangesAsync();

            return CreatedAtAction("GetTodoItem", new { id = todoItem.Id }, todoItem);
        }

        // DELETE: api/TodoItems/5
        [HttpDelete("{id}")]
        [RequiredScope(RequiredScopesConfigurationKey = "AzureAdB2C:Scopes:Write")]
        public async Task<ActionResult<TodoItem>> DeleteTodoItem(int id)
        {
            TodoItem todoItem = await _TodoListContext.TodoItems.FindAsync(id);

            if (todoItem == null)
            {
                return NotFound();
            }

            if (_TodoListContext.TodoItems.Any(x => x.Id == id && x.Owner == _currentPrincipalId))
            {
                _TodoListContext.TodoItems.Remove(todoItem);
                await _TodoListContext.SaveChangesAsync();
            }

            return NoContent();
        }

        private async void PopulateDefaultToDos(string _currentPrincipalId)
        {
            //Pre - populate with sample data
            if (_TodoListContext.TodoItems.Count() == 0 && !string.IsNullOrEmpty(_currentPrincipalId))
            {
                _TodoListContext.TodoItems.Add(new TodoItem() { Owner = $"{_currentPrincipalId}", Description = "Pick up groceries", Status = false });
                _TodoListContext.TodoItems.Add(new TodoItem() { Owner = $"{_currentPrincipalId}", Description = "Finish invoice report", Status = false });

                await _TodoListContext.SaveChangesAsync();
            }
        }

        /// <summary>
        /// returns the current claimsPrincipal (user/Client app) dehydrated from the Access token
        /// </summary>
        /// <returns></returns>
        private ClaimsPrincipal GetCurrentClaimsPrincipal()
        {
            // Irrespective of whether a user signs in or not, the AspNet security middleware dehydrates 
            // the claims in the HttpContext.User.Claims collection
            if (_contextAccessor.HttpContext != null && _contextAccessor.HttpContext.User != null)
            {
                return _contextAccessor.HttpContext.User;
            }

            return null;
        }

        /// <summary>
        /// Indicates of the AT presented was for an app-only token or not.
        /// </summary>
        /// <returns></returns>
        private bool IsAppOnlyToken()
        {
            // Add in the optional 'idtyp' claim to check if the access token is coming from an application or user.
            //
            // See: https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-optional-claims

            if (GetCurrentClaimsPrincipal() != null)
            {
                return GetCurrentClaimsPrincipal().Claims.Any(c => c.Type == "idtyp" && c.Value == "app");
            }

            return false;
        }
    }
}
