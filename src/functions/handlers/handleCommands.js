const fs = require("fs");

module.exports = (client) => {
  client.handleCommands = async () => {
    const commandsFolders = fs.readdirSync("./src/commands");
    for (const folder of commandsFolders) {
      const commandsFiles = fs
        .readdirSync(`./src/commands/${folder}`)
        .filter((file) => file.endsWith(".js"));

      for (const file of commandsFiles) {
        const command = require(`../../commands/${folder}/${file}`);
        console.log(`Rejestrowanie komendy: ${command.name}`);
        client.commands.set(command.name, command);
      }
    }
  };
};
