const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Funkcja do odczytu kartotek z pliku
const loadDatabase = () => {
    if (!fs.existsSync(path.resolve(__dirname, '../../../database.json'))) {
        return {};
    }
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../database.json')));
};

// Funkcja do zapisu kartotek do pliku
const saveDatabase = (db) => {
    fs.writeFileSync(path.resolve(__dirname, '../../../database.json'), JSON.stringify(db, null, 2));
};

module.exports = {
    name: 'zk',
    description: 'Edytuje kartotekę użytkownika.',
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

        const embed = new EmbedBuilder()
            .setTitle(`Edycja kartoteki użytkownika ${user.tag}`)
            .setDescription(`ID: ${userId}`)
            .setColor('#7289DA');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`updateRecord-${userId}`)
                    .setLabel('Aktualizuj wpis')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`deleteRecord-${userId}`)
                    .setLabel('Usuń wpis')
                    .setStyle(ButtonStyle.Danger)
            );

        await message.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
};
