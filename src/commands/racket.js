import helpers from "../utils/helpers.js";
import sandbox from "../utils/sandbox.js";

export default {
  name: "racket",
  about: "Run your racket code, which should be in a single or multi-line codeblock." +
    "The `#lang racket/base` library is added at the top of your code for convenience.",
  usage: "$racket `your code`",
  callback: async ({ msg, logger, docker, body }) => {
      try {
        const code = helpers.extractCode(body);
        const codeWithLang = "#lang racket/base\n" + code;

        // Send 'In Progress' embed
        const responsePromise = msg.channel.send(helpers.makeRunning(code));
        
        const executionPromise = sandbox.run(docker, codeWithLang, process.env.RACKET_IMAGE_NAME, ".rkt");

        // Await for code to finish execution, and then delete in-progress message 
        // TODO: fix if this throws so the in progress message is changed
        const executionInfo = await executionPromise;
        (await responsePromise).delete();

        if (executionInfo.exitCode === 0) {
          await msg.channel.send(helpers.makeSuccessful(code, executionInfo));
        } else {
          await msg.channel.send(helpers.makeUnsuccessful(code, executionInfo));
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