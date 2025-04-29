const { Client, Events, GatewayIntentBits, ActivityType } = require('discord.js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Check if Discord token is present
if (!process.env.DISCORD_TOKEN) {
  console.error('DISCORD_TOKEN is not set in the .env file');
  process.exit(1);
}

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, (c: { user: { tag: any; }; }) => {
  console.log(`✅ Ready! Logged in as ${c.user.tag}`);
  
  // Set bot status
  client.user?.setPresence({
    activities: [{ name: '!help for commands', type: ActivityType.Playing }],
    status: 'online',
  });
});

// Message handler
client.on(Events.MessageCreate, async (message: {
  channel: any; author: { bot: any; }; content: string; reply: (arg0: string) => void; createdTimestamp: number; 
}) => {
  // Ignore messages from bots
  if (message.author.bot) return;
  
  // Process commands
  if (message.content.startsWith('!')) {
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();
    
    switch (command) {
      case 'hello':
        message.reply('👋 Hello! I am Ghost, your friendly Discord bot!');
        break;
        
      case 'ping':
        const replyMessage = await message.channel.send('Pinging...');
        const latency = replyMessage.createdTimestamp - message.createdTimestamp;
        replyMessage.edit(`Pong! 🏓 Latency: ${latency}ms. API Latency: ${Math.round(client.ws.ping)}ms`);
        break;
        
      case 'help':
        message.reply(`
📋 **Ghost Bot Commands**
\`!hello\` - Say hello to Ghost
\`!ping\` - Check bot latency
\`!help\` - Show this help message
        `);
        break;
        
      default:
        // Unknown command
        break;
    }
  }
});

// Error handling
client.on(Events.Error, (error: any) => {
  console.error('Discord client error:', error);
});

// Login to Discord with your token
client.login(process.env.DISCORD_TOKEN)
  .catch((error: any) => {
    console.error('Failed to log in to Discord:', error);
  });