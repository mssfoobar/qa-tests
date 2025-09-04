// utils/global-setup.js
import { request } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// This function will run once before all tests
async function globalSetup(config) {
  const authFile = path.join(__dirname, '../playwright/.auth/auth.json');
  
  // Create a new API request context using the 'request' object directly
  const requestContext = await request.newContext();

  const response = await requestContext.post('https://iams-keycloak.qa.agilopshub.com/realms/AOH/protocol/openid-connect/token', {
    form: {
      username: 'agiltester',
      password: 'geethu',
      client_id: 'web',
      grant_type: 'password',
      scope: 'openid'
    }
  });

  const responseBody = await response.json();

  if (response.status() !== 200) {
    throw new Error(`Failed to get access token. Status: ${response.status()}, Body: ${JSON.stringify(responseBody, null, 2)}`);
  }

  const { access_token, refresh_token } = responseBody;

  // Save the tokens to the auth file
  await fs.promises.mkdir(path.dirname(authFile), { recursive: true });
  await fs.promises.writeFile(authFile, JSON.stringify({ accessToken: access_token, refreshToken: refresh_token }));

  console.log('Access token generated and saved.');

  // Dispose the request context
  await requestContext.dispose();
}

// Export the single function using ES module syntax
export default globalSetup;
