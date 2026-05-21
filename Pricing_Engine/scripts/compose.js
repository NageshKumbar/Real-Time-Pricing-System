const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function findDockerBinDir() {
  if (process.platform === 'win32') {
    const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
    const dir = path.join(programFiles, 'Docker', 'Docker', 'resources', 'bin');
    if (fs.existsSync(path.join(dir, 'docker.exe'))) return dir;
  }
  return null;
}

function findDocker() {
  const binDir = findDockerBinDir();
  if (binDir) return path.join(binDir, 'docker.exe');
  return 'docker';
}

const dockerBinDir = findDockerBinDir();
const env = { ...process.env };
if (dockerBinDir) {
  const sep = process.platform === 'win32' ? ';' : ':';
  env.PATH = `${dockerBinDir}${sep}${env.PATH || ''}`;
}

const docker = findDocker();
const args = ['compose', ...process.argv.slice(2)];
const result = spawnSync(docker, args, {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
  env,
});

process.exit(result.status ?? 1);
