// In seconds
// If the timeouts are too close to each other,
// Then the hard one may randomly be done instead of soft
const hardTimeout = 22;
const softTimeout = 18;

// In MB
const memoryLimit = 150;
const swapLimit = 450;

async function evaluate(docker, image, ext, sourcePath) {  
  const container = await docker.createContainer({
    // Combine stdout and stderr into one stream
    Tty: true,
    Image: image,
    HostConfig: {
      // Source is mounted read-only
      Binds: [`${sourcePath}:/code/source${ext}:ro`],
      // Delete container after it terminates
      AutoRemove: true,
      // Prevent forkbombs
      PidsLimit: 256,
      // Container filesystem is also only read only
      ReadonlyRootfs: true,
      // 150 MB
      Memory: memoryLimit * 1000000,
      // 250 MB
      MemorySwap: swapLimit * 1000000,
      SecurityOpt: ["no-new-privileges:true"],
      CapDrop: ["ALL"],
      Privileged: false,
      // 1024 is the default 
      CpuShares: 256,
      // About 30% of a single core CPU
      CpuPeriod: 100000,
      CpuQuota: 30000
    },
    // Max number of columns discord will display a code block as
    Env: ["COLUMNS=56", `BOT_TIMEOUT=${softTimeout}`],
    NetworkDisabled: true,
  });

  const stream = await container.attach({ stream: true, stdout: true, stderr: true });

  // For timing code execution speed
  const startTime = process.hrtime();

  await container.start();

  // Start timeout
  const timeout = setTimeout(async () => {
    await container.kill();
  }, hardTimeout * 1000);

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
  clearTimeout(timeout);

  if (Error !== null) {
    throw Error;
  }

  return { output, exitCode, time: process.hrtime(startTime) };
}

export default { evaluate, softTimeout, memoryLimit, swapLimit };