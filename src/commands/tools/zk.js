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
        const allowedRoles = [
            '1255314190944702525',
            '701862892315869320',
            '1257744956420788306',
            '1257745014067429386',
            '1257739543738581043',
            '1257744580682711152'
        ];
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
                .setDescription(`Użytkownik ${user.tag}, ID: ${userId} nie posiada kartoteki. Jeśli chcesz założyć kartotekę, wpisz komendę $kartoteka ID`)
                .setColor('#FF0000');

            return message.reply({ embeds: [embed], ephemeral: true });
        }

        const userRecords = db[userId];
        const embed = new EmbedBuilder()
            .setTitle(`Kartoteka użytkownika ${user.tag} (${userId})`)
            .setDescription('Użytkownik już jest wpisany w kartotece, oto wpisy:')
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
                    .setLabel('Edytuj')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`deleteRecord-${userId}`)
                    .setLabel('Usuń')
                    .setStyle(ButtonStyle.Danger)
            );

        await message.reply({ embeds: [embed], components: [row], ephemeral: true });
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
                .setPlaceholder('Ban, Unban, Obserwacja, Pochwała')
                .setRequired(true);

            const descriptionInput = new TextInputBuilder()
                .setCustomId('description')
                .setLabel('Opisz sytuację (co się dzieje, jaka decyzja):')
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
    },

    async handleUpdateRecord(interaction, client) {
        const [, userId] = interaction.customId.split('-');

        const db = loadDatabase();
        const userRecords = db[userId] || [];

        const modal = new ModalBuilder()
            .setCustomId(`updateRecordModal-${userId}`)
            .setTitle('Edycja wpisu')
            .setDescription('Wybierz wpis do edycji:');

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
    },

    async handleDeleteRecord(interaction, client) {
        const [, userId, indexStr] = interaction.customId.split('-');
        const index = parseInt(indexStr);

        let db = loadDatabase();
        const userRecords = db[userId] || [];

        if (index < 0 || index >= userRecords.length) {
            await interaction.reply({ content: 'Nieprawidłowy wpis do usunięcia.', ephemeral: true });
            return;
        }

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
    },

    async handleConfirmDelete(interaction, client) {
        const [, userId, indexStr] = interaction.customId.split('-');
        const index = parseInt(indexStr);

        let db = loadDatabase();
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
                    { name: 'Treść wpisu', value: deletedRecord.description }
                )
                .setColor('#FF0000');

            logChannel.send({ embeds: [logEmbed] });
        }
    },

    async handleEditRecord(interaction, client) {
        const [, userId, indexStr] = interaction.customId.split('-');
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
    },

    async handleModalSubmitEdit(interaction, client) {
        const [, userId, indexStr] = interaction.customId.split('-');
        const index = parseInt(indexStr);

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
};
