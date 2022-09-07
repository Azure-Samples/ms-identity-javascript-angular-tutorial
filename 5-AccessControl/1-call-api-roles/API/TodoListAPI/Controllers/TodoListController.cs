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
using TodoListAPI.Infrastructure;

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

        // GET: api/todolist/getAll
        [HttpGet]
        [Route("getAll")]
        [RequiredScope(RequiredScopesConfigurationKey = "AzureAd:Scopes")]
        [Authorize(Policy = AuthorizationPolicies.AssignmentToTaskAdminRoleRequired)]
        public async Task<ActionResult<IEnumerable<TodoItem>>> GetAll()
        {
            return await _context.TodoItems.ToListAsync();
        }

        // GET: api/TodoItems
        [HttpGet]
        [RequiredScope(RequiredScopesConfigurationKey = "AzureAd:Scopes")]
        [Authorize(Policy = AuthorizationPolicies.AssignmentToTaskUserRoleRequired)]
        public async Task<ActionResult<IEnumerable<TodoItem>>> GetTodoItems()
        {
            /// <summary>
            /// The 'oid' (object id) is the only claim that should be used to uniquely identify
            /// a user in an Azure AD tenant. The token might have one or more of the following claim,
            /// that might seem like a unique identifier, but is not and should not be used as such:
            ///
            /// - upn (user principal name): might be unique amongst the active set of users in a tenant
            /// but tend to get reassigned to new employees as employees leave the organization and others
            /// take their place or might change to reflect a personal change like marriage.
            ///
            /// - email: might be unique amongst the active set of users in a tenant but tend to get reassigned
            /// to new employees as employees leave the organization and others take their place.
            /// </summary>
            return await _context.TodoItems.Where(x => x.Owner == HttpContext.User.GetObjectId()).ToListAsync();
        }

        // GET: api/TodoItems/5
        [HttpGet("{id}")]
        [RequiredScope(RequiredScopesConfigurationKey = "AzureAd:Scopes")]
        [Authorize(Policy = AuthorizationPolicies.AssignmentToTaskUserRoleRequired)]
        public async Task<ActionResult<TodoItem>> GetTodoItem(int id)
        {
            return await _context.TodoItems.FirstOrDefaultAsync(t => t.Id == id && t.Owner == HttpContext.User.GetObjectId());
        }

        // PUT: api/TodoItems/5
        // To protect from overposting attacks, please enable the specific properties you want to bind to, for
        // more details see https://aka.ms/RazorPagesCRUD.
        [HttpPut("{id}")]
        [RequiredScope(RequiredScopesConfigurationKey = "AzureAd:Scopes")]
        [Authorize(Policy = AuthorizationPolicies.AssignmentToTaskUserRoleRequired)]
        public async Task<IActionResult> PutTodoItem(int id, TodoItem todoItem)
        {
            if (id != todoItem.Id  || !_context.TodoItems.Any(x => x.Id == id))
            {
                return NotFound();
            }


            if (_context.TodoItems.Any(x => x.Id == id && x.Owner == HttpContext.User.GetObjectId()))
            {
                _context.Entry(todoItem).State = EntityState.Modified;

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!_context.TodoItems.Any(e => e.Id == id))
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
        [RequiredScope(RequiredScopesConfigurationKey = "AzureAd:Scopes")]
        [Authorize(Policy = AuthorizationPolicies.AssignmentToTaskUserRoleRequired)]
        public async Task<ActionResult<TodoItem>> PostTodoItem(TodoItem todoItem)
        {
            todoItem.Owner = HttpContext.User.GetObjectId();
            todoItem.Status = false;

            _context.TodoItems.Add(todoItem);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetTodoItem", new { id = todoItem.Id }, todoItem);
        }

        // DELETE: api/TodoItems/5
        [HttpDelete("{id}")]
        [RequiredScope(RequiredScopesConfigurationKey = "AzureAd:Scopes")]
        [Authorize(Policy = AuthorizationPolicies.AssignmentToTaskUserRoleRequired)]
        public async Task<ActionResult<TodoItem>> DeleteTodoItem(int id)
        {
            TodoItem todoItem = await _context.TodoItems.FindAsync(id);

            if (todoItem == null)
            {
                return NotFound();
            }

            if (_context.TodoItems.Any(x => x.Id == id && x.Owner == HttpContext.User.GetObjectId()))
            {
                _context.TodoItems.Remove(todoItem);
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }
    }
}
