import fs from 'fs';
import path from 'path';
const dataDir = path.join(__dirname, '..', 'data');
const filePath = path.join(dataDir, 'trolls.json');
function ensureFile() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([]));
    }
}
export function saveTroll(userId, durationMinutes) {
    ensureFile();
    const trolls = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const endTime = Date.now() + durationMinutes * 60000;
    trolls.push({ userId, endTime });
    fs.writeFileSync(filePath, JSON.stringify(trolls, null, 2));
}
export function removeTroll(userId) {
    ensureFile();
    let trolls = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    trolls = trolls.filter(troll => troll.userId !== userId);
    fs.writeFileSync(filePath, JSON.stringify(trolls, null, 2));
}
export function getTrolls() {
    ensureFile();
    const trolls = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return trolls;
}
export function clearAllTrolls() {
    ensureFile();
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
}
