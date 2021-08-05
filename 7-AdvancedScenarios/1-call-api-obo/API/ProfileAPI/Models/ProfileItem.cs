// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ComponentModel.DataAnnotations;

namespace ProfileAPI.Models
{
    public class ProfileItem
    {   
        [Key]
        public string Id { get; set; }
        public string UserPrincipalName { get; set; }
        public string GivenName { get; set; }
        public string Surname { get; set; }
        public string JobTitle { get; set; }
        public string MobilePhone { get; set; }
        public string PreferredLanguage { get; set; }
        public bool FirstLogin { get; set; }
    }
}
