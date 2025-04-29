# Ghost Bot

A Discord bot that allows you to troll users with ghost pings.

## Setup

1. Create a `.env` file in the root directory with the following variables:

```
# Bot token from Discord Developer Portal
TOKEN=your_discord_bot_token

# Application ID from Discord Developer Portal
CLIENT_ID=your_application_id

# Server/Guild ID where you want to use the bot
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