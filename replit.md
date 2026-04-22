# FRC Fantasy Draft Discord Bot

A Discord bot for running an FRC (FIRST Robotics Competition) Fantasy Draft. Players join a draft, pick FRC teams from the season or Worlds pool, and compete based on their teams' performances.

## Project Structure

- `index.js` — Main bot file. Handles all Discord slash command interactions.
- `commands.js` — Registers slash commands with Discord's API. Run once when adding/changing commands.
- `data.json` — Persistent draft state (players, picks, phase, team pools).
- `package.json` — Node.js dependencies.

## Running the Bot

The bot starts automatically via the "Start application" workflow (`node index.js`).

To register/update slash commands with Discord (run once after changes):
```
node commands.js
```

## Environment Variables (Secrets)

All secrets are stored in Replit Secrets:
- `TOKEN` — Discord bot token
- `CLIENT_ID` — Discord application client ID
- `GUILD_ID` — Discord server (guild) ID
- `TBA_KEY` — The Blue Alliance API key (for fetching FRC team data)
- `CHANNEL_ID` — Discord channel ID

## Slash Commands

| Command | Description |
|---|---|
| `/draftstatus open:true` | Open the draft for players to join |
| `/draftstatus open:false` | Close and fully reset the draft |
| `/join_draft` | Join the fantasy draft (while open) |
| `/start_draft` | Start the season draft (host only) |
| `/start_worlds_draft` | Start the Worlds draft (host only) |
| `/pick team:<number>` | Pick an FRC team by number |
| `/teams` | Show all players and their drafted teams |
| `/team name:<keyword>` | Search for a team by name |
| `/team_identify number:<n>` | Get a team's name by number |
| `/reset_draft confirm:RESET` | Manually reset the draft |

## Draft Flow

1. Host runs `/draftstatus open:true` to open joining
2. Players run `/join_draft` to enter
3. Host runs `/start_draft` (season) or `/start_worlds_draft` (worlds)
4. Players take turns with `/pick team:<number>` in snake-draft order
5. Draft ends after 6 picks per player

## Dependencies

- `discord.js` ^14.26.3 — Discord bot framework
- `@discordjs/rest` — REST API client for command registration
- `dotenv` — Environment variable loading
- `node-cron` — Cron job support
- `node-fetch` — HTTP fetch polyfill
