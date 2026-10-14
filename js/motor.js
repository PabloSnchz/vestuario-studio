// ============================================================
// motor.js - Selector de motor: local (Python) o GitHub API
// ============================================================

import * as github from './github.js';
import * as local from './local.js';

const host = (typeof location !== 'undefined') ? location.hostname : '';
export const ES_MODO_LOCAL = (host === 'localhost' || host === '127.0.0.1');

const impl = ES_MODO_LOCAL ? local : github;

export const getToken       = (...a) => impl.getToken(...a);
export const setToken       = (...a) => impl.setToken(...a);
export const clearToken     = (...a) => impl.clearToken(...a);
export const hasToken       = (...a) => impl.hasToken(...a);
export const readJSON       = (...a) => impl.readJSON(...a);
export const writeJSON      = (...a) => impl.writeJSON(...a);
export const uploadFile     = (...a) => impl.uploadFile(...a);
export const fileToBase64   = (...a) => impl.fileToBase64(...a);