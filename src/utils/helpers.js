import discord from "discord.js";
import sandbox from "./sandbox.js";

class CodeExtractionError extends Error {
  constructor(message) {
    super(message);
    this.name = "CodeExtractionError";
  }
}

// TODO: this has to be tested
function extractCode(content) {
  content = content.trim();

  if (content === "") {
    throw new CodeExtractionError("This command requires one argument, which should be a codeblock.");
  }

  // Check if code is in triple backticks
  if (content.substring(0, 3) === "```") {
    // Remove first three backticks
    content = content.substring(3);

    // Remove the language alias if it exists
    // Matches only lowercase letters, and numbers
    const isAlphanumeric = (s) => s.length === 1 && s.match(/[a-z0-9]/i);

    let i = 0;
    while (isAlphanumeric(content.substring(i, i + 1))) {
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
        throw new CodeExtractionError("Argument lacks closing triple backticks (```).");
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
        throw new CodeExtractionError("Argument lacks a closing backtick (`).");
      }

      if (content[i] === '`') {
        return content.substring(0, i);
      }

      i++;
    }
  }

  throw new CodeExtractionError("Argument needs to be wrapped in backticks (`).");
}

function sanitizeOutput(output) {
  if (output === "") {
    return ' ';
  }

  // Limit to 800 characters and 16 line-breaks
  let cropped = output.substring(0, 800).split('\n').slice(0, 16).join('\n');

  // Add ellipsis if output was shortened
  if (cropped.length < output.length) {
    cropped = cropped.substring(0, cropped.length - 3) + "...";
  }

  // Replace regular U+0060 grave accent marks with U+02CB version that Discord ignores
  return cropped.replace("```", "ˋˋˋ");
}

function makeSnippet(code) {
  if (code.trim() === "") {
    return "``` ```";
  }

  const maxLength = 30;
  const lines = code.split('\n');

  // Skip any empty lines
  const nonEmptyLines = lines.filter((l) => l.trim() !== "");

  // If all lines are empty return a plain codeblock
  if (nonEmptyLines.length === 0) {
    return "``` ```";
  } else {
    // Else return the first line, with 'scheme' alias
    let snippet = nonEmptyLines[0].substring(0, maxLength);

    if (code.length > maxLength) {
      snippet += "...";
    }

    // TODO, make this not language specific
    return "```scheme\n" + snippet + "```";
  }
}

function formatTime(time) {
  const timeFormatted = (time[0] + (time[1] / 1000000000)).toFixed(2);

  return `Approximate task time: ${timeFormatted} seconds.`;
}

function makeParseError(error) {
    return new discord.MessageEmbed()
      .attachFiles(["./images/x.png"])
      .setColor("RED")
      // Called code extraction to distinguish from when the language is actually parsed
      .setTitle("Code Extraction Failed")
      .setThumbnail("attachment://x.png")
      .addFields(
        { name: "Issue", value: error, inline: true },
        { name: 'Markdown Help', value: "https://support.discord.com/hc/en-us/articles/210298617" + 
          "-Markdown-Text-101-Chat-Formatting-Bold-Italic-Underline-", inline: true }
      )
      .setFooter("Try the '$help' command for more information.");
}

function makeRunning(code) {
  return new discord.MessageEmbed()
    .attachFiles(["./images/spinner.gif"])
    .setColor("BLUE")
    .setTitle("Running Code")
    .setThumbnail("attachment://spinner.gif")
    .addField("Snippet", makeSnippet(code))
    .setFooter("Tip: use the 'scheme' language in codeblocks for highlighting.");
}

function makeSuccessful(code, executionInfo) {
  // First index is seconds, second is nanoseconds

  return new discord.MessageEmbed()
    .attachFiles(["./images/check.png"])
    .setColor("GREEN")
    .setTitle("Exited Successfully")
    .setThumbnail("attachment://check.png")
    .addFields(
      { name: "Snippet", value: makeSnippet(code) }, 
      { name: "Output", value: "```" + sanitizeOutput(executionInfo.output) + "```" 
        + formatTime(executionInfo.time) },
    );
}

function makeUnsuccessful(code, executionInfo) {
  // Determine reason for exiting non-zero
  let reason = "";
  let isTerminated = false;
  switch (executionInfo.exitCode) {
    case 137:
      reason = "Code Killed";
      isTerminated = true;
      break;
    case 124:
      reason = "Code Stopped";
      isTerminated = true;
      break;
    default:
      reason = "Code Failed Normally";
      break;
  }

  const embed =  new discord.MessageEmbed()
    .attachFiles(["./images/x.png"])
    .setColor("RED")
    .setTitle("Exited Unsuccessfully")
    .setThumbnail("attachment://x.png")
    .addFields(
      { name: "Snippet", value: makeSnippet(code) },
      { name: reason + ` (Exit Code ${executionInfo.exitCode})`, 
        value: "```" + sanitizeOutput(executionInfo.output) + "```" + formatTime(executionInfo.time) },
    );

  if (isTerminated) {
    embed.setFooter("Sorry, your code was likely terminated due to timing out or running out of memory. " +
      `It can run for at most ${sandbox.hardTimeout} seconds, ` + 
      `and use at most ${sandbox.swapLimit} MB.`);
  }

  return embed;
}

function makeRateLimited() {
  return new discord.MessageEmbed()
    .attachFiles(["./images/x.png"])
    .setColor("RED")
    .setTitle("Sorry, Try Again Later")
    .setThumbnail("attachment://x.png")
    .addField("You Have Been Rate Limited", "Unfortunately, due to resource restrictions each user can " +
       "only have one code snippet executing at a time. Wait until your other code is done, then retry.");
}

export default {
  CodeExtractionError,
  extractCode,
  makeSuccessful,
  makeUnsuccessful,
  makeParseError,
  makeRunning,
  sanitizeOutput,
  makeRateLimited,
};