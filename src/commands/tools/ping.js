const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ping',
    description: 'Pokaż mojego pinga!',
    execute(message, args, client) {
        console.log(`Komenda 'ping' została wywołana przez użytkownika ${message.author.tag}.`);

        // IDs ról, które mają mieć dostęp do komendy
        const allowedRoles = [
            '1255314190944702525',
            '701862892315869320',
            '1257744956420788306',
            '1257745014067429386',
            '1257739543738581043',
            '1257744580682711152'
        ];

        // Sprawdzenie, czy użytkownik ma jedną z wymaganych ról
        const hasRole = message.member.roles.cache.some(role => allowedRoles.includes(role.id));
        console.log('Has role:', hasRole);

        if (!hasRole) {
            console.log(`Użytkownik ${message.author.tag} nie ma wymaganych ról (Moderator lub Administrator).`);
            return message.reply('Halo, halo! Dostępów Ci się tak szybko zachciało? :)');
        }

        try {
            // Odpowiedź, że bot oblicza ping
            message.channel.send('Obliczanie ping...').then(reply => {
                // Oblicz ping bota
                const clientPing = client.ws.ping;

                // Oblicz ping użytkownika
                const userPing = reply.createdTimestamp - message.createdTimestamp;

                // Skonstruuj wiadomość z wynikiem
                const embed = new EmbedBuilder()
                    .setTitle('Pingi')
                    .addFields(
                        { name: 'Ping bota', value: `${clientPing}ms`, inline: true },
                        { name: 'Ping użytkownika', value: `${userPing}ms`, inline: true }
                    )
                    .setColor('#7289DA');

                // Edytuj odpowiedź na oryginalną wiadomość
                reply.edit({ content: ' ', embeds: [embed] });
            });
        } catch (error) {
            console.error('Wystąpił błąd podczas wykonywania komendy ping:', error);
            message.reply('Wystąpił błąd podczas wykonywania tej komendy!');
        }
    },
};
