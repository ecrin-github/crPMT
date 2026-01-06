import { appVersion } from './version';

const baseUrl = 'https://api-crpmtdev.ecrin.org';  // No trailing slash
export const environment = {
  production: false,
  // Microsoft Entra
  authority: 'https://login.microsoftonline.com/7d591275-8f7c-4476-bb14-1f96f2587607/v2.0',
  clientId: 'a32c6906-19dc-415b-aab8-70e1f9acd521',
  apiClientId: '5c09604f-5aa4-433e-a9e0-e15173c5bcc4',
  appVersion: appVersion,
  appTitle: 'crPMT: clinOps Project Management Tool',
  baseUrl: baseUrl,
  baseUrlApi: baseUrl + '/api',  // No trailing slash
  wsBaseUrl: 'wss://api-crpmtdev.ecrin.org/',
  apiUrl: 'api',
  apiVersion: 'v1'
};