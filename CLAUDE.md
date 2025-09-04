# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Testing
- `npx playwright test` - Run all Playwright tests
- `npx playwright test --project="Users API Tests"` - Run specific project tests
- `npx playwright test tests/usersAPI.spec.js` - Run specific test file
- `npx playwright test --headed` - Run tests in headed mode
- `npx playwright show-report` - Show test report after running tests

### Dependencies
- `npm ci` - Install dependencies (preferred for CI/clean installs)
- `npm install` - Install dependencies

## Architecture Overview

This is a Playwright-based API testing framework for the IAMS (Identity and Access Management System) API. The architecture consists of:

### Core Components
- **Global Setup** (`utils/global-setup.js`): Authenticates with Keycloak and stores access tokens for all tests
- **Configuration** (`config.js`): Contains API endpoints, Keycloak configuration, and test credentials
- **Playwright Config** (`playwright.config.js`): Defines test projects, reporters, and test execution settings

### Test Structure
- **Test Directory**: All test files are located in `tests/` directory
- **Test Projects**: Each API endpoint group has its own project configuration
- **Authentication**: Uses Keycloak OAuth2 flow with stored tokens in `playwright/.auth/auth.json`

### API Test Categories
Tests are organized by IAMS API functionality:
- Users API (`usersAPI.spec.js`)
- Tenants API (`tenantsAPI.spec.js`) 
- System Admin API (`sysAdminAPI.spec.js`)
- Tenant Admin API (`tenantAdminAPI.spec.js`)
- Tenant Memberships API (`tenantMembershipsAPI.spec.js`)
- Tenant Scopes, Roles, Resources, Groups APIs
- Tenant Permissions APIs

### Authentication Flow
1. Global setup authenticates with Keycloak using username/password grant
2. Access token is stored in `playwright/.auth/auth.json`
3. All test files read the token from this file in `beforeAll` hooks
4. API requests include the Bearer token in Authorization headers

### Test Data Management
- Tests use timestamp-based unique identifiers for test data
- Cleanup hooks (`afterAll`) ensure test resources are deleted
- Test data includes tenants, users, roles, permissions, etc.

### Base URL Configuration
- API base URL: `https://iams.qa.agilopshub.com`
- Keycloak URL: `https://iams-keycloak.qa.agilopshub.com`
- All configured in `config.js` and `playwright.config.js`