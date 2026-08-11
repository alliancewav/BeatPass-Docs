import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const windowsVale = process.env.LOCALAPPDATA
  ? path.join(
      process.env.LOCALAPPDATA,
      'Microsoft',
      'WinGet',
      'Packages',
      'errata-ai.Vale_Microsoft.Winget.Source_8wekyb3d8bbwe',
      'vale.exe',
    )
  : null;
const executable = process.env.BEATPASS_VALE_BIN ??
  (windowsVale && fs.existsSync(windowsVale) ? windowsVale : 'vale');
const result = spawnSync(
  executable,
  ['--config=.vale.ini', 'help', 'developers', 'release-notes'],
  {cwd: path.resolve(import.meta.dirname, '..'), stdio: 'inherit'},
);

if (result.error) {
  console.error(`Unable to run Vale 3.17.1: ${result.error.message}`);
  process.exit(2);
}
process.exit(result.status ?? 1);
