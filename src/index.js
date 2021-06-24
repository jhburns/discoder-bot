import discord from "discord.js";
import Dockerode from "dockerode";
import winston from "winston";
import tmpPromise from "tmp-promise";
import rateLimit from "./utils/rateLimit.js"

// Register commands
import help from "./commands/help.js";
import ping from "./commands/ping.js";
import racket from "./commands/racket.js";
import examples from "./commands/examples.js";
import run from "./commands/run.js";
import packages from "./commands/packages.js"
import exe from "./commands/exe.js"

const commands = [help, ping, racket, examples, run, packages, exe];

// Check if auth token exists
if (process.env.DISCORD_AUTH_TOKEN === undefined) {
  throw "Error: DISCORD_AUTH_TOKEN environment variable is unset.";
}

// Create folder for temporary files such as source code
tmpPromise.setGracefulCleanup(); // Cleanup resources on exit
const tempDir = tmpPromise.dirSync({ prefix: 'discoder-bot_' }); // Created in /tmp on Linux

// Create UsingSet so all commands share the same info
const usingSet = new rateLimit.UsingSet();

// Configure logger settings
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple(),
  ),
  transports: [
    new winston.transports.Console(),
  ]
});

// Connect to docker socket
const docker = new Dockerode({ socketPath: "/var/run/docker.sock" });

// Initialize discord bot
const client = new discord.Client();

// Print ready info
client.on("ready", () => {
  logger.info(`Logged in as ${client.user.tag}!`);
  logger.info(`Registered commands: ${commands.map(c => c.name).join(", ")}.`);

  // Set status of help information
  client.user.setActivity("help - racket-lang.org")
    .then(presence => logger.info(`Activity set to '${presence.activities[0].name}'`))
    .catch(e => logger.info(e));
});

// Catch network errors, and unhandled errors
client.on('shardError', (error) => {
  logger.error("A websocket connection encountered an error: ", error);
});

process.on("unhandledRejection", (error) => {
  logger.error("Unhandled promise rejection:", error);
});

// Trigger when a message is received
client.on("message", async (msg) => {
  // Ignore bots
  if (msg.author.bot) {
    return;
  }

  const integrationRole = msg.guild.roles.cache.find((role) => role.name === client.user.username);

  // Ignore if this bot is not mentioned, or its integrated role is mentioned
  if (!(msg.mentions.has(client.user.id) || msg.mentions.roles.has(integrationRole.id))) {
    return;
  }

  // Remove zero-width spaces that may exist due to copying examples
  const content = msg.content.replace('\u200B', "");

  for (const idString of [`<@!${client.user.id}>`, `<@&${integrationRole.id}>`]) {

    if (content.startsWith(idString)) {
      // Remove bot mention
      const noMention = content.substring(idString.length).trimStart();
      let currentName = "";
      let body = "";

      // Split the content into the command name, and body
      let i = 0;
      while (noMention.length > i && !noMention[i].match(/\s+/)) {
        i++;
      }

      currentName = noMention.substr(0, i).replace('\u200B', "");
      body = noMention.substr(i + 1);

      // Check if any command matches the name
      // And if so, call its callback
      for (const command of commands) {
        if (currentName === command.name) {
          const _ignorePromise = command.callback({
            msg,
            client,
            logger,
            commands,
            body,
            commands,
            docker,
            tempDir,
            usingSet,
          });

          return;
        }
      }

      // If not command was found, return error
      const embed = new discord.MessageEmbed()
        .attachFiles(["./images/x.png"])
        .setColor("RED")
        .setTitle("Command Not Recognized")
        .setThumbnail("attachment://x.png")
        .addField(
          `No command \`${currentName}\` found.`,
          "Trying the command `help` to see a list of possible commands."
        );

      await msg.channel.send(embed);
    }
  }

});

// Login
client.login(process.env.DISCORD_AUTH_TOKEN);