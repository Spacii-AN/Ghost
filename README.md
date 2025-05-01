# Ghost Bot

A Discord bot that allows you to troll users with ghost pings.

## Setup

1. Create a `.env` file in the root directory with the following variables:

```

# Discord Bot Configuration
# Create a copy of this file named .env and fill in the values

# Your Discord bot token
# Both TOKEN and DISCORD_TOKEN work (they're the same)
TOKEN=your_discord_bot_token

# Discord application ID (same as your bot's client ID)
CLIENT_ID=your_application_id

# ID of the server (guild) where you want to deploy the commands
GUILD_ID=your_server_id


```

2. Install dependencies:
```
npm install
```

3. Run the bot:
```
npm run dev
```

## Commands

- `/start` - Start trolling a user with a specified duration and frequency
- `/stop` - Stop trolling a user
- `/status` - Check which users are currently being trolled
- `/addrole` - Add a role that can use the troll commands (admin only)
- `/removerole` - Remove a role from the allowed list (admin only)

## Notes

The bot requires the following environment variables:
- `TOKEN` - Your Discord bot token
- `CLIENT_ID` - Your application/bot client ID
- `GUILD_ID` - The ID of the server where you want to register commands 