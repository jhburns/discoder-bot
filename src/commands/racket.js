import helpers from "../utils/helpers.js";
import sandbox from "../utils/sandbox.js";

export default {
  name: "racket",
  about: "Run your racket code, which should be in a single or multi-line codeblock." +
    "The `#lang racket/base` library is added at the top of your code for convenience.",
  usage: "$racket `your code`",
  callback: async ({ msg, logger, docker, body }) => {
      try {
        const code = helpers.parseCodeblock(body);

        try {
          const stdout = await sandbox.run(docker, code);
          await msg.channel.send(helpers.makeSuccess(helpers.sanitizeOutput(stdout)));
        } catch (error) {
          logger.error(error);
        }
      } catch (error) {
        try {
          await msg.channel.send(helpers.makeParseError(error));
        } catch (error) {
          logger.error(error);
        } 
      }
  },
};