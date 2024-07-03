const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: 'panel',
  description: 'Otwiera panel zarządzania z przyciskami dla moderatorów i adminów.',
  async execute(message, args, client) {
    const allowedRoles = ['1255314190944702525', '701862892315869320', '1257744956420788306', '1257745014067429386', '1257739543738581043', '1257744580682711152'];

    const hasRole = message.member.roles.cache.some(role => allowedRoles.includes(role.id));
    if (!hasRole) {
      return message.reply({ content: 'Nie masz uprawnień do używania tej komendy.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(`Cześć, ${message.member.displayName}!`)
      .setDescription('Wybierz odpowiedni panel poniżej.')
      .setColor('#00FF00');

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`teamPanel-${message.author.id}`)
          .setLabel('Panel Zespołu')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`userPanel-${message.author.id}`)
          .setLabel('Panel Użytkownika')
          .setStyle(ButtonStyle.Secondary)
      );

    await message.reply({ embeds: [embed], components: [row], ephemeral: true });
  },

  async handleInteraction(interaction, client) {
    const [action, userId] = interaction.customId.split('-');

    if (interaction.user.id !== userId) {
      return interaction.reply({ content: 'Nie masz uprawnień do tej interakcji.', ephemeral: true });
    }

    if (action === 'teamPanel') {
      await interaction.deferReply({ ephemeral: true });
      await interaction.editReply({ content: 'Otwieram Panel Zespołu...' });
      // Logika dla Panelu Zespołu
    } else if (action === 'userPanel') {
      await interaction.reply({ content: 'Proszę, podaj ID użytkownika, którego chcesz sprawdzić.', ephemeral: true });

      const filter = response => response.author.id === interaction.user.id;
      const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });

      const userId = collected.first().content;

      try {
        console.log(`Fetching user with ID: ${userId}`);
        const user = await client.users.fetch(userId);

        if (!user) {
          console.error(`Nie znaleziono użytkownika o podanym ID: ${userId}`);
          return interaction.followUp({ content: 'Nie znaleziono użytkownika o podanym ID.', ephemeral: true });
        }

        console.log(`Fetched user: ${user.tag} (${user.id})`);

        const guildMember = await interaction.guild.members.fetch(user.id).catch((err) => {
          console.error(`Błąd podczas pobierania danych członka gildii: ${err}`);
          return null;
        });
        const joinedAt = guildMember ? guildMember.joinedAt : 'N/A';
        const createdAt = user.createdAt;

        const embed = new EmbedBuilder()
        .setTitle('Informacje o użytkowniku')
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: 'Nick', value: user.tag, inline: true },
          { name: 'ID', value: user.id, inline: true },
          { name: 'Data dołączenia do Discorda', value: createdAt.toDateString(), inline: true },
          { name: 'Data dołączenia do serwera', value: joinedAt !== 'N/A' ? joinedAt.toDateString() : 'N/A', inline: true },
          { name: 'Historia banów', value: 'Brak danych', inline: false },  // Dodajemy pole Historia banów
          { name: 'Historia timeoutów', value: 'Brak danych', inline: false },  // Dodajemy pole Historia timeoutów
          { name: 'Kartoteka', value: 'Brak danych', inline: false }  // Dodajemy pole Kartoteka
        )
        .setColor('#00FF00');

        await interaction.followUp({ embeds: [embed], ephemeral: true });

      } catch (error) {
        console.error(`Błąd podczas pobierania danych użytkownika: ${error}`);
        return interaction.followUp({ content: 'Wystąpił błąd podczas pobierania danych użytkownika.', ephemeral: true });
      }
    }
  }
};
