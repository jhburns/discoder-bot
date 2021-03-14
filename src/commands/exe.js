import helpers from "../utils/helpers.js";
import sandbox from "../utils/sandbox.js";
import tmpPromise from "tmp-promise";
import { promises as fs } from "fs";

export default {
  name: "exe",
  about: "Compile your racket code, then run it. " +
    "The `#lang racket/base` library is added at the top of your code for convenience.",
  usage: "$exe `your code`",
  callback: async ({ msg, logger, docker, body, tempDir }) => {
    try {
      const code = helpers.extractCode(body);

      const { path: sourcePath, cleanup: sourceCleanup, fd: _fd } = await tmpPromise.file(
        { dir: tempDir.name, prefix: "racket", postfix: ".tmp" }
      );

      try {
        await fs.writeFile(sourcePath, "#lang racket/base\n" + code);

        // Send 'In Progress' embed, and start the sandbox concurrently
        const responsePromise = msg.channel.send(helpers.makeRunning(code));

        const executionPromise = sandbox.evaluate(
          docker,
          process.env.RACKET_IMAGE_NAME,
          ".rkt",
          sourcePath,
          {
            // Include a tmpfs mount at '/code/writeable'
            isWriteable: true,
            // Override default CMD, uses 'sh -c' to combine commands
            cmd: ["sh", "-c", "raco exe -o /code/writeable/source source.rkt && /code/writeable/source"],
          },
        );

        // Await for code to finish execution, and then delete in-progress message 
        const executionInfo = await executionPromise;
        (await responsePromise).delete();

        // Send different embed based on whether the process exit successfully or not
        if (executionInfo.exitCode === 0) {
          await msg.channel.send(helpers.makeSuccessful(code, executionInfo));
        } else {
          await msg.channel.send(helpers.makeUnsuccessful(code, executionInfo));
        }
      } finally {
        sourceCleanup();
      }
    } catch (error) {
      if (error instanceof helpers.CodeExtractionError) {
        try {
          await msg.channel.send(helpers.makeParseError(error.message));
        } catch (error) {
          logger.error(error);
        }
      } else {
        logger.error(error);
      }
    }
  },
};