import fs from 'fs';
import path from 'path';

const dataDir = path.join(__dirname, '..', 'data');
const filePath = path.join(dataDir, 'allowedRole.json');

function ensureFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
  }
}

export function saveAllowedRole(roleId: string) {
  ensureFile();
  const roles = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!roles.includes(roleId)) {
    roles.push(roleId);
    fs.writeFileSync(filePath, JSON.stringify(roles, null, 2));
  }
}

export function getAllowedRole(): string[] {
  ensureFile();
  const roles = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return Array.isArray(roles) ? roles : [];
}

export function removeAllowedRole(roleId: string) {
  ensureFile();
  let roles = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  roles = roles.filter((id: string) => id !== roleId);
  fs.writeFileSync(filePath, JSON.stringify(roles, null, 2));
}
