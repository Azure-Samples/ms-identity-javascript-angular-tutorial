using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Identity.Web;
using Microsoft.IdentityModel.Logging;
using TodoListAPI.Infrastructure;
using TodoListAPI.Models;
using TodoListAPI.Services;

namespace TodoListAPI
{
    public class Startup
    {
        public List<string> allowedClientApps;
        public List<string> requiredGroupsIds;
        public CacheSettings cacheSettings;
        public IConfiguration Configuration { get; }

        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;

            allowedClientApps = new List<string>() { Configuration["AzureAd:ClientId"] };

            requiredGroupsIds = Configuration.GetSection("AzureAd:Groups")
                .AsEnumerable().Select(x => x.Value).Where(x => x != null).ToList();

            cacheSettings = new CacheSettings
            {
                SlidingExpirationInSeconds = Configuration.GetValue<string>("CacheSettings:SlidingExpirationInSeconds"),
                AbsoluteExpirationInSeconds = Configuration.GetValue<string>("CacheSettings:AbsoluteExpirationInSeconds")
            };
        }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            // This is required to be instantiated before the OpenIdConnectOptions starts getting configured.
            // By default, the claims mapping will map claim names in the old format to accommodate older SAML applications.
            // 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role' instead of 'roles'
            // This flag ensures that the ClaimsIdentity claims collection will be built from the claims in the token
            JwtSecurityTokenHandler.DefaultMapInboundClaims = false;

            // Adds Microsoft Identity platform (AAD v2.0) support to protect this Api
            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddMicrosoftIdentityWebApi(options =>
                    {
                        // Ensure default token validation is carried out
                        Configuration.Bind("AzureAd");

                        options.Events = new JwtBearerEvents();

                        // The following lines code instruct the asp.net core middleware to use the data in the "roles" claim in the [Authorize] attribute, policy.RequireRole() and User.IsInrole()
                        // See https://docs.microsoft.com/aspnet/core/security/authorization/roles for more info.
                        options.TokenValidationParameters.RoleClaimType = "groups";

                        /// <summary>
                        /// Below you can do extended token validation and check for additional claims, such as:
                        ///
                        /// - check if the caller's tenant is in the allowed tenants list via the 'tid' claim (for multi-tenant applications)
                        /// - check if the caller's account is homed or guest via the 'acct' optional claim
                        /// - check if the caller belongs to right roles or groups via the 'roles' or 'groups' claim, respectively
                        ///
                        /// Bear in mind that you can do any of the above checks within the individual routes and/or controllers as well.
                        /// For more information, visit: https://docs.microsoft.com/azure/active-directory/develop/access-tokens#validate-the-user-has-permission-to-access-this-data
                        /// </summary>

                        options.Events.OnTokenValidated = async context =>
                        {
                            string clientAppId = context?.Principal?.Claims
                                .FirstOrDefault(x => x.Type == "azp" || x.Type == "appid")?.Value;

                            // In this scenario, client and service (API) share the same clientId and we disallow all calls to this API, except from the SPA
                            if (!allowedClientApps.Contains(clientAppId))
                            {
                                throw new Exception("This client is not authorized to call this API");
                            }

                            if (context != null)
                            {
                                // Calls method to process groups overage claim (before policy checks kick-in)
                                await GraphHelper.ProcessAnyGroupsOverage(context, requiredGroupsIds, cacheSettings);
                            }

                            await Task.CompletedTask;
                        };
                    }, options =>
                        {
                            Configuration.Bind("AzureAd", options);
                        }, "Bearer", true)
                .EnableTokenAcquisitionToCallDownstreamApi(options => Configuration.Bind("AzureAd", options))
                .AddMicrosoftGraph(Configuration.GetSection("MSGraph"))
                .AddInMemoryTokenCaches();

            // Adding authorization policies that enforce authorization using Azure AD security groups.
            services.AddAuthorization(options =>
            {
                options.AddPolicy(AuthorizationPolicies.AssignmentToGroupMemberGroupRequired, policy => policy.RequireRole(Configuration["AzureAd:Groups:GroupMember"], Configuration["AzureAd:Groups:GroupAdmin"]));
                options.AddPolicy(AuthorizationPolicies.AssignmentToGroupAdminGroupRequired, policy => policy.RequireRole(Configuration["AzureAd:Groups:GroupAdmin"]));
            });

            // The in-memory toDo list Db
            services.AddDbContext<TodoContext>(opt => opt.UseInMemoryDatabase("TodoList"));

            services.AddControllers();
            services.AddHttpContextAccessor();

            // The following flag can be used to get more descriptive errors in development environments
            // Enable diagnostic logging to help with troubleshooting. For more details, see https://aka.ms/IdentityModel/PII.
            // You might not want to keep this following flag on for production
            IdentityModelEventSource.ShowPII = true;

            // Allowing CORS for all domains and HTTP methods for the purpose of the sample
            // In production, modify this with the actual domains and HTTP methods you want to allow
            services.AddCors(o => o.AddPolicy("default", builder =>
            {
                builder.AllowAnyOrigin()
                       .AllowAnyMethod()
                       .AllowAnyHeader()
                       .WithExposedHeaders("WWW-Authenticate");
            }));
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                // Since IdentityModel version 5.2.1 (or since Microsoft.AspNetCore.Authentication.JwtBearer version 2.2.0),
                // Personal Identifiable Information is not written to the logs by default, to be compliant with GDPR.
                // For debugging/development purposes, one can enable additional detail in exceptions by setting IdentityModelEventSource.ShowPII to true.

                Microsoft.IdentityModel.Logging.IdentityModelEventSource.ShowPII = false;

                app.UseDeveloperExceptionPage();
            }
            else
            {
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseCors("default");
            app.UseHttpsRedirection();
            app.UseRouting();
            app.UseAuthentication();
            app.UseAuthorization();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}