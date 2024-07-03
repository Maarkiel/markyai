const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Funkcja do odczytu kartotek z pliku
const loadDatabase = () => {
  if (!fs.existsSync(path.resolve(__dirname, '../../database.json'))) {
    return {};
  }
  return JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../database.json')));
};

// Funkcja do zapisu kartotek do pliku
const saveDatabase = (db) => {
  fs.writeFileSync(path.resolve(__dirname, '../../database.json'), JSON.stringify(db, null, 2));
};

module.exports = {
  name: 'kartoteka',
  description: 'Zarządza kartoteką użytkownika.',
  async execute(message, args, client) {
    const userId = args[0];
    const allowedRoles = ['1255314190944702525', '701862892315869320', '1257744956420788306', '1257745014067429386', '1257739543738581043', '1257744580682711152'];
    if (!userId) {
      return message.reply('Musisz podać ID użytkownika.');
    }

    const user = await client.users.fetch(userId).catch(() => null);
    if (!user) {
      return message.reply('Nie znaleziono użytkownika o podanym ID.');
    }

    const db = loadDatabase();

    if (!db[userId]) {
      const embed = new EmbedBuilder()
        .setTitle('Brak kartoteki')
        .setDescription(`Użytkownik ${user.tag}, ID: ${userId} nie posiada kartoteki. Czy chcesz ją założyć?`)
        .setColor('#FF0000');

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`createRecord-${userId}`)
            .setLabel('Tak')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`noCreateRecord-${userId}`)
            .setLabel('Nie')
            .setStyle(ButtonStyle.Danger)
        );

      return message.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    const userRecords = db[userId];
    const embed = new EmbedBuilder()
      .setTitle(`Kartoteka użytkownika ${user.tag} (${userId})`)
      .setDescription('Użytkownik już jest wpisany w kartotece, podaje Ci wpisy:')
      .setColor('#00FF00');

    userRecords.forEach((record, index) => {
      embed.addFields(
        { name: `#${index + 1}`, value: `Data: ${record.date}\nNick: ${record.nick}\nID: ${record.id}\nOpis: ${record.description}`, inline: false }
      );
    });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`updateRecord-${userId}`)
          .setLabel('Tak')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`noUpdateRecord-${userId}`)
          .setLabel('Nie')
          .setStyle(ButtonStyle.Danger)
      );

    await message.reply({ embeds: [embed], ephemeral: true });

    const updateEmbed = new EmbedBuilder()
      .setTitle('Aktualizacja kartoteki')
      .setDescription('Czy chcesz zaktualizować kartotekę?')
      .setColor('#FFFF00');

    await message.reply({ embeds: [updateEmbed], components: [row], ephemeral: true });
  },

  async handleInteraction(interaction, client) {
    const [action, userId] = interaction.customId.split('-');

    if (action === 'createRecord' || action === 'updateRecord') {
      const modal = new ModalBuilder()
        .setCustomId(`createRecordModal-${userId}`)
        .setTitle('Załóż kartotekę');

      const categoryInput = new TextInputBuilder()
        .setCustomId('category')
        .setLabel('Wybierz kategorię')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ban,Unban,Obserwacja,Pochwała')
        .setRequired(true);

      const descriptionInput = new TextInputBuilder()
        .setCustomId('description')
        .setLabel('Opisz sytuację (co sie dzieje, jaka decyzja):')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(categoryInput),
        new ActionRowBuilder().addComponents(descriptionInput)
      );

      await interaction.showModal(modal);
    } else if (action === 'noCreateRecord' || action === 'noUpdateRecord') {
      await interaction.reply({ content: 'Spoko, W razie niejasności pytaj śmiało. :)', ephemeral: true });
    }
  },

  async handleModalSubmit(interaction, client) {
    const [action, userId] = interaction.customId.split('-');

    if (action === 'createRecordModal') {
      const db = loadDatabase();

      if (!db[userId]) {
        db[userId] = [];
      }

      const category = interaction.fields.getTextInputValue('category');
      const description = interaction.fields.getTextInputValue('description');
      const nick = interaction.user.tag;

      const newRecord = {
        date: new Date().toISOString(),
        category,
        description,
        nick,
        id: interaction.user.id
      };

      db[userId].push(newRecord);
      saveDatabase(db);

      const confirmEmbed = new EmbedBuilder()
        .setTitle('Kartoteka założona')
        .setDescription(`Kartoteka dla użytkownika ${userId} została założona.\n\nKategoria: ${category}\nOpis: ${description}`)
        .setColor('#00FF00');

      const confirmRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('confirmRecord')
            .setLabel('Ok')
            .setStyle(ButtonStyle.Success)
        );

      await interaction.reply({ embeds: [confirmEmbed], components: [confirmRow], ephemeral: true });

      client.on('interactionCreate', async (innerInteraction) => {
        if (!innerInteraction.isButton()) return;

        if (innerInteraction.customId === 'confirmRecord') {
          await innerInteraction.update({ content: 'Kartoteka została zaktualizowana.', components: [] });
        }
      });
    }
  }
};
