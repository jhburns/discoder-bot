import helpers from "../utils/helpers.js";
import sandbox from "../utils/sandbox.js";
import help from "./help.js";

export default {
  name: "racket",
  about: `Run your racket code, which should be in a single or multi-line codeblock.\
    Code can run for at most ${process.env.CODE_TIMEOUT_SECONDS} seconds.`,
  usage: "$racket `your code`",
  callback: async ({ msg, logger, docker, body }) => {
      try {
        const code = helpers.parseCodeblock(body);

        try {
          const stdout = await sandbox.run(docker, code);
          await helpers.sendSuccess(msg, stdout);
        } catch (error) {
          logger.error(error);
        }
      } catch (error) {
        helpers.sendParseError(msg, error, logger);
      }
  },
};