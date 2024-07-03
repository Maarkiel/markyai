const fs = require("fs");
const path = require("path");

module.exports = (client) => {
  client.handleCommands = async () => {
    const commandsFolders = fs.readdirSync(path.resolve(__dirname, "../../commands"));
    for (const folder of commandsFolders) {
      const commandsFiles = fs
        .readdirSync(path.resolve(__dirname, `../../commands/${folder}`))
        .filter((file) => file.endsWith(".js"));

      for (const file of commandsFiles) {
        const command = require(path.resolve(__dirname, `../../commands/${folder}/${file}`));
        console.log(`Rejestrowanie komendy: ${command.name}`);
        client.commands.set(command.name, command);
      }
    }
  };
};
