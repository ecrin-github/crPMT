import { appVersion } from './version';

// Note: constants relating to LS AAI must be the same as the constants in the BE
// const baseUrl = 'https://api-crpmtdev.ecrin.org';  // No trailing slash
const baseUrl = 'https://api-dsrdev.ecrin.org';  // No trailing slash
export const environment = {
  production: false,
  // LS AAI V2
  authority: 'https://login.aai.lifescience-ri.eu/oidc',  // No trailing slash
  // TODO: to change once project started
  clientId: '7cf4d894-7b95-4daf-b80f-96a350b2980d',  // Dev
  userInfoUrl: 'https://login.aai.lifescience-ri.eu/oidc/userinfo',
  appVersion: appVersion,
  appTitle: 'crPMT: clinOps Project Management Tool',
  baseUrl: baseUrl,
  baseUrlApi: baseUrl + '/api',  // No trailing slash
  wsBaseUrl: 'wss://api-dsrdev.ecrin.org/',
  apiUrl: 'api',
  tsdUploadPath: 'test',
  apiVersion: 'v1'
};