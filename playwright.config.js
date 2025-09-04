// playwright.config.js
import { defineConfig } from '@playwright/test';
import { on } from 'events';
import path from 'path';

// Define the root directory to ensure paths are always resolved correctly.
const projectDir = path.resolve(__dirname);

export default defineConfig({
  // Only look for test files in the 'tests' directory.
  // This is the key change to ensure utils/ is ignored.
  testDir: './tests',

  // This tells Playwright to run auth.setup.js once before all tests.
  // Using path.join here makes the path robust against Windows/Linux differences.
  globalSetup: path.join(projectDir, 'utils/global-setup.js'),

  use: {
    // This tells all tests to use the base URL for API requests.
    baseURL: 'https://iams.qa.agilopshub.com',

    // Use trace for debugging on the first retry.
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on'
  },
reporter: 'html',

  // This project definition confirms that you only want to run files ending with .spec.js inside the tests folder.
   projects: [
    {
      name: 'Users API Tests',
      testMatch: 'usersAPI.spec.js',
    },
    {
      name: 'Tenants API Tests',
      testMatch: 'tenantsAPI.spec.js',
    },
    {
      name: 'System Admin API Tests',
      testMatch: 'sysAdminAPI.spec.js',
    },
    {
      name: 'Tenant Admin API Tests',
      testMatch: 'tenantAdminAPI.spec.js',
    },
    {
      name: 'Tenant Memberships API Tests',
      testMatch: 'tenantMembershipsAPI.spec.js',
    },
    {
      name: 'Tenant Scopes API Tests',
      testMatch: 'tenantsScopesAPI.spec.js',
    },
    {
      name: 'Tenant Roles API Tests',
      testMatch: 'tenantRolesAPI.spec.js',
    },
    {
      name: 'Tenant Resources API Tests',
      testMatch: 'tenantsResourcesAPI.spec.js',
    },
    {
      name: 'Tenant Groups API Tests',
      testMatch: 'tenantsGroupsAPI.spec.js',
    },
    {
      name: 'Tenant Resource Permissions API Tests',
      testMatch: 'tenantsResourcePermissionsAPI.spec.js',

    },
   {
      name: 'Tenant User Permissions API Tests',
      testMatch: 'tenantUserPermissionsAPI.spec.js',

    }, 
{
      name: 'Tenant User Permissions API Tests',
      testMatch: 'groups.spec.js',

    }, 
    
    {
     name: 'tenantrolecopy',
     testMatch: 'tenRole.spec.js',
    },
    {
      name: 'tenant creation for group test',
     testMatch: 'tenants.spec.js',
    }
  ],
});
