const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  name: 'createRecord',
  description: 'Tworzy kartotekę użytkownika za pomocą modala.',
  async execute(interaction) {
    const userId = interaction.customId.split('-')[1];

    const modal = new ModalBuilder()
      .setCustomId(`createRecordModal-${userId}`)
      .setTitle('Załóż kartotekę');

    const nickInput = new TextInputBuilder()
      .setCustomId('nick')
      .setLabel('Twój nick')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const descriptionInput = new TextInputBuilder()
      .setCustomId('description')
      .setLabel('Opis')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nickInput),
      new ActionRowBuilder().addComponents(descriptionInput)
    );

    await interaction.showModal(modal);
  },

  async handleModalSubmit(interaction, client) {
    const [action, userId] = interaction.customId.split('-');
    const db = loadDatabase();

    if (action === 'createRecordModal') {
      if (!db[userId]) {
        db[userId] = [];
      }

      const nick = interaction.fields.getTextInputValue('nick');
      const description = interaction.fields.getTextInputValue('description');

      const newRecord = {
        date: new Date().toISOString(),
        nick,
        id: interaction.user.id,
        description
      };

      db[userId].push(newRecord);
      saveDatabase(db);

      const embed = new EmbedBuilder()
        .setTitle('Kartoteka założona')
        .setDescription(`Kartoteka dla użytkownika ${userId} została założona.\n\nNick: ${nick}\nOpis: ${description}`)
        .setColor('#00FF00');

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};

// Funkcja do zapisu kartotek do pliku
const saveDatabase = (db) => {
  fs.writeFileSync(path.resolve(__dirname, '../../../database.json'), JSON.stringify(db, null, 2));
};

// Funkcja do odczytu kartotek z pliku
const loadDatabase = () => {
  if (!fs.existsSync(path.resolve(__dirname, '../../../database.json'))) {
    return {};
  }
  return JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../database.json')));
};
