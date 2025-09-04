// config.js
module.exports = {
  // Base URL for the IAMS API
  BASE_URL: 'https://iams.qa.agilopshub.com',

  // Keycloak token endpoint details
  // Note: The realm name "master" is a common default for Keycloak, but you may need to change it
  KEYCLOAK_TOKEN_URL: 'https://iams.qa.agilopshub.com/auth/realms/AOH/protocol/openid-connect/token',
  KEYCLOAK_CLIENT_ID: 'iams',
  KEYCLOAK_CLIENT_SECRET: 'P@ssw0rd',

  // Credentials for the admin user
  ADMIN_USERNAME: 'agiltester',
  ADMIN_PASSWORD: 'geethu',
};