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
    name: 'zk',
    description: 'Zarządza kartoteką użytkownika.',
    async execute(message, args, client) {
        const userId = args[0];
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
                .setDescription(`Użytkownik ${user.tag}, ID: ${userId} nie posiada kartoteki. Jeśli chcesz założyć kartotekę wpisz komendę $kartoteka ID`)
                .setColor('#FF0000');

            return message.reply({ embeds: [embed], ephemeral: true });
        }

        const userRecords = db[userId];
        const components = [];

        userRecords.forEach((record, index) => {
            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`editRecord-${userId}-${index}`)
                    .setLabel(`Edytuj #${index + 1}`)
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`deleteRecord-${userId}-${index}`)
                    .setLabel(`Usuń #${index + 1}`)
                    .setStyle(ButtonStyle.Danger)
            );
            components.push(actionRow);
        });

        await message.reply({ content: 'Otwieram kartotekę...', ephemeral: true });
        await message.author.send({ content: 'Proszę wybrać akcję:', components: components });
    },

    async handleInteraction(interaction, client) {
        const [action, userId, indexStr] = interaction.customId.split('-');
        const index = parseInt(indexStr);

        if (action.startsWith('editRecord')) {
            const db = loadDatabase();
            const userRecords = db[userId] || [];

            if (index < 0 || index >= userRecords.length) {
                await interaction.reply({ content: 'Nieprawidłowy wpis do edycji.', ephemeral: true });
                return;
            }

            const record = userRecords[index];

            const editModal = new ModalBuilder()
                .setCustomId(`editRecordModal-${userId}-${index}`)
                .setTitle(`Edycja wpisu #${index + 1}`);

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
            const confirmationEmbed = new EmbedBuilder()
                .setTitle('Usuwanie wpisu')
                .setDescription('Czy na pewno chcesz usunąć ten wpis?')
                .setColor('#FF0000');

            const confirmationRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`confirmDelete-${userId}-${index}`)
                        .setLabel('Tak')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`cancelDelete-${userId}-${index}`)
                        .setLabel('Nie')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.reply({ embeds: [confirmationEmbed], components: [confirmationRow], ephemeral: true });
        } else if (action.startsWith('confirmDelete')) {
            const db = loadDatabase();
            const userRecords = db[userId] || [];

            if (index < 0 || index >= userRecords.length) {
                await interaction.reply({ content: 'Nieprawidłowy wpis do usunięcia.', ephemeral: true });
                return;
            }

            const deletedRecord = userRecords.splice(index, 1);
            saveDatabase(db);

            await interaction.reply({ content: `Wpis #${index + 1} został usunięty.`, ephemeral: true });

            const logChannel = client.channels.cache.get('1258023123031429243');
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('Usunięcie wpisu kartoteki')
                    .addFields(
                        { name: 'Numer wpisu', value: `#${index + 1}`, inline: true },
                        { name: 'Użytkownik', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                        { name: 'Treść wpisu', value: deletedRecord[0].description }
                    )
                    .setColor('#FF0000');

                logChannel.send({ embeds: [logEmbed] });
            }
        } else if (action.startsWith('cancelDelete')) {
            await interaction.reply({ content: 'Ok. Nie usuwam. Po co zawracasz mi łeb? Wpisz inną komendę bo tutaj nie będę już dyskutował.', ephemeral: true });
        }
    },

    async handleModalSubmit(interaction, client) {
        const [action, userId, indexStr] = interaction.customId.split('-');
        const index = parseInt(indexStr);

        if (action === 'editRecordModal') {
            const db = loadDatabase();
            const userRecords = db[userId] || [];

            if (index < 0 || index >= userRecords.length) {
                await interaction.reply({ content: 'Nieprawidłowy wpis do edycji.', ephemeral: true });
                return;
            }

            const category = interaction.fields.getTextInputValue('category') || userRecords[index].category;
            const description = interaction.fields.getTextInputValue('description') || userRecords[index].description;

            const oldDescription = userRecords[index].description;

            userRecords[index].category = category;
            userRecords[index].description = description;
            saveDatabase(db);

            await interaction.reply({ content: `Wpis #${index + 1} został zaktualizowany.`, ephemeral: true });

            const logChannel = client.channels.cache.get('1258023123031429243');
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('Edycja wpisu kartoteki')
                    .addFields(
                        { name: 'Numer wpisu', value: `#${index + 1}`, inline: true },
                        { name: 'Użytkownik', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                        { name: 'Treść przed edycją', value: oldDescription },
                        { name: 'Treść po edycji', value: description }
                    )
                    .setColor('#FFFF00');

                logChannel.send({ embeds: [logEmbed] });
            }
        }
    }
};
