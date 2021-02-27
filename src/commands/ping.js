export default {
  // Name means to call this command like '$ping'
  name: "ping",
  // About field is used in the '$help' command
  about: "Checks if the bot is online.",
  callback: async ({ msg, logger }) => {
    try {
      await msg.channel.send("🏸 pong! (Is using a racket cheating?)");
    } catch (error) {
      logger.log(error);
    }
  },
};