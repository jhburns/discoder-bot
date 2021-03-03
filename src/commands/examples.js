import discord from "discord.js";

export default {
  name: "examples",
  about: "Show some example of Racket.",
  usage: "$examples",
  callback: async ({ msg, logger }) => {
    try {
      const embed = new discord.MessageEmbed()
        .setColor("LIGHT_GREY")
        .setTitle("Examples")
        .addFields(
          // Sadly discord strips whitespace from the front of the code,
          // And codeblocks can't be used in codeblocks
          { name: "Hello World", value: "$racket \\`(display \"Hello World\")\\`" },
          {
            name: "Fibonacci", value:
              "$racket \\`\\`\\`scheme\n" +
              "(define (fib n)\n" +
              "(if (<= n 2)\n" +
              "1\n" +
              "(+ (fib (- n 1)) (fib (- n 2)))))\n" +
              "\n" +
              "(fib 30)\n" +
              "\\`\\`\\`" 
          },
          {
            name: "Choose Language", value: "$run \\`\\`\\`scheme\n" +
              "#lang racket\n" +
              "(second (reverse (append (list 1 2 3) (list 4))))\n" +
              "\\`\\`\\`"
          }
        );

      await msg.channel.send(embed);
    } catch (error) {
      logger.error(error);
    }
  },
};