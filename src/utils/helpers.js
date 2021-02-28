import discord from "discord.js";

class ParseError extends Error {
  constructor(message) {
    super(message);
    this.name = "ParseError";
  }
}

// TODO: this has to be tested
function parseCodeblock(content) {
  content = content.trim();

  if (content === "") {
    throw new ParseError("This command requires one argument, which should be a codeblock.");
  }

  // Check if code is in triple backticks
  if (content.substring(0, 3) === "```") {
    // Remove first three backticks
    content = content.substring(3);


    // Remove the language alias if it exists
    const isLetter = (s) => s.length === 1 && s.match(/[a-z]/i);
    let i = 0;

    while (isLetter(content.substring(i, i + 1))) {
      i++;
    }

    // If there is an alias given, there is a newline after it,
    // And the codeblock is not otherwise empty
    // Then remove the alias
    if (content.substring(0, i) !== ""
      && content.substring(i, i + 1) === '\n'
      && content.substring(i + 1, i + 2) !== '`') {
      // + 1 to remove the newline too
      content = content.substring(i + 1);
    }

    // Read code until a closing set of backticks is found
    // Discard the rest of the message
    let j = 0;
    while (true) {
      if (content.length === j) {
        throw new ParseError("Argument lacks closing triple backticks (```).");
      }

      if (content.substring(j, j + 3) === "```") {
        return content.substring(0, j);
      }

      j++;
    }
  }

  // Check if code is in single backticks
  if (content.substring(0, 1) === '`') {
    // Remove first backtick
    content = content.substring(1);

    // Read code until a closing backtick is found
    // Discard the rest of the message
    let i = 0;
    while (true) {
      if (content.length === i) {
        throw new ParseError("Argument lacks a closing backtick (`).");
      }

      if (content[i] === '`') {
        return content.substring(0, i);
      }

      i++;
    }
  }

  throw new ParseError("Argument needs to be wrapped in backticks (`).");
}

async function sendParseError(msg, error, logger) {
  try {
    const embed = new discord.MessageEmbed()
      .attachFiles(["./images/x.png"])
      .setColor("RED")
      // Called code extraction to distinguish from when the language is actually parsed
      .setTitle("Code Extraction Failed")
      .setThumbnail("attachment://x.png")
      .addFields(
        { name: "Issue", value: error, inline: true },
        { name: 'About Markdown', value: "https://support.discord.com/hc/en-us/articles/210298617" + 
          "-Markdown-Text-101-Chat-Formatting-Bold-Italic-Underline-", inline: true }
      )
      .setFooter("Try the '$help' command for more information.");

    await msg.channel.send(embed);
  } catch (error) {
   logger.error(error); 
  }
}

async function sendSuccess(msg, output, logger) {
  try {
    const embed = new discord.MessageEmbed()
      .attachFiles(["./images/check.png"])
      .setColor("GREEN")
      .setTitle("Successfully Exited")
      .setThumbnail("attachment://check.png")
      .addField("Output", "```" + output + "```");

    await msg.channel.send(embed);
  } catch {
    logger.error(error);
  }
}

export default { parseCodeblock, ParseError, sendParseError, sendSuccess };