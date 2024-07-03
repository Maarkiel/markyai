const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ban',
    description: 'Banuje użytkownika z serwera.',
    async execute(message, args, client) {
        const allowedRoles = ['1255314190944702525', '701862892315869320', '1257744956420788306', '1257745014067429386', '1257739543738581043', '1257744580682711152'];

        const hasRole = message.member.roles.cache.some(role => allowedRoles.includes(role.id));
        if (!hasRole) {
            return message.reply('Halo, halo! Dostępów Ci się tak szybko zachciało? :)');
        }

        const userId = args[0];
        const reason = args.slice(1).join(' ');
        if (!userId) {
            return message.reply('Musisz podać ID użytkownika. Pamiętaj o trybie deweloperskim discorda.');
        }
        if (!reason) {
            return message.reply('Musisz podać powód. Pamiętaj, aby opisac go w sposób zwięzły i zrozumiały.');
        }

        const user = await client.users.fetch(userId).catch(() => null);
        if (!user) {
            return message.reply('Nie znaleziono użytkownika o podanym ID. Na pewno to istniejący użytkownik discorda?');
        }

        try {
            const member = await message.guild.members.fetch(user.id).catch(() => null);
            if (member) {
                const protectedRoles = ['194143684281892864', '701862892315869320', '184021512813019136', '1254001800474791996']; // Zamień na prawdziwe ID ról
                const hasProtectedRole = member.roles.cache.some(role => protectedRoles.includes(role.id));
                if (hasProtectedRole) {
                    return message.reply('Nie możesz zbanować użytkownika z Sowity Family.');
                }
                await member.ban({ reason });
            } else {
                await message.guild.members.ban(userId, { reason });
            }
        } catch (err) {
            return message.reply('Wystąpił błąd podczas banowania użytkownika.');
        }

        try {
            await user.send(`Hej!\n\nZostałeś właśnie zbanowany ze społeczności! Miejmy nadzieję, że ban nie będzie pernamentnym.\n\nMożesz spróbować odwołać się od decyzji Zespołu na serwerze pod linkiem:\n\nPowodzenia!`);
        } catch (err) {
            console.error(`Nie udało się wysłać wiadomości do użytkownika ${user.tag} (${user.id}).`, err);
        }

        const embed = new EmbedBuilder()
        .setTitle('Sowite zbanowanie sowitej społeczności')
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: 'Użytkownik:', value: `${user.tag} (${user.id})`, inline: false },
            { name: '\u200B', value: '\u200B', inline: false }, // Pusta linia
            { name: 'Odpowiedzialny:', value: `${message.author.tag} (${message.author.id})`, inline: true },
            { name: 'Powód odbanowania:', value: reason, inline: true },
            { name: '\u200B', value: '\u200B', inline: false }, // Pusta linia
            { name: 'Serwery na które użytkownik może wrócić:', value: `${message.guild.name}`, inline: true },
            { name: 'Serwer, na którym wykonano komendę:', value: `${message.guild.name}`, inline: true },
            { name: 'Kanał, na którym wykonano komendę:', value: `<#${message.channel.id}>`, inline: true }
        )
        .setFooter({ text: `Komendę wykonano przez ${message.author.tag} ID: (${message.author.id})` })
            .setColor('#FF0000');

        // Wyślij embed do dedykowanego kanału ban-log
        const logChannel = client.channels.cache.get('1254456449657081917'); // Zmień na właściwe ID kanału ban-log
        if (logChannel) {
            logChannel.send({ embeds: [embed] });
        } else {
            console.error('Nie znaleziono kanału ban-log');
        }

        // Wyślij prosty komunikat do aktualnego kanału
        message.channel.send(`Użytkownik ${user.tag} (${user.id}) został zbanowany z Sowitej Społeczności. Powód: ${reason}`);
    },
};
