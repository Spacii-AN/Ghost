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
  // Ensure the file is not empty and contains at least an empty array
  const fileContent = fs.readFileSync(filePath, 'utf8');
  if (!fileContent || fileContent.trim() === '') {
    fs.writeFileSync(filePath, JSON.stringify([]));
  }
}

function safelyParseJSON(content: string): any[] {
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return [];
  }
}

export function saveAllowedRole(roleId: string) {
  ensureFile();
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const roles = safelyParseJSON(fileContent);
  
  if (!roles.includes(roleId)) {
    roles.push(roleId);
    fs.writeFileSync(filePath, JSON.stringify(roles, null, 2));
  }
}

export function getAllowedRole(): string[] {
  ensureFile();
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return safelyParseJSON(fileContent);
}

export function removeAllowedRole(roleId: string) {
  ensureFile();
  const fileContent = fs.readFileSync(filePath, 'utf8');
  let roles = safelyParseJSON(fileContent);
  
  roles = roles.filter((id: string) => id !== roleId);
  fs.writeFileSync(filePath, JSON.stringify(roles, null, 2));
}
