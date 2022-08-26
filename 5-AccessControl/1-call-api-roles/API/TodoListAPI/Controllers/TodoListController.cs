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
using TodoListAPI.Utils;

namespace TodoListAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class TodoListController : ControllerBase
    {
        private readonly TodoContext _context;

        private const string _todoListRead = "TodoList.Read";
        private const string _todoListReadWrite = "TodoList.ReadWrite";

        public TodoListController(TodoContext context)
        {
            _context = context;
        }

        // GET: api/todolist/getAll
        [HttpGet]
        [Route("getAll")]
        [Authorize(Policy = AuthorizationPolicies.AssignmentToTaskAdminRoleRequired)]
        [RequiredScopeOrAppPermission(
            AcceptedScope = new string[] { _todoListRead }
        )]
        public async Task<ActionResult<IEnumerable<TodoItem>>> GetAll()
        {
            return await _context.TodoItems.ToListAsync();
        }

        // GET: api/TodoItems
        [HttpGet]
        [Authorize(Policy = AuthorizationPolicies.AssignmentToTaskUserRoleRequired)]
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
            AcceptedScope = new string[] { _todoListRead, _todoListReadWrite }
        )]
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
        [Authorize(Policy = AuthorizationPolicies.AssignmentToTaskUserRoleRequired)]
        [RequiredScopeOrAppPermission(
            AcceptedScope = new string[] { _todoListRead, _todoListReadWrite }
        )]
        public async Task<ActionResult<TodoItem>> GetTodoItem(int id)
        {
            return await _context.TodoItems.FirstOrDefaultAsync(t => t.Id == id && t.Owner == HttpContext.User.GetObjectId());
        }

        // PUT: api/TodoItems/5
        // To protect from overposting attacks, please enable the specific properties you want to bind to, for
        // more details see https://aka.ms/RazorPagesCRUD.
        [HttpPut("{id}")]
        [Authorize(Policy = AuthorizationPolicies.AssignmentToTaskUserRoleRequired)]
        [RequiredScopeOrAppPermission(
            AcceptedScope = new string[] { _todoListReadWrite }
        )]
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
        [Authorize(Policy = AuthorizationPolicies.AssignmentToTaskUserRoleRequired)]
        [RequiredScopeOrAppPermission(
            AcceptedScope = new string[] { _todoListReadWrite }
        )]
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
        [Authorize(Policy = AuthorizationPolicies.AssignmentToTaskUserRoleRequired)]
        [RequiredScopeOrAppPermission(
            AcceptedScope = new string[] { _todoListReadWrite }
        )]
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
