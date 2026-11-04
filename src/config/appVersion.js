import release from '../../release.json';
// Some hosting build paths omit Vite's compile-time replacement. Never crash
// the application while rendering its version label.
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined'
  ? __APP_VERSION__
  : release.minimumVersion;
