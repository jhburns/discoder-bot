import discord from "discord.js";

export default {
  name: "help",
  about: "Show this help dialog.",
  usage: "$help",
  callback: async ({ msg, logger, commands }) => {
    try {
      const embedStart = new discord.MessageEmbed()
        .setColor("LIGHT_GREY")
        .setTitle("Discoder Bot Help")

      const embedFields = commands.reduce((acc, cur) => {
        return acc.addFields(
          { name: "$" + cur.name, value: cur.about, inline: true },
          // Forces a two column layout
          { name: "\u200B", value: "\u200B", inline: true },
          // Zero width spaces used to prevent backticks inside the codeblock from being absorbed
          { name: "Usage", value: "```\u200B" + cur.usage + "\u200B```", inline: true },
        );
      }, embedStart);

      const embedExtra = embedFields.addFields(
          { name: "Language Reference: ", value: "https://racket-lang.org/" },
          { name: "Bot Source: ", value: "https://github.com/jhburns/discoder-bot" },
        )
        .setFooter("Tip: use the 'lisp' alias in codeblocks for highlighting.");

      await msg.channel.send(embedExtra);
    } catch (error) {
      logger.error(error);
    }
  },
};