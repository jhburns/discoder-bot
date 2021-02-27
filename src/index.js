import discord from "discord.js";
import dotenv from "dotenv";
import winston from "winston";

import ping from "./commands/ping.js";

// Register commands
const commands = [ping];

// Load .env file,
// DISCORD_AUTH_TOKEN can also be set in the environment
dotenv.config();

if (process.env.DISCORD_AUTH_TOKEN === undefined) {
  throw "Error: DISCORD_AUTH_TOKEN environment variable is unset.";
}

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

// Initialize discord bot
const client = new discord.Client();
const sigil = "$";

// Print ready info
client.on("ready", () => {
  logger.info(`Logged in as ${client.user.tag}!`);
  logger.info(`Registered commands: ${commands.map(c => sigil + c.name).join()}.`);

  // Set status of help information
  client.user.setActivity("$help - https://racket-lang.org/")
    .then(presence => logger.info(`Activity set to '${presence.activities[0].name}'`))
    .catch(e => logger.info(e));
});

// Catch network errors, and unhandled errors
client.on('shardError', error => {
  logger.error("A websocket connection encountered an error: " + error);
});

process.on("unhandledRejection", error => {
  logger.error("Unhandled promise rejection:" + error);
});

// Trigger when a message is received
client.on("message", msg => {
  // Ignore bots
  if (msg.author.bot) {
    return;
  }

  // Check if the message starts with an '$'
  if (msg.content.substring(0, 1) !== sigil) {
    return;
  }

  // Remove the '!'
  const content = msg.content.substring(1);
  const splitContent = content.split(' ');
  let currentName = "";

  // Check a command name exists, and update currentName if it does
  if (splitContent.length > 0) {
    currentName = splitContent[0].toLowerCase();
    splitContent.shift();
  }

  const parsedContent = splitContent.join(' ');

  // Check if any command matches the name
  // And if so, call its callback
  for (const command of commands) {
    if (currentName === command.name) {
      const _ignorePromise = command.callback({ msg, client, logger, commands, parsedContent });
    }
  }
});

// Login
client.login(process.env.DISCORD_AUTH_TOKEN);