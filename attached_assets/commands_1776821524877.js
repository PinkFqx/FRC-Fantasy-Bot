require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder().setName('join_draft').setDescription('Join the fantasy draft'),
  new SlashCommandBuilder().setName('start_draft').setDescription('Start the season draft'),
  new SlashCommandBuilder().setName('start_worlds_draft').setDescription('Start the worlds draft'),
  new SlashCommandBuilder()
    .setName('pick')
    .setDescription('Pick a team')
    .addIntegerOption(opt => opt.setName('team').setDescription('FRC team number').setRequired(true)),
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
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('✅ All commands registered successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
})();