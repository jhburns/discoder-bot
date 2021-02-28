async function run(docker, code) {
  const container = await docker.createContainer({ Image: 'racket', Tty: true });

  const stream = await container.attach({ stream: true, stdout: true, stderr: true });

  await container.start();

  return new Promise((resolve, reject) => {
    const chunks = [];

    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks).toString("utf8")));
    stream.on('error', (error) => reject(error));
  });
}

export default { run };