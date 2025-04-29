import { Client, GatewayIntentBits, Collection, REST, Routes, ButtonInteraction } from 'discord.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { removeTroll } from './utils/trollmanager';
import { EmbedCreator } from './utils/embedBuilder';

dotenv.config();

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
function registerCommands() {
  const commandsArray = [];
  
  // Process direct command files
  for (const file of directCommandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      // Import the command using require
      const command = require(filePath);
      
      if (command.default && command.default.data && command.default.execute) {
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
        // Import the command using require
        const command = require(filePath);
        
        if (command.default && command.default.data && command.default.execute) {
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
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN!);

// Add a tool for manual command management for guild commands
async function deleteSpecificGuildCommands(commandNames: string[]) {
  try {
    console.log(`Attempting to delete specific guild commands: ${commandNames.join(', ')}`);
    
    // Get all existing commands
    const existingCommands = await rest.get(
      Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!)
    ) as any[];
    
    console.log('All existing guild commands:');
    existingCommands.forEach((cmd: any) => {
      console.log(`- ${cmd.name} (ID: ${cmd.id})`);
    });
    
    // Find commands to delete by name
    const commandsToDelete = existingCommands.filter((cmd: any) => 
      commandNames.includes(cmd.name)
    );
    
    if (commandsToDelete.length === 0) {
      console.log('No matching guild commands found to delete.');
      return;
    }
    
    console.log(`Found ${commandsToDelete.length} guild commands to delete.`);
    
    // Delete each command individually
    for (const cmd of commandsToDelete) {
      console.log(`Deleting guild command: ${cmd.name} (ID: ${cmd.id})`);
      await rest.delete(
        Routes.applicationGuildCommand(
          process.env.CLIENT_ID!, 
          process.env.GUILD_ID!, 
          cmd.id
        )
      );
      console.log(`Successfully deleted guild command: ${cmd.name}`);
    }
    
    console.log('Guild command deletion completed.');
  } catch (error) {
    console.error('Error during guild command deletion:', error);
  }
}

// Add a tool for manual command management for global commands
async function deleteSpecificGlobalCommands(commandNames: string[]) {
  try {
    console.log(`Attempting to delete specific global commands: ${commandNames.join(', ')}`);
    
    // Get all existing global commands
    const existingCommands = await rest.get(
      Routes.applicationCommands(process.env.CLIENT_ID!)
    ) as any[];
    
    console.log('All existing global commands:');
    existingCommands.forEach((cmd: any) => {
      console.log(`- ${cmd.name} (ID: ${cmd.id})`);
    });
    
    // Find commands to delete by name
    const commandsToDelete = existingCommands.filter((cmd: any) => 
      commandNames.includes(cmd.name)
    );
    
    if (commandsToDelete.length === 0) {
      console.log('No matching global commands found to delete.');
      return;
    }
    
    console.log(`Found ${commandsToDelete.length} global commands to delete.`);
    
    // Delete each command individually
    for (const cmd of commandsToDelete) {
      console.log(`Deleting global command: ${cmd.name} (ID: ${cmd.id})`);
      await rest.delete(
        Routes.applicationCommand(
          process.env.CLIENT_ID!, 
          cmd.id
        )
      );
      console.log(`Successfully deleted global command: ${cmd.name}`);
    }
    
    console.log('Global command deletion completed.');
  } catch (error) {
    console.error('Error during global command deletion:', error);
  }
}

// Add a function to list all guild commands
async function listAllGuildCommands() {
  try {
    const existingCommands = await rest.get(
      Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!)
    ) as any[];
    
    console.log('=== ALL REGISTERED GUILD COMMANDS ===');
    existingCommands.forEach((cmd: any) => {
      console.log(`- ${cmd.name} (ID: ${cmd.id})`);
    });
    console.log('======================================');
    
    return existingCommands;
  } catch (error) {
    console.error('Error listing guild commands:', error);
    return [];
  }
}

// Add a function to list all global commands
async function listAllGlobalCommands() {
  try {
    const existingCommands = await rest.get(
      Routes.applicationCommands(process.env.CLIENT_ID!)
    ) as any[];
    
    console.log('=== ALL REGISTERED GLOBAL COMMANDS ===');
    existingCommands.forEach((cmd: any) => {
      console.log(`- ${cmd.name} (ID: ${cmd.id})`);
    });
    console.log('=======================================');
    
    return existingCommands;
  } catch (error) {
    console.error('Error listing global commands:', error);
    return [];
  }
}

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    
    if (!process.env.TOKEN) {
      console.error('Missing TOKEN in .env!');
      return;
    }
    
    if (!process.env.CLIENT_ID) {
      console.error('Missing CLIENT_ID in .env!');
      return;
    }

    // Check for guild ID
    const hasGuildId = !!process.env.GUILD_ID;
    if (!hasGuildId) {
      console.warn('No GUILD_ID provided in .env. Will only manage global commands.');
    }

    // Register the current commands from your code
    const commandsArray = registerCommands();
    const currentCommandNames = commandsArray.map(cmd => cmd.name);
    console.log(`Current commands in code: ${currentCommandNames.join(', ')}`);
    
    // HANDLE GUILD COMMANDS
    if (hasGuildId) {
      // First, list all currently registered guild commands
      console.log('Checking currently registered guild commands...');
      const existingGuildCommands = await listAllGuildCommands();
      
      // Find old guild commands that need deletion
      const oldGuildCommandNames = existingGuildCommands
        .map((cmd: any) => cmd.name)
        .filter((name: string) => !currentCommandNames.includes(name));
      
      if (oldGuildCommandNames.length > 0) {
        console.log(`Found ${oldGuildCommandNames.length} old guild commands to remove: ${oldGuildCommandNames.join(', ')}`);
        
        // Delete the old guild commands
        await deleteSpecificGuildCommands(oldGuildCommandNames);
        
        // Wait a moment for Discord to process the deletions
        console.log('Waiting for Discord to process guild command deletions...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log('No old guild commands found that need to be removed.');
      }
      
      // Now register the current commands to the guild
      console.log('Registering current commands to guild...');
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
        { body: commandsArray }
      );
      
      console.log(`Successfully registered ${commandsArray.length} application guild (/) commands.`);
    }
    
    // HANDLE GLOBAL COMMANDS
    // First, list all currently registered global commands
    console.log('Checking currently registered global commands...');
    const existingGlobalCommands = await listAllGlobalCommands();
    
    // Find old global commands that need deletion
    const oldGlobalCommandNames = existingGlobalCommands
      .map((cmd: any) => cmd.name)
      .filter((name: string) => !currentCommandNames.includes(name));
    
    if (oldGlobalCommandNames.length > 0) {
      console.log(`Found ${oldGlobalCommandNames.length} old global commands to remove: ${oldGlobalCommandNames.join(', ')}`);
      
      // Delete the old global commands
      await deleteSpecificGlobalCommands(oldGlobalCommandNames);
      
      // Wait a moment for Discord to process the deletions
      console.log('Waiting for Discord to process global command deletions...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log('No old global commands found that need to be removed.');
    }
    
    // If you want to register commands globally as well (uncomment if needed)
    // Typically you would choose either guild OR global registration, not both
    /*
    console.log('Registering current commands globally...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commandsArray }
    );
    console.log(`Successfully registered ${commandsArray.length} global application (/) commands.`);
    */
    
    // Final verification
    console.log('Verifying final command state...');
    if (hasGuildId) {
      await listAllGuildCommands();
    }
    await listAllGlobalCommands();
  } catch (error) {
    console.error('Error during command registration:', error);
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