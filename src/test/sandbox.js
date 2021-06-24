import { strict as assert } from 'assert';
import sandbox from "../utils/sandbox.js";
import Dockerode from "dockerode";
import tmpPromise from "tmp-promise";
import { promises as fs } from "fs";

tmpPromise.setGracefulCleanup();
const tempDir = tmpPromise.dirSync({ prefix: 'discoder-bot-test_' });

const docker = new Dockerode({ socketPath: "/var/run/docker.sock" });

async function makeTmp(code) {
  const { path: sourcePath, cleanup: _source, fd: _fd } = await tmpPromise.file(
    { dir: tempDir.name, prefix: "test", postfix: ".tmp", mode: 0o755 }
  );

  await fs.writeFile(sourcePath, code);

  return sourcePath;
}

describe("Sandbox", () => {
  describe("evaluate()", () => {
    it("should have basic functionality", async () => {
      const code =
        "#lang racket/base\n" +
        "(display \"Hello World\")";

      const sourcePath = await makeTmp(code);
      const evalInfo = await sandbox.evaluate(docker, process.env.RUNTIME_IMAGE_REFERENCE, ".rkt", sourcePath);

      assert.deepStrictEqual(evalInfo.output, "Hello World");
      assert.deepStrictEqual(evalInfo.exitCode, 0);
    });
  });
});

describe("Sandbox", () => {
  describe("evaluate()", () => {
    it("should allow the cmd to be overridden", async () => {
      const sourcePath = await makeTmp("");
      const options = { cmd: ["echo", "Hello World"] };
      const evalInfo =
        await sandbox.evaluate(docker, process.env.RUNTIME_IMAGE_REFERENCE, ".rkt", sourcePath, options);

      assert.deepStrictEqual(evalInfo.output, "Hello World\r\n");
      assert.deepStrictEqual(evalInfo.exitCode, 0);
    });
  });
});

describe("Sandbox", () => {
  describe("evaluate()", () => {
    it("should allow the entrypoint to be overridden", async () => {
      const sourcePath = await makeTmp("");
      const options = { entrypoint: ["/bin/sh", "-c"], cmd: ["echo Hello World"] };
      const evalInfo =
        await sandbox.evaluate(docker, process.env.RUNTIME_IMAGE_REFERENCE, ".rkt", sourcePath, options);

      assert.deepStrictEqual(evalInfo.output, "Hello World\r\n");
      assert.deepStrictEqual(evalInfo.exitCode, 0);
    });
  });
});

describe("Sandbox", () => {
  describe("evaluate()", () => {
    it("should be read only", async () => {
      const code =
        "#lang racket/base\n" +
        "(define out (open-output-file \"data\"))\n" + 
        "(display \"test\" out)\n" +
        "(close-output-port out)";

      const sourcePath = await makeTmp(code);
      const evalInfo = await sandbox.evaluate(docker, process.env.RUNTIME_IMAGE_REFERENCE, ".rkt", sourcePath);

      assert.deepStrictEqual(evalInfo.exitCode, 1);
    });
  });
});

describe("Sandbox", () => {
  describe("evaluate()", () => {
    it("should be able to attach a writable directory", async () => {
      const code =
        "#lang racket/base\n" +
        "(define out (open-output-file \"/code/writable/data\"))\n" +
        "(display \"test\" out)\n" +
        "(close-output-port out)";

      const sourcePath = await makeTmp(code);
      const options = { isWritable: true };
      const evalInfo =
        await sandbox.evaluate(docker, process.env.RUNTIME_IMAGE_REFERENCE, ".rkt", sourcePath, options);

      assert.deepStrictEqual(evalInfo.exitCode, 0);
    });
  });
});

describe("Sandbox", () => {
  describe("evaluate()", () => {
    it("should have networking disabled", async () => {
      const code =
        "#lang racket/base\n" +
        "(require net/url)\n" +
        "(define google (string->url \"http://google.com\"))\n" +
        "(define in (get-pure-port google #:redirections 5))";

      const sourcePath = await makeTmp(code);
      const evalInfo = await sandbox.evaluate(docker, process.env.RUNTIME_IMAGE_REFERENCE, ".rkt", sourcePath);

      assert(evalInfo.output.includes("host not found"), "Expected process to say DNS failed.");
      assert.deepStrictEqual(evalInfo.exitCode, 1);
    });
  });
});

describe("Sandbox", () => {
  describe("evaluate()", () => {
    it("should limit memory", async () => {
      const code =
        "#lang racket/base\n" +
        "(make-vector 1000000000 (make-vector 1000000000))";

      const sourcePath = await makeTmp(code);
      const evalInfo = await sandbox.evaluate(docker, process.env.RUNTIME_IMAGE_REFERENCE, ".rkt", sourcePath);

      assert.deepStrictEqual(evalInfo.exitCode, 137);
    });
  });
});

describe("Sandbox", () => {
  describe("evaluate()", () => {
    it("should limit the number of pids", async () => {
      const sourcePath = await makeTmp("");
      const cmd = ["echo ':(){ :|:& };:' > /code/writable/fb.sh && bash /code/writable/fb.sh && sleep 40"]
      const options = { entrypoint: ["/bin/sh", "-c"], cmd, isWritable: true };
      const evalInfo =
        await sandbox.evaluate(docker, process.env.RUNTIME_IMAGE_REFERENCE, ".rkt", sourcePath, options);

      assert(
        evalInfo.output.includes("Resource temporarily unavailable"),
        "Expected 'resource unavailable' in output.");
  
      assert.deepStrictEqual(evalInfo.exitCode, 137);
    });
  });
});

describe("Sandbox", () => {
  describe("evaluate()", () => {
    it("should limit time", async () => {
      const code =
        "#lang racket/base\n" +
        "(sleep 40)"; // 40 seconds

      const sourcePath = await makeTmp(code);
      const evalInfo = await sandbox.evaluate(docker, process.env.RUNTIME_IMAGE_REFERENCE, ".rkt", sourcePath);

      assert(evalInfo.output.includes("Code timed out."), "Expected 'timed out' in output.");
      assert.deepStrictEqual(evalInfo.exitCode, 124);
    });
  });
});

describe("Sandbox", () => {
  describe("evaluate()", () => {
    it("should limit time from the outside", async () => {
      const code =
        "#lang racket/base\n" +
        "(sleep 40)"; // 40 seconds

      const sourcePath = await makeTmp(code);
      const options = { entrypoint: ["/bin/bash"] };
      const evalInfo =
        await sandbox.evaluate(docker, process.env.RUNTIME_IMAGE_REFERENCE, ".rkt", sourcePath, options);

      assert.deepStrictEqual(evalInfo.exitCode, 137);
    });
  });
});

describe("Sandbox", () => {
  describe("evaluate()", () => {
    it("should limit writing to files", async () => {
      const code =
        "#lang racket/base\n" +
        "(require racket/format)\n" + 
        "(define out (open-output-file \"/code/writable/data\" #:exists 'append))\n" +
        "(define big-stuff (~a (make-vector 100000 0)))\n" +
        "(for ([n 10000])\n" +
          "(display big-stuff out))\n";

      const sourcePath = await makeTmp(code);
      const options = { isWritable: true };
      const evalInfo =
        await sandbox.evaluate(docker, process.env.RUNTIME_IMAGE_REFERENCE, ".rkt", sourcePath, options);

      assert(evalInfo.output.includes("No space left on device"), "Expected 'no space' in output.")
      assert.deepStrictEqual(evalInfo.exitCode, 1);
    });
  });
});