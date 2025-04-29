import { Client, GatewayIntentBits, Collection, REST, Routes, ButtonInteraction } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { removeTroll } from './utils/trollmanager.js';
import { EmbedCreator } from './utils/embedBuilder.js';

dotenv.config();

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ExtendedClient extends Client {
  commands: Collection<string, any>;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
}) as ExtendedClient;

client.commands = new Collection();

// Scan for command folders and files
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath).filter(folder => 
  fs.statSync(path.join(commandsPath, folder)).isDirectory()
);

// For direct command files in the commands directory
const directCommandFiles = fs.readdirSync(commandsPath).filter(file => 
  (file.endsWith('.js') || file.endsWith('.ts')) && 
  !fs.statSync(path.join(commandsPath, file)).isDirectory()
);

// Function to register commands
async function registerCommands() {
  const commandsArray = [];
  
  // Process direct command files
  for (const file of directCommandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      const command = await import(`file://${filePath}`);
      
      if ('default' in command && 'data' in command.default && 'execute' in command.default) {
        client.commands.set(command.default.data.name, command.default);
        commandsArray.push(command.default.data.toJSON());
      } else {
        console.warn(`[WARNING] Command at ${filePath} is missing "data" or "execute" in default export.`);
      }
    } catch (error) {
      console.error(`Error loading command at ${filePath}:`, error);
    }
  }
  
  // Process commands in folders
  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => 
      file.endsWith('.js') || file.endsWith('.ts')
    );
    
    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      try {
        const command = await import(`file://${filePath}`);
        
        if ('default' in command && 'data' in command.default && 'execute' in command.default) {
          client.commands.set(command.default.data.name, command.default);
          commandsArray.push(command.default.data.toJSON());
        } else {
          console.warn(`[WARNING] Command at ${filePath} is missing "data" or "execute" in default export.`);
        }
      } catch (error) {
        console.error(`Error loading command at ${filePath}:`, error);
      }
    }
  }
  
  return commandsArray;
}

// Register slash commands with Discord
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN || '');

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    
    if (!process.env.CLIENT_ID || !process.env.GUILD_ID) {
      console.error('Missing CLIENT_ID or GUILD_ID in .env!');
      return;
    }
    
    const commandsArray = await registerCommands();
    
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commandsArray }
    );
    
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

client.on('interactionCreate', async interaction => {
  // Handle slash commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    
    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }
    
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error executing this command.', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error executing this command.', ephemeral: true });
      }
    }
  } 
  // Handle button interactions
  else if (interaction.isButton()) {
    const buttonId = interaction.customId;
    
    // Handle stop trolling button
    if (buttonId.startsWith('stop_trolling_')) {
      const userId = buttonId.replace('stop_trolling_', '');
      await handleStopTrolling(userId, interaction);
    }
  }
});

/**
 * Handle stop trolling button interaction
 */
async function handleStopTrolling(userId: string, interaction: ButtonInteraction) {
  try {
    removeTroll(userId);
    
    const user = await client.users.fetch(userId);
    const embed = new EmbedCreator()
      .setTitle('Trolling Stopped')
      .setDescription(`Stopped trolling ${user.tag}.`)
      .setTimestamp()
      .setColor('#FF0000')
      .build();
      
    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error handling stop trolling button:', error);
    const errorEmbed = new EmbedCreator()
      .setTitle('Error')
      .setDescription('An error occurred while trying to stop trolling.')
      .setTimestamp()
      .setColor('#FF0000')
      .build();
    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
}

client.login(process.env.TOKEN);