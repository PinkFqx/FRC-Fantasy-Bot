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
| `/start_worlds_draft` | Start the Worlds draft — auto-calculates season standings and reverses order (host only) |
| `/pick team:<number>` | Pick an FRC team by number |
| `/standings` | Show live fantasy standings with real scores pulled from TBA |
| `/teams` | Show all players and their drafted teams |
| `/team name:<keyword>` | Search for a team by name |
| `/team_identify number:<n>` | Get a team's name by number |
| `/reset_draft confirm:RESET` | Manually reset the draft |

## Scoring System

### Season
- Each team's score = district/regional points from their **first 2 events** (type 0=Regional, 1=District)
- Points sourced from `/event/{key}/district_points` on TBA (includes qual ranking, alliance selection, playoffs, awards)
- If a team has only played **1 event**, their points are **doubled**
- Fetched live from TBA whenever `/standings` is called

### Worlds
- Each team's score = district points from their **Championship Division** event (type 3) and Finals (type 4)
- Same TBA points structure as season events

### Worlds Draft Order
- When `/start_worlds_draft` is called, season standings are calculated live from TBA
- Draft order is **reversed** from standings (worst season rank picks first — snake format)
- `lastSeasonStandings` is saved to `data.json` for reference

## Draft Flow

1. Host runs `/draftstatus open:true` to open joining
2. Players run `/join_draft` to enter
3. Host runs `/start_draft` (season) — random snake draft order
4. Players take turns with `/pick team:<number>` — 6 picks each
5. Check `/standings` anytime to see live scores from TBA
6. When season is over, host runs `/start_worlds_draft` — auto-calculates final standings and sets worlds draft order
7. Worlds draft proceeds the same way with `/pick`

## Dependencies

- `discord.js` ^14.26.3 — Discord bot framework
- `@discordjs/rest` — REST API client for command registration
- `dotenv` — Environment variable loading
- `node-cron` — Cron job support
- `node-fetch` — HTTP fetch polyfill
