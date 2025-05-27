const { SlashCommandBuilder, REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');

const commands = [
  new SlashCommandBuilder()
    .setName('rango')
    .setDescription('Da el nuevo rol y quita el anterior')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('El usuario al que dar el rol')
        .setRequired(true))
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Registrando comando...');
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log('✅ Comando registrado correctamente.');
  } catch (error) {
    console.error(error);
  }
})();
