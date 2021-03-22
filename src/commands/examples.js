export default {
  name: "examples",
  about: "Show some examples of Racket.",
  usage: "$examples",
  callback: async ({ msg, logger }) => {
    try {
      // Discord embeds don't allow leading  whitespace
      // Which is needed to indent code properly
      // So a normal message is sent instead
      const examples = [
          { title: "Hello World", value: "> $racket \\`(display \"Hello World\")\\`" },
          {
            title: "Fibonacci",
            value:
              "> $racket \\`\\`\\`scheme\n" +
              "> (define (fib n)\n" +
              "> _ _ (if (<= n 2)\n" +
              "> _ _   1\n" +
              "> _ _   (+ (fib (- n 1)) (fib (- n 2)))))\n" +
              "> \n" +
              "> (fib 30) ; Racket prints the last expression automatically\n" +
              "> \\`\\`\\`" 
          },
          {
            title: "Choose Language",
            value:
              "> $run \\`\\`\\`scheme\n" +
              "> #lang racket\n" +
              "> (second (reverse (append (list 1 2 3) (list 4))))\n" +
              "> \\`\\`\\`"
          },
        ];

      const body = "**Examples**\n\n" + examples.reduce((acc, example) => {
        return `${acc}${example.title}\n${example.value}\n\n`;
      }, "");

      await msg.channel.send(body);
    } catch (error) {
      logger.error(error);
    }
  },
};