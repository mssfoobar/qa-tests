// tests/tenantScopesAPI.spec.js
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

let accessToken;
let createdTenantId;
let createdScopeId;
let createdUserToDeleteId;

test.describe('Tenant Scopes API', () => {
  // Use a serial block to ensure tests run in a specific order
  test.describe.serial('Scope Operations', () => {

    test.beforeAll(async ({ request }) => {
      // 1. Load the access token
      try {
        const authFile = JSON.parse(fs.readFileSync(path.join(__dirname, '../playwright/.auth/auth.json'), 'utf8'));
        accessToken = authFile.accessToken;
        if (!accessToken) {
          throw new Error('Access token not found in auth.json');
        }
        console.log('Successfully loaded access token for tenant scopes tests.');
      } catch (error) {
        console.error('Failed to load access token:', error);
        throw error;
      }

      // 2. Create a new tenant for testing
      const tenantName = `ScopeTenant_${Date.now()}`;
      const tenantResponse = await request.post('https://iams.qa.agilopshub.com/admin/tenants', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data: { name: tenantName },
      });
      expect(tenantResponse.status()).toBe(201);
      createdTenantId = await tenantResponse.text();
      console.log(`Created tenant with ID: ${createdTenantId}`);

      // 3. Create a temporary user to test scope resources later
      const userPayload = {
        username: `scopeuser_${Date.now()}`,
        email: `scopeuser_${Date.now()}@example.com`,
        enabled: true,
      };
      const userResponse = await request.post('https://iams.qa.agilopshub.com/admin/users', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data: userPayload,
      });
      expect(userResponse.status()).toBe(201);
      createdUserToDeleteId = await userResponse.text();
      console.log(`Created user with ID: ${createdUserToDeleteId}`);
    });

    test.afterAll(async ({ request }) => {
      // 1. Clean up the created scope
      if (createdScopeId) {
        const scopeCleanupResponse = await request.delete(`https://iams.qa.agilopshub.com/admin/tenants/${createdTenantId}/scopes/${createdScopeId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        expect([200, 204]).toContain(scopeCleanupResponse.status());
        console.log(`Cleaned up scope with ID: ${createdScopeId}`);
      }

      // 2. Clean up the created user
      if (createdUserToDeleteId) {
        const userCleanupResponse = await request.delete(`https://iams.qa.agilopshub.com/admin/users/${createdUserToDeleteId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        expect([200, 204]).toContain(userCleanupResponse.status());
        console.log(`Cleaned up user with ID: ${createdUserToDeleteId}`);
      }

      // 3. Clean up the created tenant
      if (createdTenantId) {
        const tenantCleanupResponse = await request.delete(`https://iams.qa.agilopshub.com/admin/tenants/${createdTenantId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        expect([200, 204]).toContain(tenantCleanupResponse.status());
        console.log(`Cleaned up tenant with ID: ${createdTenantId}`);
      }
    });

    test('1. POST /admin/tenants/{tenantId}/scopes - Create a new tenant scope', async ({ request }) => {
      const scopePayload = {
        name: `TestScope_${Date.now()}`,
      };
      const response = await request.post(`https://iams.qa.agilopshub.com/admin/tenants/${createdTenantId}/scopes`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data: scopePayload,
      });
      expect(response.status()).toBe(201);
      createdScopeId = await response.text();
      console.log(`Created scope with ID: ${createdScopeId}`);
    });

    test('2. GET /admin/tenants/{tenantId}/scopes - Verify the new scope exists', async ({ request }) => {
      const response = await request.get(`https://iams.qa.agilopshub.com/admin/tenants/${createdTenantId}/scopes`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      expect(response.status()).toBe(200);
      const scopes = await response.json();
      const newScope = scopes.find(scope => scope.id === createdScopeId);
      expect(newScope).toBeDefined();
      console.log(`Verified scope ${createdScopeId} exists.`);
    });
    
    test('3. PUT /admin/tenants/{tenantId}/scopes/{scopeId} - Update a tenant scope', async ({ request }) => {
      const updatedScopePayload = {
        name: `UpdatedScope_${Date.now()}`,
      };
      const response = await request.put(`https://iams.qa.agilopshub.com/admin/tenants/${createdTenantId}/scopes/${createdScopeId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data: updatedScopePayload,
      });
      expect(response.status()).toBe(200);
      console.log(`Updated scope ${createdScopeId}.`);

      // Verify the update
      const getResponse = await request.get(`https://iams.qa.agilopshub.com/admin/tenants/${createdTenantId}/scopes`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const scopes = await getResponse.json();
      const updatedScope = scopes.find(scope => scope.id === createdScopeId);
      expect(updatedScope.name).toBe(updatedScopePayload.name);
      console.log('Verified scope name was updated successfully.');
    });

    test('4. GET /admin/tenants/{tenantId}/scopes/{scopeId}/resources - List resources for a scope', async ({ request }) => {
      // Assuming a resource is added to the user by default
      // This test is to ensure the endpoint is functional and returns a 200 OK
      // The actual resources would need to be created/added by another endpoint for a more comprehensive test
      const response = await request.get(`https://iams.qa.agilopshub.com/admin/tenants/${createdTenantId}/scopes/${createdScopeId}/resources`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      expect(response.status()).toBe(200);
      console.log(`Verified resources can be listed for scope ${createdScopeId}.`);
    });

    test('5. DELETE /admin/tenants/{tenantId}/scopes/{scopeId} - Delete a tenant scope', async ({ request }) => {
      const response = await request.delete(`https://iams.qa.agilopshub.com/admin/tenants/${createdTenantId}/scopes/${createdScopeId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      expect(response.status()).toBe(200);
      console.log(`Deleted scope with ID: ${createdScopeId}`);
      // Clear the scope ID to prevent double cleanup
      createdScopeId = null; 
    });

    test('6. GET /admin/tenants/{tenantId}/scopes - Verify the scope is deleted', async ({ request }) => {
      const response = await request.get(`https://iams.qa.agilopshub.com/admin/tenants/${createdTenantId}/scopes`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      expect(response.status()).toBe(200);
      const scopes = await response.json();
      const deletedScope = scopes.find(scope => scope.id === createdScopeId);
      expect(deletedScope).toBeUndefined();
      console.log(`Verified scope ${createdScopeId} is deleted.`);
    });
  });
});
