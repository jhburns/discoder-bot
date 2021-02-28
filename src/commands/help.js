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
        .setURL("https://github.com/jhburns/discoder-bot");

      const embedFields = commands.reduce((acc, cur) => {
        return acc.addFields(
          { name: "$" + cur.name, value: cur.about, inline: true },
          // Forces a two column layout
          { name: "\u200B", value: "\u200B", inline: true },
          // Zero width spaces used to prevent backticks inside the codeblock from being absorbed
          { name: "Usage", value: `\`\`\`\u200B${cur.usage}\u200B\`\`\``, inline: true },
        );
      }, embedStart);

      const embedFooter = embedFields.addField("Racket help", "https://racket-lang.org/");

      await msg.channel.send(embedFooter);
    } catch (error) {
      logger.error(error);
    }
  },
};