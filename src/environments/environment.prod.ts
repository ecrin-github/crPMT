import { appVersion } from './version';

// Note: constants relating to LS AAI must be the same as the constants in the BE
const baseUrl = 'https://api-crpmt.ecrin.org';  // No trailing slash
export const environment = {
  production: true,
  // LS AAI V2
  authority: 'https://login.aai.lifescience-ri.eu/oidc',  // No trailing slash
  clientId: '78dbf43b-bcb7-4a6a-8023-ca930d5ed0e2',  // Prod
  userInfoUrl: 'https://login.aai.lifescience-ri.eu/oidc/userinfo',
  // LS AAI V1
  // authority: 'https://proxy.aai.lifescience-ri.eu/',
  // clientId: 'APP-FDD7EABC-450A-426B-BDFA-3CBD87B7C56A',
  // userInfoUrl: 'https://proxy.aai.lifescience-ri.eu/OIDC/userinfo',
  appVersion: appVersion,
  appTitle: 'crDSR: Data Sharing Repository',
  baseUrl: baseUrl,
  baseUrlApi: baseUrl + '/api',  // No trailing slash
  wsBaseUrl: 'wss://api-dsr.ecrin.org/',
  apiUrl: 'api',
  tsdUploadPath: 'prod',
  apiVersion: 'v1'
};
