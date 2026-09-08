import fs from 'fs';
import path from 'path';

const binDir = path.join(process.cwd(), 'node_modules', '.bin');

if (process.platform === 'win32' || !fs.existsSync(binDir)) {
  process.exit(0);
}

for (const entry of fs.readdirSync(binDir)) {
  const filePath = path.join(binDir, entry);
  const stat = fs.statSync(filePath);

  if (stat.isFile()) {
    try {
      fs.chmodSync(filePath, 0o755);
    } catch {
      // Ignore permission failures on filesystems that do not support chmod.
    }
  }
}
