using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TodoListAPI.Models;
using System.Security.Claims;
using Microsoft.Identity.Web;
using Microsoft.Identity.Web.Resource;



// using Microsoft.AspNetCore.Authorization;
// using Microsoft.AspNetCore.Http;
// using Microsoft.AspNetCore.Mvc;
// using Microsoft.Identity.Web;
// using Microsoft.Identity.Web.Resource;
// using System;
// using System.Collections.Generic;
// using System.Linq;
// using System.Security.Claims;
// using TodoListClient.Models;

namespace TodoListAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class TodoListController : ControllerBase
    {
        // The Web API will only accept tokens 1) for users, and
        // 2) having the access_as_user scope for this API
        static readonly string[] scopeRequiredByApi = new string[] { "access_as_user" };

        private readonly TodoContext _context;

        public TodoListController(TodoContext context)
        {
            _context = context;
        }

        // GET: api/TodoItems
        [HttpGet]
        [RequiredScopeOrAppPermission(
          AcceptedScope = new string[] { "TodoList.Read", "TodoList.ReadWrite" },
          AcceptedAppPermission = new string[] { "TodoList.Read.All", "TodoList.ReadWrite.All" }
        )]
        public async Task<ActionResult<IEnumerable<TodoItem>>> GetTodoItems()
        {
            if (HasDelegatedPermissions(new string[] { "TodoList.Read", "TodoList.ReadWrite" }))
            {
                return await _context.TodoItems.Where(x => x.Owner == HttpContext.User.GetObjectId()).ToListAsync();
            }
            else if (HasApplicationPermissions(new string[] { "TodoList.Read.All", "TodoList.ReadWrite.All" }))
            {
                return await _context.TodoItems.ToListAsync();
            }

            return null;
        }

        // GET: api/TodoItems/5
        [HttpGet("{id}")]
        public async Task<ActionResult<TodoItem>> GetTodoItem(int id)
        {
            HttpContext.VerifyUserHasAnyAcceptedScope(scopeRequiredByApi);

            var todoItem = await _context.TodoItems.FindAsync(id);

            if (todoItem == null)
            {
                return NotFound();
            }

            return todoItem;
        }

        // [HttpGet("{id}", Name = "Get")]
        // [RequiredScopeOrAppPermission(
        //     AcceptedScope = new string[] { "ToDoList.Read", "ToDoList.ReadWrite" },
        //     AcceptedAppPermission = new string[] { "ToDoList.Read.All", "ToDoList.ReadWrite.All" })]
        // public Todo Get(int id)
        // {
        //     //if it only has delegated permissions
        //     //then it will be t.id==id && x.Owner == owner
        //     //if it has app permissions the it will return  t.id==id

        //     if (HasDelegatedPermissions(new string[] { "ToDoList.Read", "ToDoList.ReadWrite" }))
        //     {
        //         return TodoStore.Values.FirstOrDefault(t => t.Id == id && t.Owner == _contextAccessor.HttpContext.User.GetObjectId());
        //     }
        //     else if (HasApplicationPermissions(new string[] { "ToDoList.Read.All", "ToDoList.ReadWrite.All" }))
        //     {
        //         return TodoStore.Values.FirstOrDefault(t => t.Id == id);
        //     }

        //     return null;
        // }

        // PUT: api/TodoItems/5
        // To protect from overposting attacks, please enable the specific properties you want to bind to, for
        // more details see https://aka.ms/RazorPagesCRUD.
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTodoItem(int id, TodoItem todoItem)
        {
            HttpContext.VerifyUserHasAnyAcceptedScope(scopeRequiredByApi);

            if (id != todoItem.Id)
            {
                return BadRequest();
            }

            _context.Entry(todoItem).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TodoItemExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // [HttpPatch("{id}")]
        //     [RequiredScopeOrAppPermission(
        //         AcceptedScope = new string[] { "ToDoList.ReadWrite" },
        //         AcceptedAppPermission = new string[] { "ToDoList.ReadWrite.All" })]
        //     public IActionResult Patch(int id, [FromBody] Todo todo)
        //     {
        //         if (id != todo.Id || !TodoStore.Values.Any(x => x.Id == id))
        //         {
        //             return NotFound();
        //         }

        //         if (
        //             HasDelegatedPermissions(new string[] { "ToDoList.ReadWrite" })
        //             && TodoStore.Values.Any(x => x.Id == id && x.Owner == _contextAccessor.HttpContext.User.GetObjectId())
        //             && todo.Owner == _contextAccessor.HttpContext.User.GetObjectId()

        //             ||

        //             HasApplicationPermissions(new string[] { "ToDoList.ReadWrite.All" })

        //             )
        //         {
        //             TodoStore.Remove(id);
        //             TodoStore.Add(id, todo);

        //             return Ok(todo);
        //         }

        //         return BadRequest();
        //     }

        // POST: api/TodoItems
        // To protect from overposting attacks, please enable the specific properties you want to bind to, for
        // more details see https://aka.ms/RazorPagesCRUD.
        [HttpPost]
        public async Task<ActionResult<TodoItem>> PostTodoItem(TodoItem todoItem)
        {
            HttpContext.VerifyUserHasAnyAcceptedScope(scopeRequiredByApi);
            string owner = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            todoItem.Owner = owner;
            todoItem.Status = false;

            _context.TodoItems.Add(todoItem);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetTodoItem", new { id = todoItem.Id }, todoItem);
        }

        // [HttpPost]
        //     [RequiredScopeOrAppPermission(
        //         AcceptedScope = new string[] { "ToDoList.ReadWrite" },
        //         AcceptedAppPermission = new string[] { "ToDoList.ReadWrite.All" })]
        //     public IActionResult Post([FromBody] Todo todo)
        //     {
        //         var owner = _contextAccessor.HttpContext.User.GetObjectId();

        //         if (HasApplicationPermissions(new string[] { "ToDoList.ReadWrite.All" }))
        //         {
        //             //with such a permission any owner name is accepted from UI
        //             owner = todo.Owner;
        //         }

        //         int id = TodoStore.Values.OrderByDescending(x => x.Id).FirstOrDefault().Id + 1;
        //         Todo todonew = new Todo() { Id = id, Owner = owner, Title = todo.Title };
        //         TodoStore.Add(id, todonew);

        //         return Ok(todo);
        //     }

        // DELETE: api/TodoItems/5
        [HttpDelete("{id}")]
        public async Task<ActionResult<TodoItem>> DeleteTodoItem(int id)
        {
            HttpContext.VerifyUserHasAnyAcceptedScope(scopeRequiredByApi);

            var todoItem = await _context.TodoItems.FindAsync(id);
            if (todoItem == null)
            {
                return NotFound();
            }

            _context.TodoItems.Remove(todoItem);
            await _context.SaveChangesAsync();

            return todoItem;
        }

        //     [HttpDelete("{id}")]
        // [RequiredScopeOrAppPermission(
        //     AcceptedScope = new string[] { "ToDoList.ReadWrite" },
        //     AcceptedAppPermission = new string[] { "ToDoList.ReadWrite.All" })]
        // public void Delete(int id)
        // {
        //     if (
        //         (

        //         HasDelegatedPermissions(new string[] { "ToDoList.ReadWrite" }) && TodoStore.Values.Any(x => x.Id == id && x.Owner == _contextAccessor.HttpContext.User.GetObjectId()))

        //         ||

        //         HasApplicationPermissions(new string[] { "ToDoList.ReadWrite.All" })
        //         )
        //     {
        //         TodoStore.Remove(id);
        //     }
        // }

        private bool TodoItemExists(int id)
        {
            return _context.TodoItems.Any(e => e.Id == id);
        }

        //Checks if the presented token has application permissions
        private bool HasApplicationPermissions(string[] permissionsNames)
        {
            var rolesClaim = User.Claims.Where(
              c => c.Type == ClaimConstants.Roles || c.Type == ClaimConstants.Role)
              .SelectMany(c => c.Value.Split(' '));

            var result = rolesClaim.Any(v => permissionsNames.Any(p => p.Equals(v)));

            return result;
        }

        //Checks if the presented token has delegated permissions
        private bool HasDelegatedPermissions(string[] scopesNames)
        {
            var result = (User.FindFirst(ClaimConstants.Scp) ?? User.FindFirst(ClaimConstants.Scope))?
                .Value.Split(' ').Any(v => scopesNames.Any(s => s.Equals(v)));

            return result ?? false;
        }
    }
}
