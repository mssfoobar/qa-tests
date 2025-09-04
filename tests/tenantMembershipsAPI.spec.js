// tests/tenantMembershipsAPI.spec.js
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

let accessToken;
let createdTenantId;
let createdUserId;

test.describe('Tenant Memberships API', () => {
  // Use a serial block to ensure tests run in a specific order
  test.describe.serial('Membership Operations', () => {

    test.beforeAll(async ({ request }) => {
      // 1. Load the access token
      try {
        const authFile = JSON.parse(fs.readFileSync(path.join(__dirname, '../playwright/.auth/auth.json'), 'utf8'));
        accessToken = authFile.accessToken;
        if (!accessToken) {
          throw new Error('Access token not found in auth.json');
        }
        console.log('Successfully loaded access token for tenant memberships tests.');
      } catch (error) {
        console.error('Failed to load access token:', error);
        throw error;
      }

      // 2. Create a new tenant for testing
      const tenantName = `MemberTenant_${Date.now()}`;
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

      // 3. Create a new user for testing
      const userPayload = {
        username: `tenantmemberuser_${Date.now()}`,
        email: `tenantmemberuser_${Date.now()}@example.com`,
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
      createdUserId = await userResponse.text();
      console.log(`Created user with ID: ${createdUserId}`);
    });

    test.afterAll(async ({ request }) => {
      // 1. Clean up the created user
      if (createdUserId) {
        const userCleanupResponse = await request.delete(`https://iams.qa.agilopshub.com/admin/users/${createdUserId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        // The API can return 200 OK or 204 No Content for a successful delete.
        expect([200, 204]).toContain(userCleanupResponse.status());
        console.log(`Cleaned up user with ID: ${createdUserId}`);
      }

      // 2. Clean up the created tenant
      if (createdTenantId) {
        const tenantCleanupResponse = await request.delete(`https://iams.qa.agilopshub.com/admin/tenants/${createdTenantId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        // The API can return 200 OK or 204 No Content for a successful delete.
        expect([200, 204]).toContain(tenantCleanupResponse.status());
        console.log(`Cleaned up tenant with ID: ${createdTenantId}`);
      }
    });

    // Combined test to add user and verify
    test('1. POST /admin/tenants/{tenantId}/memberships/{userId} - Add a user to a tenant', async ({ request }) => {
      const response = await request.post(`https://iams.qa.agilopshub.com/admin/tenants/${createdTenantId}/memberships/${createdUserId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      // A successful add returns 201 or 409 if already a member
      expect([201, 409]).toContain(response.status());
      console.log(`Added user ${createdUserId} to tenant ${createdTenantId}.`);
    });

    test('2. GET /admin/tenants/{tenantId}/memberships - Verify user is a member', async ({ request }) => {
      await expect.poll(async () => {
        const response = await request.get(`https://iams.qa.agilopshub.com/admin/tenants/${createdTenantId}/memberships`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (response.status() !== 200) {
          return false;
        }
        const members = await response.json();
        return members.some(member => member.id === createdUserId);
      }, {
        timeout: 90000,
        message: `User ${createdUserId} did not become a member within the timeout.`,
      }).toBe(true);
      console.log(`Verified user ${createdUserId} is a member of tenant ${createdTenantId}.`);
    });

    test('3. DELETE /admin/tenants/{tenantId}/memberships/{userId} - Remove a user from a tenant', async ({ request }) => {
      const response = await request.delete(`https://iams.qa.agilopshub.com/admin/tenants/${createdTenantId}/memberships/${createdUserId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      expect(response.status()).toBe(204);
      console.log(`Removed user ${createdUserId} from tenant ${createdTenantId}.`);
    });

    test('4. GET /admin/tenants/{tenantId}/memberships - Verify user is no longer a member', async ({ request }) => {
      const response = await request.get(`https://iams.qa.agilopshub.com/admin/tenants/${createdTenantId}/memberships`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      expect(response.status()).toBe(200);
      const members = await response.json();
      const isMember = members.some(member => member.id === createdUserId);
      expect(isMember).toBe(false);
      console.log(`Verified user ${createdUserId} is no longer a member.`);
    });
    
    test('5. GET /admin/tenants/{tenantId}/memberships/count - Verify the membership count', async ({ request }) => {
        const response = await request.get(`https://iams.qa.agilopshub.com/admin/tenants/${createdTenantId}/memberships/count`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        expect(response.status()).toBe(200);
        const count = parseInt(await response.text(), 10);
        expect(count).toBe(0);
        console.log(`Verified membership count for tenant ${createdTenantId} is ${count}.`);
    });
  });
});
