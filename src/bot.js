require('dotenv').config();
const { token, prefix } = process.env;
const { Client, Collection, GatewayIntentBits, Partials, InteractionType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const panel = require('./commands/tools/panel');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers // Dodajemy uprawnienia do zarządzania członkami
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();

// Ładowanie funkcji
const functionFolders = fs.readdirSync(`./src/functions`);
for (const folder of functionFolders) {
  const functionFiles = fs
    .readdirSync(`./src/functions/${folder}`)
    .filter((file) => file.endsWith('.js'));
  for (const file of functionFiles) {
    console.log(`Ładowanie funkcji z folderu: ${folder}, plik: ${file}`);
    require(`./functions/${folder}/${file}`)(client);
  }
}

client.handleEvents();
client.handleCommands();

client.on('messageCreate', (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    command.execute(message, args, client);
  } catch (error) {
    console.error(error);
    message.reply({ content: 'Wystąpił błąd podczas wykonywania tej komendy!', ephemeral: true });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.type === InteractionType.MessageComponent) {
    const [action] = interaction.customId.split('-');

    if (action === 'teamPanel' || action === 'userPanel') {
      await panel.handleInteraction(interaction, client);
    } else if (action === 'noCreateRecord' || action === 'createRecord' || action === 'updateRecord' || action === 'noUpdateRecord') {
      const kartoteka = require('./commands/tools/kartoteka');
      await kartoteka.handleInteraction(interaction, client);
    }
  } else if (interaction.type === InteractionType.ModalSubmit) {
    const [action] = interaction.customId.split('-');

    if (action === 'createRecordModal') {
      const kartoteka = require('./commands/tools/kartoteka');
      await kartoteka.handleModalSubmit(interaction, client);
    }
  }
});

client.login(token);
