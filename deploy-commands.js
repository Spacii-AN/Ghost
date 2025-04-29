import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

// Check for missing environment variables
if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('Missing required environment variables. Please check your .env file.');
  console.error('Required variables: DISCORD_TOKEN, CLIENT_ID, GUILD_ID');
  process.exit(1);
}

// Emulate __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];

// Path to the 'src/commands' directory
const commandsPath = path.join(__dirname, 'src/commands');

// Check if the directory exists
if (!fs.existsSync(commandsPath)) {
  console.error(`Commands directory not found: ${commandsPath}`);
  process.exit(1);
}

// Get all items in the commands directory
const commandItems = fs.readdirSync(commandsPath);

// Process direct command files
const commandFiles = commandItems.filter(item => 
  !fs.statSync(path.join(commandsPath, item)).isDirectory() && 
  (item.endsWith('.js') || item.endsWith('.ts'))
);

// Process command folders
const commandFolders = commandItems.filter(item => 
  fs.statSync(path.join(commandsPath, item)).isDirectory()
);

// Load commands from files
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  try {
    const command = await import(`file://${filePath}`);
    if (command.default && 'data' in command.default && 'execute' in command.default) {
      commands.push(command.default.data.toJSON());
      console.log(`Loaded command from file: ${file}`);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  } catch (error) {
    console.error(`Failed to load command at ${filePath}:`, error);
  }
}

// Load commands from folders
for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  const folderFiles = fs.readdirSync(folderPath).filter(file => 
    file.endsWith('.js') || file.endsWith('.ts')
  );

  for (const file of folderFiles) {
    const filePath = path.join(folderPath, file);
    try {
      const command = await import(`file://${filePath}`);
      if (command.default && 'data' in command.default && 'execute' in command.default) {
        commands.push(command.default.data.toJSON());
        console.log(`Loaded command from folder ${folder}: ${file}`);
      } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    } catch (error) {
      console.error(`Failed to load command at ${filePath}:`, error);
    }
  }
}

// Deploy the commands
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    if (commands.length === 0) {
      console.warn('No commands found to deploy!');
      return;
    }

    const data = await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands },
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error('Error while reloading commands:', error);
  }
})();