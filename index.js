require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} = require('discord.js');

const fs = require('fs');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ---------------- DATA ----------------
function loadData() {
  try {
    return JSON.parse(fs.readFileSync('./data.json'));
  } catch (err) {
    return {
      players: [],
      draftOrder: [],
      teamsDrafted: {},
      currentPick: 0,
      phase: "none",
      draftOpen: false,
      lastSeasonStandings: [],
      worldsTeams: [],
      seasonTeams: []
    };
  }
}

function saveData(data) {
  fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
}

// ---------------- SAFE FETCH ----------------
async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`Fetch error: ${url}`);
    return null;
  }
}

// ---------------- TBA HELPERS ----------------
async function getTeamName(teamNumber) {
  try {
    const res = await fetch(
      `https://www.thebluealliance.com/api/v3/team/frc${teamNumber}`,
      { headers: { 'X-TBA-Auth-Key': process.env.TBA_KEY } }
    );
    if (!res.ok) return `Team ${teamNumber}`;
    const data = await res.json();
    return `${data.nickname || 'Unknown'} (FRC ${teamNumber})`;
  } catch (err) {
    return `Team ${teamNumber}`;
  }
}

async function loadSeasonTeams() {
  const allTeams = [];
  let page = 0;
  while (true) {
    const teams = await safeFetch(
      `https://www.thebluealliance.com/api/v3/teams/2026/${page}`,
      { headers: { 'X-TBA-Auth-Key': process.env.TBA_KEY } }
    );
    if (!teams || teams.length === 0) break;
    allTeams.push(...teams.map(t => t.team_number));
    page++;
  }
  return allTeams;
}

async function loadWorldsTeams() {
  const teams = await safeFetch(
    'https://www.thebluealliance.com/api/v3/event/2026cmptx/teams',
    { headers: { 'X-TBA-Auth-Key': process.env.TBA_KEY } }
  );
  return teams?.map(t => t.team_number) || [];
}

function getCurrentPlayer(data) {
  const n = data.draftOrder.length;
  const round = Math.floor(data.currentPick / n);
  const index = data.currentPick % n;
  return (round % 2 === 0) ? data.draftOrder[index] : data.draftOrder[n - 1 - index];
}

