// @ts-check
const { test, expect } = require('@playwright/test');
const { v4: uuidv4 } = require('uuid');

test.describe('Tenant Roles API Tests', () => {
    // Define shared variables for all tests in this suite
    let tenantId = 'test-tenant';
    // NOTE: Replace this with a valid, existing user ID in your system.
    // The test suite will assign roles to this user.
    let userId = 'your-existing-user-id';
    let token = 'your-bearer-token'; // NOTE: Replace with a valid bearer token
    const baseUrl = 'https://your-api-base-url.com/admin/tenants'; // NOTE: Update this URL
    
    // Test data for roles
    let testRoleName = `test-role-${uuidv4()}`;
    let testRoleId;
    let updatedRoleName = `updated-role-${uuidv4()}`;

    // Test hooks to set up and tear down test data
    test.beforeAll(async ({ request }) => {
        // --- PREREQUISITE: Create a role for testing purposes ---
        console.log(`Creating a test role: ${testRoleName}`);
        const roleCreateResponse = await request.post(`${baseUrl}/${tenantId}/roles`, {
            headers: { 'Authorization': `Bearer ${token}` },
            data: {
                name: testRoleName,
                description: "Test role created by Playwright",
                clientRole: false,
                containerId: tenantId,
            },
        });
        expect(roleCreateResponse.status()).toBe(201);
        testRoleId = await roleCreateResponse.json();
    });

    test.afterAll(async ({ request }) => {
        // --- CLEANUP: Delete the test role to leave no residue ---
        console.log(`Cleaning up test role.`);
        const roleDeleteResponse = await request.delete(`${baseUrl}/${tenantId}/roles-by-id/${testRoleId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        expect(roleDeleteResponse.status()).toBe(200);
    });

    // --- TEST SUITE FOR TENANT ROLES API ENDPOINTS ---

    // 1. POST /admin/tenants/{tenantId}/roles - Create a Role
    test('POST /admin/tenants/{tenantId}/roles - Create a new role', async ({ request }) => {
        const response = await request.post(`${baseUrl}/${tenantId}/roles`, {
            headers: { 'Authorization': `Bearer ${token}` },
            data: {
                name: `another-role-${uuidv4()}`,
                description: "Another test role",
                clientRole: false,
                containerId: tenantId,
            },
        });
        expect(response.status()).toBe(201);
        const newRoleId = await response.json();
        // Clean up the role created in this test
        await request.delete(`${baseUrl}/${tenantId}/roles-by-id/${newRoleId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    });

    // 2. GET /admin/tenants/{tenantId}/roles/{role-name} - Get role by rolename
    test('GET /admin/tenants/{tenantId}/roles/{role-name} - Get role by name', async ({ request }) => {
        const response = await request.get(`${baseUrl}/${tenantId}/roles/${testRoleName}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        expect(response.status()).toBe(200);
        const role = await response.json();
        expect(role).toHaveProperty('id', testRoleId);
        expect(role).toHaveProperty('name', testRoleName);
    });

    // 3. PUT /admin/tenants/{tenantId}/roles/{role-name} - Update a tenant role
    test('PUT /admin/tenants/{tenantId}/roles/{role-name} - Update a role', async ({ request }) => {
        const response = await request.put(`${baseUrl}/${tenantId}/roles/${testRoleName}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            data: {
                name: updatedRoleName,
                description: 'Updated description',
                clientRole: false,
                containerId: tenantId,
            },
        });
        expect(response.status()).toBe(200);

        // Verify the update by fetching the role by its new name
        const updatedRoleResponse = await request.get(`${baseUrl}/${tenantId}/roles/${updatedRoleName}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        expect(updatedRoleResponse.status()).toBe(200);
        const updatedRole = await updatedRoleResponse.json();
        expect(updatedRole.name).toEqual(updatedRoleName);
        expect(updatedRole.description).toEqual('Updated description');

        // Update the global test role name for subsequent tests
        testRoleName = updatedRoleName;
    });

    // 4. GET /admin/tenants/{tenantId}/roles - List all roles
    test('GET /admin/tenants/{tenantId}/roles - List all roles', async ({ request }) => {
        const response = await request.get(`${baseUrl}/${tenantId}/roles`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        expect(response.status()).toBe(200);
        const roles = await response.json();
        expect(Array.isArray(roles)).toBeTruthy();
        // Check if our test role exists in the list
        const ourRole = roles.find(role => role.id === testRoleId);
        expect(ourRole).toBeDefined();
        expect(ourRole.name).toEqual(testRoleName);
    });
    
    // 5. GET /admin/tenants/{tenantId}/roles-by-id/{roleId} - Get role by ID
    test('GET /admin/tenants/{tenantId}/roles-by-id/{roleId} - Get role by ID', async ({ request }) => {
        const response = await request.get(`${baseUrl}/${tenantId}/roles-by-id/${testRoleId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        expect(response.status()).toBe(200);
        const role = await response.json();
        expect(role).toHaveProperty('id', testRoleId);
        expect(role).toHaveProperty('name', testRoleName);
    });

    // 6. POST /admin/tenants/{tenantId}/users/{userId}/roles - Assign a role to a user
    test('POST /admin/tenants/{tenantId}/users/{userId}/roles - Assign a role to a user', async ({ request }) => {
        const response = await request.post(`${baseUrl}/${tenantId}/users/${userId}/roles`, {
            headers: { 'Authorization': `Bearer ${token}` },
            data: [
                {
                    id: testRoleId,
                    name: testRoleName,
                }
            ],
        });
        expect(response.status()).toBe(201);
    });

    // 7. GET /admin/tenants/{tenantId}/users/{userId}/roles - List assigned roles to user
    test('GET /admin/tenants/{tenantId}/users/{userId}/roles - List roles assigned to a user', async ({ request }) => {
        const response = await request.get(`${baseUrl}/${tenantId}/users/${userId}/roles`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        expect(response.status()).toBe(200);
        const roles = await response.json();
        expect(Array.isArray(roles)).toBeTruthy();
        expect(roles.some(role => role.id === testRoleId)).toBeTruthy();
    });

    // 8. POST /admin/tenants/{tenantId}/roles/{role-name}/users - Assign users by role name
    test('POST /admin/tenants/{tenantId}/roles/{role-name}/users - Assign a user to a role', async ({ request }) => {
        const assignResponse = await request.post(`${baseUrl}/${tenantId}/roles/${testRoleName}/users`, {
            headers: { 'Authorization': `Bearer ${token}` },
            data: [{
                id: userId,
            }],
        });
        expect(assignResponse.status()).toBe(201);
    });

    // 9. GET /admin/tenants/{tenantId}/roles/{role-name}/users - List of users with the specified role name
    test('GET /admin/tenants/{tenantId}/roles/{role-name}/users - List users with a role', async ({ request }) => {
        const response = await request.get(`${baseUrl}/${tenantId}/roles/${testRoleName}/users`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        expect(response.status()).toBe(200);
        const users = await response.json();
        expect(Array.isArray(users)).toBeTruthy();
        expect(users.some(user => user.id === userId)).toBeTruthy();
    });

    // 10. DELETE /admin/tenants/{tenantId}/users/{userId}/roles - Unassign roles from user
    test('DELETE /admin/tenants/{tenantId}/users/{userId}/roles - Unassign roles from a user', async ({ request }) => {
        const response = await request.delete(`${baseUrl}/${tenantId}/users/${userId}/roles`, {
            headers: { 'Authorization': `Bearer ${token}` },
            data: [
                {
                    id: testRoleId,
                    name: testRoleName,
                }
            ],
        });
        expect(response.status()).toBe(200);
    });

    // 11. DELETE /admin/tenants/{tenantId}/roles/{role-name}/users/{userId} - Unassign a user from a role
    test('DELETE /admin/tenants/{tenantId}/roles/{role-name}/users/{userId} - Unassign a user by role name and user id', async ({ request }) => {
        // This test requires a role to be assigned first.
        // We will assign it again here and then unassign
        await request.post(`${baseUrl}/${tenantId}/users/${userId}/roles`, {
            headers: { 'Authorization': `Bearer ${token}` },
            data: [
                {
                    id: testRoleId,
                    name: testRoleName,
                }
            ],
        });

        const response = await request.delete(`${baseUrl}/${tenantId}/roles/${testRoleName}/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        expect(response.status()).toBe(200);
    });

    // 12. DELETE /admin/tenants/{tenantId}/roles/{role-name} - Delete role
    test('DELETE /admin/tenants/{tenantId}/roles/{role-name} - Delete a role by name', async ({ request }) => {
        // This test reuses the updated role name from the PUT test.
        const response = await request.delete(`${baseUrl}/${tenantId}/roles/${testRoleName}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        expect(response.status()).toBe(200);

        // Verify the role is deleted by trying to fetch it
        const getDeletedRoleResponse = await request.get(`${baseUrl}/${tenantId}/roles/${testRoleName}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        // The API should return a 404 Not Found or similar status code if the role is deleted
        expect(getDeletedRoleResponse.status()).toBe(404);
    });

});
