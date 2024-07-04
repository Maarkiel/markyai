module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        console.log('interactionCreate event triggered'); // Log na początku

        try {
            if (interaction.isButton()) {
                const [action] = interaction.customId.split('-');
                console.log(`Button interaction: ${action}`); // Log przy przycisku

                if (action === 'createRecord' || action === 'updateRecord' || action === 'editRecord' || action === 'deleteRecord') {
                    const kartoteka = require('../../commands/tools/kartoteka'); // Poprawiona ścieżka
                    await kartoteka.handleInteraction(interaction, client);
                } else if (action === 'noCreateRecord' || action === 'noUpdateRecord') {
                    await interaction.reply({ content: 'Spoko, W razie niejasności pytaj śmiało. :)', ephemeral: true });
                } else if (action.startsWith('confirmDelete')) {
                    const zk = require('../../commands/tools/zk'); // Poprawiona ścieżka
                    await zk.handleConfirmDelete(interaction, client);
                } else if (action.startsWith('cancelDelete')) {
                    const zk = require('../../commands/tools/zk'); // Poprawiona ścieżka
                    await zk.handleInteraction(interaction, client);
                }
            } else if (interaction.isModalSubmit()) {
                const [action] = interaction.customId.split('-');
                console.log(`Modal interaction: ${action}`); // Log przy modal

                if (action === 'createRecordModal' || action === 'editRecordModal') {
                    const kartoteka = require('../../commands/tools/kartoteka'); // Poprawiona ścieżka
                    await kartoteka.handleModalSubmit(interaction, client);
                } else if (action === 'editRecordModal') {
                    const zk = require('../../commands/tools/zk'); // Poprawiona ścieżka
                    await zk.handleModalSubmit(interaction, client);
                }
            }
        } catch (error) {
            console.error('Error handling interaction:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Wystąpił błąd podczas obsługi interakcji.', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Wystąpił błąd podczas obsługi interakcji.', ephemeral: true });
            }
        }
    }
};
