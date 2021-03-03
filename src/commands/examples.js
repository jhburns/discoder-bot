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
          //{ name: "", value: "" },
          // Block-quote make using copyable codeblocks possible
          { name: "Hello World", value: "$racket \\`(display \"Hello World\")\\`" },
          {
            name: "Fibonacci", value:
              "$racket \\`\\`\\`scheme\n" +
              "(define (fib n)\n" +
              "\  (if (<= n 2)\n" +
              "    1\n" +
              "    (+ (fib (- n 1)) (fib (- n 2)))))\n" +
              "\n" +
              "(fib 30)" +
              "\\`\\`\\`" 
          },
        );

      await msg.channel.send(embed);
    } catch (error) {
      logger.error(error);
    }
  },
};