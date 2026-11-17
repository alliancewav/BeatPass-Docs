import {createHash} from 'node:crypto';

export function reusableThemeSnapshot(value, now = Date.now()) {
  const age = now - Date.parse(value?.verified_at);
  if (value?.source !== 'https://open.beatpass.ca/' || !Number.isFinite(age) || age < 0 || age > 3600000) return false;
  if (!value.themes?.light?.values || !value.themes?.dark?.values || value.themes.light.is_dark !== false || value.themes.dark.is_dark !== true) return false;
  return value.sha256 === createHash('sha256').update(JSON.stringify(value.themes)).digest('hex');
}