// ---------------- READY ----------------
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ---------------- COMMAND HANDLER ----------------
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const data = loadData();
  const userId = interaction.user.id;

  try {

    // DRAFT STATUS - Main control command
    if (interaction.commandName === 'draftstatus') {
      const setToOpen = interaction.options.getBoolean('open');

      if (data.players.length > 0 && userId !== data.players[0]) {
        return interaction.reply("❌ Only the draft host can change draft status.");
      }

      if (setToOpen === true) {
        data.draftOpen = true;
        saveData(data);
        return interaction.reply("✅ **Draft is now OPEN**\nPlayers can now join using `/join_draft`");
      } 
      else {
        const freshData = {
          players: [],
          draftOrder: [],
          teamsDrafted: {},
          currentPick: 0,
          phase: "none",
          draftOpen: false,
          lastSeasonStandings: [],
          worldsTeams: [],
          seasonTeams: []
        };
        saveData(freshData);
        return interaction.reply("🛑 **Draft has been CLOSED and RESET**");
      }
    }

    // JOIN DRAFT
    if (interaction.commandName === 'join_draft') {
      if (!data.draftOpen) {
        return interaction.reply("❌ Draft joining is currently closed.\nAsk the host to run `/draftstatus true`");
      }

      if (!data.players.includes(userId)) {
        data.players.push(userId);
        saveData(data);
        return interaction.reply(`✅ <@${userId}> has joined the draft!`);
      }
      return interaction.reply("You are already in the draft.");
    }

    // START SEASON DRAFT
    if (interaction.commandName === 'start_draft') {
      await interaction.deferReply();

      if (data.players.length === 0) return interaction.editReply("❌ No players have joined yet.");
      if (userId !== data.players[0]) return interaction.editReply("❌ Only the host can start the draft.");

      data.phase = "season";
      data.seasonTeams = await loadSeasonTeams();
      data.draftOrder = [...data.players].sort(() => Math.random() - 0.5);
      data.currentPick = 0;
      data.teamsDrafted = Object.fromEntries(data.players.map(p => [p, []]));
      data.draftOpen = false;
      saveData(data);

      const first = getCurrentPlayer(data);
      return interaction.editReply(
        `🚀 **Season Draft Started!**\nTeams loaded: ${data.seasonTeams.length}\nFirst pick: <@${first}>`
      );
    }

    // START WORLDS DRAFT
    if (interaction.commandName === 'start_worlds_draft') {
      await interaction.deferReply();

      if (data.players.length === 0) return interaction.editReply("❌ No players have joined yet.");
      if (userId !== data.players[0]) return interaction.editReply("❌ Only the host can start the draft.");

      data.phase = "worlds";
      data.worldsTeams = await loadWorldsTeams();
      data.draftOrder = data.lastSeasonStandings?.length 
        ? [...data.lastSeasonStandings].reverse() 
        : [...data.players];
      data.currentPick = 0;
      data.teamsDrafted = Object.fromEntries(data.players.map(p => [p, []]));
      data.draftOpen = false;
      saveData(data);

      return interaction.editReply(`🌍 **Worlds Draft Started!**`);
    }

    // PICK TEAM
    if (interaction.commandName === 'pick') {
      const team = interaction.options.getInteger('team');
      const current = getCurrentPlayer(data);

      if (userId !== current) return interaction.reply("⛔ Not your turn.");

      const pool = data.phase === "worlds" ? data.worldsTeams : data.seasonTeams;

      if (!pool.includes(team)) return interaction.reply(`⛔ Team ${team} is not in the pool.`);
      if (data.teamsDrafted[current].includes(team)) return interaction.reply(`⛔ You already drafted that team.`);

      data.teamsDrafted[current].push(team);
      data.currentPick++;

      const name = await getTeamName(team);
      const maxPicks = data.players.length * 6;

      if (data.currentPick >= maxPicks) {
        data.phase = "finished";
        saveData(data);
        return interaction.reply(`🏁 Draft complete!\n✅ <@${userId}> picked ${name}`);
      }

      const next = getCurrentPlayer(data);
      saveData(data);
      return interaction.reply(`✅ <@${userId}> picked **${name}**\n\n👉 Next: <@${next}>`);
    }

    // SHOW ALL FANTASY TEAMS
    if (interaction.commandName === 'teams') {
      if (data.players.length === 0) return interaction.reply("No players in the draft yet.");

      const embed = new EmbedBuilder().setTitle("Fantasy Draft Teams").setColor(0x00AE86);
      let desc = "";

      for (const player of data.players) {
        const owned = data.teamsDrafted[player] || [];
        desc += `**<@${player}>** (${owned.length} teams)\n`;
        if (owned.length > 0) {
          for (const t of owned) {
            desc += `• ${await getTeamName(t)}\n`;
          }
        } else {
          desc += "No teams drafted yet.\n";
        }
        desc += "\n";
      }

      embed.setDescription(desc);
      return interaction.reply({ embeds: [embed] });
    }

    // SEARCH TEAM BY NAME
    if (interaction.commandName === 'team') {
      await interaction.deferReply();
      const search = interaction.options.getString('name').toLowerCase();

      const allTeams = await loadSeasonTeams();
      const matches = [];

      for (const num of allTeams) {
        const name = await getTeamName(num);
        if (name.toLowerCase().includes(search)) {
          matches.push(name);
          if (matches.length >= 15) break;
        }
      }

      if (matches.length === 0) return interaction.editReply(`No teams found for "${search}".`);

      const embed = new EmbedBuilder()
        .setTitle(`Teams matching "${search}"`)
        .setDescription(matches.join('\n'))
        .setColor(0x00AE86);

      return interaction.editReply({ embeds: [embed] });
    }

    // IDENTIFY TEAM BY NUMBER
    if (interaction.commandName === 'team_identify') {
      await interaction.deferReply();
      const number = interaction.options.getInteger('number');
      const name = await getTeamName(number);
      return interaction.editReply(`🔍 Team ${number}: **${name}**`);
    }

    // RESET DRAFT (backup)
    if (interaction.commandName === 'reset_draft') {
      const confirm = interaction.options.getString('confirm');
      if (confirm !== "RESET") return interaction.reply("Type `RESET` to confirm.");
      if (data.players.length && userId !== data.players[0]) {
        return interaction.reply("❌ Only the host can reset.");
      }

      const freshData = {
        players: [], draftOrder: [], teamsDrafted: {}, currentPick: 0,
        phase: "none", draftOpen: false, lastSeasonStandings: [], worldsTeams: [], seasonTeams: []
      };
      saveData(freshData);
      return interaction.reply("🧹 Draft fully reset.");
    }

  } catch (err) {
    console.error(err);
    if (interaction.deferred) interaction.editReply("❌ Error occurred.").catch(() => {});
    else if (!interaction.replied) interaction.reply("❌ Error occurred.").catch(() => {});
  }
});

client.login(process.env.TOKEN);
