import { appVersion } from './version';

const baseUrl = 'https://api-crpmt.ecrin.org';  // No trailing slash
export const environment = {
  production: true,
  // Microsoft Entra
  authority: 'https://login.microsoftonline.com/7d591275-8f7c-4476-bb14-1f96f2587607/v2.0',
  clientId: 'ecb6ece9-220c-420d-97bd-46093b270627',
  apiClientId: '3fe07317-fa56-4811-81fa-ca458a9d376e',
  sharepointHostname: "ecrineu.sharepoint.com",
  appVersion: appVersion,
  appTitle: 'ECRIN Project Management Tool',
  baseUrl: baseUrl,
  baseUrlApi: baseUrl + '/api',  // No trailing slash
  wsBaseUrl: 'wss://api-crpmtdev.ecrin.org/',
  apiUrl: 'api',
  apiVersion: 'v1'
};
