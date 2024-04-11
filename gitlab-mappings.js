// ES6 version using asynchronous iterators, compatible with node v10.0+

import fs from "node:fs/promises";
import path from "node:path";
import util from "node:util";
import child_process from "node:child_process";

const exec = util.promisify(child_process.exec);

const config = JSON.parse(await fs.readFile("./config.json"));

/**
 * @param {string} dir directory to start walking
 * @param {string} commitHash the hash for the current commit in the repository we're currently walking (or null if we're not walking one)
 * @returns {AsyncIterable<{commitHash: string, path: string}>} the files found
 */
async function* walk(dir, commitHash = null) {
  let iter;
  try {
    iter = await fs.opendir(dir);
  } catch {
    console.error(`Could not open "${dir}". Did you run repos.sh?`);
    return;
  }

  for await (const d of iter) {
    if (config.exclude.includes(d.name)) {
      // We don't care about things in .git
      continue;
    }

    const entry = path.join(dir, d.name);
    if (d.isDirectory()) {
      try {
        await fs.access(path.join(d.path, ".git"));

        // We're in the base of repository
        const { stdout: commitHash } = await exec(
          `cd ${d.path} && git rev-parse HEAD`,
        );
        yield* walk(entry, commitHash.trim());
      } catch {
        // We're in a folder inside the repository
        yield* walk(entry, commitHash);
      }
    } else if (d.isFile()) {
      yield { commitHash, path: entry };
    }
  }
}

/**
 * @param {string} filePath the full path to the file to get the link for
 * @param {string} commitHash the commit hash, in its (full) long form
 * @returns {string} the GitLab url to the given file
 */
function gitlabUrl(filePath, commitHash) {
  const parts = filePath.split("/");
  const repo = parts[2];
  const file = parts.slice(3).join("/");
  return `${config.git}/${repo}/-/blob/${commitHash}/${file}`;
}

/** @type {Object.<string, string>} */
const mappings = {};

for await (const { commitHash, path: p } of walk(`${config.out}/repos/`)) {
  const gUrl = gitlabUrl(p, commitHash);

  // Path from the perspective of the out directory (i.e. removes `out/`)
  let pFromOut = path.relative(config.out, p);

  console.log(pFromOut, gUrl);

  const key = pFromOut;
  // To catch repeated writes, shouldn't happen but just in case
  if (Object.prototype.hasOwnProperty.call(mappings, key)) {
    throw new Error(`Attempt to overwrite repeated key: ${key}`);
  }
  mappings[key] = gUrl;
}

await fs.writeFile("gitlab-mappings.json", JSON.stringify(mappings, null, 2));
