import helpers from "../utils/helpers.js";
import sandbox from "../utils/sandbox.js";

export default {
  name: "racket",
  about: `Run your racket code, which should be in a single or multi-line codeblock \
    . Code can run for at most ${process.env.CODE_TIMEOUT_SECONDS} seconds.`,
  usage: "$racket `your code`",
  callback: async ({ msg, logger, docker, body }) => {
      try {
        const code = helpers.parseCode(body);

        try {
          const stdout = await sandbox.run(docker, code);
          msg.channel.send(stdout);

        } catch (error) {
          logger.error(error);
        }
      } catch (error) {
        msg.channel.send(error.message);
      }
  },
};