import { appVersion } from './version';

// Note: constants relating to LS AAI must be the same as the constants in the BE
// const baseUrl = 'https://api-crpmtdev.ecrin.org';  // No trailing slash
const baseUrl = 'https://api-crpmtdev.ecrin.org';  // No trailing slash
export const environment = {
  production: false,
  // LS AAI V2
  authority: 'https://login.aai.lifescience-ri.eu/oidc',  // No trailing slash
  clientId: '36e46fde-ae2e-46a5-a449-0c10da2cc9a6',  // Dev
  userInfoUrl: 'https://login.aai.lifescience-ri.eu/oidc/userinfo',
  appVersion: appVersion,
  appTitle: 'crPMT: clinOps Project Management Tool',
  baseUrl: baseUrl,
  baseUrlApi: baseUrl + '/api',  // No trailing slash
  wsBaseUrl: 'wss://api-crpmtdev.ecrin.org/',
  apiUrl: 'api',
  tsdUploadPath: 'test',
  apiVersion: 'v1'
};