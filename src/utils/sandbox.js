import { promises as fs } from "fs";
import tmpPromise from "tmp-promise";

let tempDir = null;

// Cleanup all resources on process end
tmpPromise.setGracefulCleanup();

function init() {
  tempDir = tmpPromise.dirSync({ prefix: 'discoder-bot_' });
}

async function run(docker, code, image, ext) {  
  const { path: sourcePath, cleanup } = await tmpPromise.file(
    { dir: tempDir.name, postfix: ".tmp" }
  );

  try {
    await fs.writeFile(sourcePath, code);

    const container = await docker.createContainer({
      Tty: true,
      Image: image,
      // Source is mounted read-only
      HostConfig: {
        Binds: [`${sourcePath}:/code/source${ext}:ro`],
        AutoRemove: true,
        NetworkMode: "none",
      },
      // Max number of columns discord will display a code block as
      Env: ["COLUMNS=56"],
    });

    const stream = await container.attach({ stream: true, stdout: true, stderr: true });

    // For timing code execution speed
    const startTime = process.hrtime();

    await container.start();

    // Wait for the container to close the output stream
    // Since a pseudo-terminal is allocated, both stdout and stderr are combined
    const output = await new Promise((resolve, reject) => {
      const chunks = [];

      stream.on('data', (chunk) => chunks.push(chunk))
      stream.on('end', () => resolve(Buffer.concat(chunks).toString("utf8")));
      stream.on('error', (error) => reject(error));
    });

    // Wait for the container to terminate, so the get the exit code
    const { Error, StatusCode: exitCode } = await container.wait();
    if (Error !== null) {
      throw Error;
    }

    console.log(exitCode);

    return { output, exitCode, time: process.hrtime(startTime) };
  } finally {
    cleanup();
  }
}

export default { init, run };