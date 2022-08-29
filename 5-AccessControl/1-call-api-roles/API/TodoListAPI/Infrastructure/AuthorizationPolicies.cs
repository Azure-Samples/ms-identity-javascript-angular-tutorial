using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TodoListAPI.Infrastructure
{
    /// <summary>
    /// Wrapper class the contain all the authorization policies available in this application.
    /// </summary>
    public static class AuthorizationPolicies
    {
        public const string AssignmentToTaskUserRoleRequired = "AssignmentToTaskUserRoleRequired";
        public const string AssignmentToTaskAdminRoleRequired = "AssignmentToTaskAdminRoleRequired";
    }
}
