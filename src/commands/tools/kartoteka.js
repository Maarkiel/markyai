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
    async handleInteraction(interaction, client) {
        const [action, userId] = interaction.customId.split('-');

        if (action === 'updateRecord') {
            const modal = new ModalBuilder()
                .setCustomId(`updateRecordModal-${userId}`)
                .setTitle('Aktualizacja wpisu')
                .setDescription('Wybierz wpis do aktualizacji:');

            const db = loadDatabase();
            const userRecords = db[userId] || [];

            userRecords.forEach((record, index) => {
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`editRecord-${userId}-${index}`)
                            .setLabel(`#${index + 1}`)
                            .setStyle(ButtonStyle.Primary)
                    )
                );
            });

            await interaction.showModal(modal);
        } else if (action.startsWith('editRecord')) {
            const [, userId, indexStr] = action.split('-');
            const index = parseInt(indexStr);

            const db = loadDatabase();
            const userRecords = db[userId] || [];

            if (index < 0 || index >= userRecords.length) {
                await interaction.reply({ content: 'Nieprawidłowy wpis do edycji.', ephemeral: true });
                return;
            }

            const record = userRecords[index];

            const editModal = new ModalBuilder()
                .setCustomId(`editRecordModal-${userId}-${index}`)
                .setTitle(`Edycja wpisu #${index + 1}`)
                .setDescription(`Data: ${record.date}\nNick: ${record.nick}\nID: ${record.id}\nKategoria: ${record.category}\nOpis: ${record.description}`);

            const categoryInput = new TextInputBuilder()
                .setCustomId('category')
                .setLabel('Nowa kategoria')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(record.category)
                .setRequired(false);

            const descriptionInput = new TextInputBuilder()
                .setCustomId('description')
                .setLabel('Nowy opis')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder(record.description)
                .setRequired(false);

            editModal.addComponents(
                new ActionRowBuilder().addComponents(categoryInput),
                new ActionRowBuilder().addComponents(descriptionInput)
            );

            await interaction.showModal(editModal);
        } else if (action.startsWith('deleteRecord')) {
            const [, userId, indexStr] = action.split('-');
            const index = parseInt(indexStr);

            let db = loadDatabase();
            const userRecords = db[userId] || [];

            if (index < 0 || index >= userRecords.length) {
                await interaction.reply({ content: 'Nieprawidłowy wpis do usunięcia.', ephemeral: true });
                return;
            }

            // Usunięcie wpisu
            userRecords.splice(index, 1);
            saveDatabase(db);

            await interaction.reply({ content: `Wpis #${index + 1} został usunięty.`, ephemeral: true });
        }
    },

    async handleModalSubmit(interaction, client) {
        const [action, userId, indexStr] = interaction.customId.split('-');

        if (action === 'editRecordModal') {
            const index = parseInt(indexStr);
            const db = loadDatabase();
            const userRecords = db[userId] || [];

            if (index < 0 || index >= userRecords.length) {
                await interaction.reply({ content: 'Nieprawidłowy wpis do edycji.', ephemeral: true });
                return;
            }

            const category = interaction.fields.getTextInputValue('category') || userRecords[index].category;
            const description = interaction.fields.getTextInputValue('description') || userRecords[index].description;

            // Aktualizacja wpisu
            userRecords[index].category = category;
            userRecords[index].description = description;
            saveDatabase(db);

            await interaction.reply({ content: `Wpis #${index + 1} został zaktualizowany.`, ephemeral: true });
        }
    }
};
