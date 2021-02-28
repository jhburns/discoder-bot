class ParseError extends Error {
  constructor(message) {
    super(message);
    this.name = "ParseError";
  }
}

// TODO: this has to be tested 
function parseCode(content) {
  content = content.trim();

  if (content === "") {
    throw new ParseError("This command requires an argument, which should be a codeblock.");
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

export default { parseCode, ParseError };