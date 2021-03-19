import sandbox from "../utils/sandbox.js";
import tmpPromise from "tmp-promise";
import { promises as fs } from "fs";
import discord from "discord.js";

export default {
  name: "packages",
  about: "List Racket packages installed.",
  usage: "$packages",
  callback: async ({ msg, logger, docker, tempDir }) => {
    try {
      // Executes code to display the 'info.rkt' file
      const code = 
        "#lang racket/base\n" +
        "\n" +
        "(with-input-from-file \"info.rkt\"\n" +
        "  (lambda ()\n" +
        "    (for ([line (in-lines)])\n" +
        "      (displayln line))))\n";

      const { path: sourcePath, cleanup: sourceCleanup, fd: _fd } = await tmpPromise.file(
        { dir: tempDir.name, prefix: "run", postfix: ".tmp", mode: 0o555 }
      );
      try {
        await fs.writeFile(sourcePath, code);

        const executionInfo = await sandbox.evaluate(
          docker, process.env.RUNTIME_IMAGE_NAME, ".rkt", sourcePath
        );

        const embed = new discord.MessageEmbed()
          .setColor("LIGHT_GREY")
          .setTitle("Installed Packages")
          .addField("Displaying 'info.rkt'", "```scheme\n" + executionInfo.output + "```");

        await msg.channel.send(embed);
      } finally {
        sourceCleanup();
      }

    } catch (error) {
      logger.error(error);
    }
  },
};