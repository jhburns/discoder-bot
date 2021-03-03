import discord from "discord.js";
import Dockerode from "dockerode";
import winston from "winston";
import tmpPromise from "tmp-promise";

// Register commands
import help from "./commands/help.js";
import ping from "./commands/ping.js";
import racket from "./commands/racket.js";
import examples from "./commands/examples.js";

const commands = [help, ping, racket, examples];

// Check if auth token exists
if (process.env.DISCORD_AUTH_TOKEN === undefined) {
  throw "Error: DISCORD_AUTH_TOKEN environment variable is unset.";
}

// Create folder for temporary files such as source code
tmpPromise.setGracefulCleanup(); // Cleanup resources on exit
const tempDir = tmpPromise.dirSync({ prefix: 'discoder-bot_' }); // Created in /tmp on Linux

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
  logger.info(`Registered commands: ${commands.map(c => '$' + c.name).join(", ")}.`);

  // Set status of help information
  client.user.setActivity("$help - https://racket-lang.org/")
    .then(presence => logger.info(`Activity set to '${presence.activities[0].name}'`))
    .catch(e => logger.info(e));
});

// Catch network errors, and unhandled errors
client.on('shardError', error => {
  logger.error("A websocket connection encountered an error: ", error);
});

process.on("unhandledRejection", error => {
  logger.error("Unhandled promise rejection:", error);
});

// Trigger when a message is received
client.on("message", msg => {
  // Ignore bots
  if (msg.author.bot) {
    return;
  }

  // Check if the message starts with an '$'
  if (msg.content.substring(0, 1) !== '$') {
    return;
  }

  // Remove the '!'
  const content = msg.content.substring(1);
  let currentName = "";
  let body = "";

  // Split the content into the command name, and body
  let i = 0;
  while (content.length > i && !content[i].match(/\s+/)) {
    i++;
  }

  currentName = content.substr(0, i);
  body = content.substr(i + 1);

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
      });
    }
  }
});

// Login
client.login(process.env.DISCORD_AUTH_TOKEN);