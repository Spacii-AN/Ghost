import { Client, GatewayIntentBits, Collection, REST, Routes, ButtonInteraction } from 'discord.js';
import { readdirSync } from 'fs';
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

// @ts-ignore
client.commands = new Collection();

const commandsArray: any[] = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

// Dynamically import and register each command
(async () => {
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(filePath);

    if ('data' in command.default && 'execute' in command.default) {
      client.commands.set(command.default.data.name, command.default);
      commandsArray.push(command.default.data.toJSON());
    } else {
      console.warn(`[WARNING] Command at ${filePath} is missing "data" or "execute".`);
    }
  }
})();

// Register slash commands with Discord
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN!);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    if (!process.env.CLIENT_ID || !process.env.GUILD_ID) {
      console.error('Missing CLIENT_ID or GUILD_ID in .env!');
      return;
    }

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commandsArray }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})

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
      .build()
    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
}

client.login(process.env.TOKEN);