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
      HostConfig: { Binds: [`${sourcePath}:/code/source${ext}:ro`] },
    });

    const stream = await container.attach({ stream: true, stdout: true, stderr: true });

    // For timing code execution speed
    const startTime = process.hrtime();

    await container.start();

    const stdout = await new Promise((resolve, reject) => {
      const chunks = [];

      stream.on('data', (chunk) => chunks.push(chunk))
      stream.on('end', () => resolve(Buffer.concat(chunks).toString("utf8")));
      stream.on('error', (error) => reject(error));
    });

    return { stdout, time: process.hrtime(startTime) };
  } finally {
    cleanup();
  }
}

export default { init, run };