export default {
  // Name means to call this command like '$ping'
  name: "ping",
  // About field used in the '$help' command
  about: "Checks if the bot is online.",
  // Usage field used in the '$help' command
  usage: "$ping",
  callback: async ({ msg, logger }) => {
    try {
      await msg.channel.send("🏸 pong! (Is using a racket cheating?)");
    } catch (error) {
      logger.log(error);
    }
  },
};