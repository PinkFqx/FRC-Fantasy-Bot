require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const fullCommands = [
  new SlashCommandBuilder().setName('setchannel').setDescription('Set this channel as the draft channel (requires Manage Server permission)'),
  new SlashCommandBuilder().setName('currentyear').setDescription('Show the current year the bot is using for TBA data'),
  new SlashCommandBuilder()
    .setName('setyear')
    .setDescription('Set the FRC season year for TBA data (admin only)')
    .addIntegerOption(opt => opt.setName('year').setDescription('e.g. 2027').setRequired(true)),
  new SlashCommandBuilder().setName('skip').setDescription('Auto-pick the highest-scoring available team for your turn'),
  new SlashCommandBuilder()
    .setName('undraft')
    .setDescription('Undo the last pick or remove a specific team (admin only)')
    .addIntegerOption(opt => opt.setName('team').setDescription('FRC team number to undraft (omit to undo last pick)').setRequired(false)),
  new SlashCommandBuilder().setName('podium').setDescription('Show the fantasy podium with personal placement'),
  new SlashCommandBuilder()
    .setName('addadmin')
    .setDescription('Promote a player to admin (admin only)')
    .addUserOption(opt => opt.setName('user').setDescription('Discord user to promote').setRequired(true)),
  new SlashCommandBuilder()
    .setName('addmanualplayer')
    .setDescription('Add a non-Discord player to the draft (admin only)')
    .addStringOption(opt => opt.setName('name').setDescription('Name for the manual player').setRequired(true)),
  new SlashCommandBuilder()
    .setName('manualpick')
    .setDescription('Pick a team for a manual player (admin only)')
    .addStringOption(opt => opt.setName('player').setDescription('Name of the manual player').setRequired(true))
    .addIntegerOption(opt => opt.setName('team').setDescription('FRC team number').setRequired(true)),
  new SlashCommandBuilder().setName('exportcsv').setDescription('Export a CSV backup of all rosters'),
  new SlashCommandBuilder().setName('roster').setDescription('Show all rosters as a clean team list (no scores)'),
  new SlashCommandBuilder().setName('join_draft').setDescription('Join the fantasy draft'),
  new SlashCommandBuilder().setName('addbot').setDescription('Add a CPU player to the draft that auto-picks randomly'),
  new SlashCommandBuilder().setName('start_draft').setDescription('Start the season draft'),
  new SlashCommandBuilder().setName('start_worlds_draft').setDescription('Start the worlds draft (calculates season standings automatically)'),
  new SlashCommandBuilder()
    .setName('pick')
    .setDescription('Pick a team')
    .addIntegerOption(opt => opt.setName('team').setDescription('FRC team number').setRequired(true))
    .addUserOption(opt => opt.setName('for').setDescription('Pick for this player instead of yourself (admin only)').setRequired(false)),
  new SlashCommandBuilder()
    .setName('standings')
    .setDescription('Show live fantasy standings with real scores from TBA'),
  new SlashCommandBuilder()
    .setName('trade')
    .setDescription('Propose a trade with another player')
    .addIntegerOption(opt => opt.setName('offer').setDescription('Team number you are giving away').setRequired(true))
    .addIntegerOption(opt => opt.setName('request').setDescription('Team number you want in return').setRequired(true)),
  new SlashCommandBuilder()
    .setName('tradelock')
    .setDescription('Override the automatic trade lock rules (admin only)')
    .addStringOption(opt =>
      opt.setName('mode')
        .setDescription('auto = default rules, locked = force closed, open = force allow')
        .setRequired(true)
        .addChoices(
          { name: 'auto (default: Week 5 deadline + 24h after worlds)', value: 'auto' },
          { name: 'locked (force trading closed)', value: 'locked' },
          { name: 'open (force trading allowed)', value: 'open' }
        )
    ),
  new SlashCommandBuilder()
    .setName('accepttrade')
    .setDescription('Accept the trade proposed to you'),
  new SlashCommandBuilder()
    .setName('declinetrade')
    .setDescription('Decline or cancel the current pending trade'),
  new SlashCommandBuilder()
    .setName('score')
    .setDescription('Show a full point breakdown for any FRC team')
    .addIntegerOption(opt => opt.setName('team').setDescription('FRC team number').setRequired(true)),
  new SlashCommandBuilder()
    .setName('breakdown')
    .setDescription('Show a full breakdown for one fantasy team or all fantasy teams')
    .addStringOption(opt =>
      opt.setName('player')
        .setDescription('@mention a player, a manual player\'s name, or ALL')
        .setRequired(true)
    ),
  new SlashCommandBuilder().setName('teams').setDescription('Show all fantasy teams and their owners'),
  new SlashCommandBuilder()
    .setName('team')
    .setDescription('Search for a team by name')
    .addStringOption(opt => opt.setName('name').setDescription('Team name or keyword').setRequired(true)),
  new SlashCommandBuilder()
    .setName('team_identify')
    .setDescription('Get team name by number')
    .addIntegerOption(opt => opt.setName('number').setDescription('Team number').setRequired(true)),
  new SlashCommandBuilder()
    .setName('reset_draft')
    .setDescription('Reset the draft')
    .addStringOption(opt => opt.setName('confirm').setDescription('Type RESET to confirm').setRequired(true)),
  new SlashCommandBuilder()
    .setName('draftstatus')
    .setDescription('Open or close + reset the draft')
    .addBooleanOption(option =>
      option.setName('open')
        .setDescription('true = open for joining | false = close and reset')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('settimer')
    .setDescription('Set the auto-skip timer for picks; 0 = disabled (admin only)')
    .addIntegerOption(opt => opt.setName('minutes').setDescription('Minutes before auto-skip; 0 to disable').setRequired(true).setMinValue(0)),
  new SlashCommandBuilder()
    .setName('draftorder')
    .setDescription('Show the upcoming pick order in the snake draft')
    .addIntegerOption(opt => opt.setName('picks').setDescription('Number of upcoming picks to show (default 10, max 20)').setRequired(false).setMinValue(1).setMaxValue(20)),
  new SlashCommandBuilder().setName('myteams').setDescription('Show your personal team scores and breakdown (private)'),
  new SlashCommandBuilder().setName('schedule').setDescription('Show upcoming events for all drafted teams in the next 2 weeks'),
  new SlashCommandBuilder().setName('help').setDescription('Show a full command reference'),
  new SlashCommandBuilder().setName('rules').setDescription('Show the fantasy scoring rules'),
  new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Post a custom message to #frc-fantasy-updates (admin only)')
    .addStringOption(opt => opt.setName('message').setDescription('Message to post').setRequired(true).setMaxLength(2000)),
];

const closedCommands = [
  new SlashCommandBuilder().setName('setchannel').setDescription('Set this channel as the draft channel (requires Manage Server permission)'),
  new SlashCommandBuilder().setName('draftstatus').setDescription('Open or close + reset the draft'),
  new SlashCommandBuilder().setName('standings').setDescription('Show live fantasy standings with real scores from TBA'),
  new SlashCommandBuilder()
    .setName('score')
    .setDescription('Show a full point breakdown for any FRC team')
    .addIntegerOption(opt => opt.setName('team').setDescription('FRC team number').setRequired(true)),
  new SlashCommandBuilder().setName('teams').setDescription('Show all fantasy teams and their owners'),
  new SlashCommandBuilder().setName('currentyear').setDescription('Show the current year the bot is using for TBA data'),
  new SlashCommandBuilder().setName('skip').setDescription('Auto-pick the highest-scoring available team for your turn'),
  new SlashCommandBuilder().setName('exportcsv').setDescription('Export a CSV backup of all rosters'),
  new SlashCommandBuilder().setName('roster').setDescription('Show all rosters as a clean team list (no scores)'),
  new SlashCommandBuilder()
    .setName('settimer')
    .setDescription('Set the auto-skip timer for picks; 0 = disabled (admin only)')
    .addIntegerOption(opt => opt.setName('minutes').setDescription('Minutes before auto-skip; 0 to disable').setRequired(true).setMinValue(0)),
  new SlashCommandBuilder().setName('myteams').setDescription('Show your personal team scores and breakdown (private)'),
  new SlashCommandBuilder().setName('schedule').setDescription('Show upcoming events for all drafted teams in the next 2 weeks'),
  new SlashCommandBuilder().setName('help').setDescription('Show a full command reference'),
  new SlashCommandBuilder().setName('rules').setDescription('Show the fantasy scoring rules'),
  new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Post a custom message to #frc-fantasy-updates (admin only)')
    .addStringOption(opt => opt.setName('message').setDescription('Message to post').setRequired(true).setMaxLength(2000)),
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Registering global slash commands...');
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: fullCommands });
    console.log('✅ All commands registered globally! (may take up to 1 hour to appear in servers)');
  } catch (error) {
    console.error('Error:', error);
  }
})();

module.exports = { fullCommands, closedCommands };
