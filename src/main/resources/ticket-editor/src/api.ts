import axios from 'axios';
import { Document } from './model/document.class';
import { Settings } from './model/settings';

const api = axios.create({
  baseURL: window.MF_VE_OBJ.apiRoot + '/ticket-editor/v1/',
  timeout: 30000,
  headers: {
    'X-WP-Nonce': window.MF_VE_OBJ.nonce,
  },
});

export async function getTicketStatuses() {
  return window.MF_VE_OBJ.statuses || {};
}

export async function setTicketStatus(id: number, active: boolean) {
  if (window.MF_VE_OBJ.statuses) {
    window.MF_VE_OBJ.statuses[id] = active;
  }
  return true;
}

export async function getTicketSettings(settingsId: number) {
  return new Settings(window.MF_VE_OBJ.settings || {});
}

export async function setTicketSettings(
  settingsId: number,
  settings: Settings
) {
  window.MF_VE_OBJ.settings = settings;
  return settings;
}

export async function saveTicketTemplateDocument(
  settingsId: number,
  doc: Document
) {
  console.log('Saving document template', doc);
}

export async function getImageUrl(
  attachmentId: number,
  width: number,
  height: number
) {
  return { imageUrl: '' };
}