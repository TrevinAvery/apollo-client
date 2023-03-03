import assert from "assert";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const distRoot = path.join(__dirname, "..", "dist");
const versionPath = path.join(distRoot, "version.js");
const pkgJsonPath = path.join(__dirname, "..", "package.json");

const { version } = JSON.parse(fs.readFileSync(pkgJsonPath));
assert.strictEqual(
  typeof version, "string",
  '"version" field missing from package.json',
);

switch (process.argv[2]) {
  case "update": {
    const updated = fs
      .readFileSync(versionPath, "utf8")
      .replace(/\blocal\b/, version);

    assert.notEqual(
      updated.indexOf(version), -1,
      "Failed to update dist/version.js with @apollo/client version",
    );

    fs.writeFileSync(versionPath, updated);

    break;
  }

  case "verify": {
    const {
      ApolloClient,
      InMemoryCache,
    } = await import(path.join(distRoot, "core", "core.cjs"));

    // Though this may seem like overkill, verifying that ApolloClient is
    // constructible in Node.js is actually pretty useful, too!
    const client = new ApolloClient({
      cache: new InMemoryCache,
    });

    // Probably not necessary, but it seems wise to clean up any resources
    // the client might have acquired during its construction.
    client.stop();

    // The CommonJS dist/core/core.cjs file is generated from ESM modules
    // generated by tsc, including dist/version.js, so verifying core.cjs
    // exports an ApolloClient class that defines client.version also serves to
    // verify that dist/version.js must have been correctly updated, which is
    // convenient because dist/version.js uses ECMAScript module syntax, and is
    // thus not importable in all versions of Node.js.
    assert.strictEqual(
      client.version, version,
      "Failed to update dist/version.js and dist/core/core.cjs",
    );

    break;
  }

  default:
    throw new Error(
      "Pass either 'update' or 'verify' to config/version.js"
    );
}

console.log("ok");
