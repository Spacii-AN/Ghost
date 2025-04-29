import fs from 'fs';
import path from 'path';

const dataDir = path.join(__dirname, '..', 'data');
const filePath = path.join(dataDir, 'trolls.json');

// Keep track of active troll intervals
const activeIntervals: Map<string, NodeJS.Timeout> = new Map();

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

export interface TrollEntry {
  userId: string;
  endTime: number; // timestamp in ms
}

export function saveTroll(userId: string, durationMinutes: number) {
  ensureFile();
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const trolls = safelyParseJSON(fileContent) as TrollEntry[];
  const endTime = Date.now() + durationMinutes * 60000;
  trolls.push({ userId, endTime });
  fs.writeFileSync(filePath, JSON.stringify(trolls, null, 2));
}

export function removeTroll(userId: string) {
  ensureFile();
  const fileContent = fs.readFileSync(filePath, 'utf8');
  let trolls = safelyParseJSON(fileContent) as TrollEntry[];
  trolls = trolls.filter(troll => troll.userId !== userId);
  fs.writeFileSync(filePath, JSON.stringify(trolls, null, 2));
  
  // Clear the interval if it exists
  const interval = activeIntervals.get(userId);
  if (interval) {
    clearInterval(interval);
    activeIntervals.delete(userId);
    console.log(`Stopped trolling for user ${userId}`);
  }
}

export function getTrolls(): TrollEntry[] {
  ensureFile();
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return safelyParseJSON(fileContent) as TrollEntry[];
}

export function clearAllTrolls() {
  ensureFile();
  fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  
  // Clear all active intervals
  for (const [userId, interval] of activeIntervals.entries()) {
    clearInterval(interval);
    console.log(`Stopped trolling for user ${userId}`);
  }
  activeIntervals.clear();
}

// Store an interval for a user
export function storeInterval(userId: string, interval: NodeJS.Timeout) {
  // Clear any existing interval first
  const existingInterval = activeIntervals.get(userId);
  if (existingInterval) {
    clearInterval(existingInterval);
  }
  
  activeIntervals.set(userId, interval);
  console.log(`Started trolling for user ${userId}`);
}


