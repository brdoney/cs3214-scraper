// ES6 version using asynchronous iterators, compatible with node v10.0+

import fs from "node:fs/promises";
import path from "node:path";
import util from "node:util";
import child_process from "node:child_process";

const exec = util.promisify(child_process.exec);

/**
 * @param {string} dir directory to start walking
 * @param {string} commitHash the hash for the current commit in the repository we're currently walking (or null if we're not walking one)
 * @returns {AsyncIterable<{commitHash: string, path: string}>} the files found
 */
async function* walk(dir, commitHash = null) {
  for await (const d of await fs.opendir(dir)) {
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

const GITLAB_PREFIX = "https://git.cs.vt.edu/cs3214-staff";

/**
 * @param {string} filePath the full path to the file to get the link for
 * @param {string} commitHash the commit hash, in its (full) long form
 * @returns {string} the GitLab url to the given file
 */
function gitlabUrl(filePath, commitHash) {
  const parts = filePath.split("/");
  const repo = parts[2];
  const file = parts.slice(3).join("/");
  return `${GITLAB_PREFIX}/${repo}/-/blob/${commitHash}/${file}`;
}

/** @type {Object.<string, string>} */
const content = JSON.parse(await fs.readFile("./mappings.json"));

// console.log(content);

const PROTECT_REWRITES = false;

// Then, use it with a simple async for loop
for await (const { commitHash, path: p } of walk("./out/repos/")) {
  const gUrl = gitlabUrl(p, commitHash);
  console.log(p, gUrl);

  const parsed = path.parse(p);
  const key = parsed.base;
  // To catch repeated writes, like for `Makefile`, which has same name across repos
  if (PROTECT_REWRITES && Object.prototype.hasOwnProperty.call(content, key)) {
    throw new Error(`Attempt to overwrite repeated key: ${key}`);
  }
  content[key] = gUrl;
}

fs.writeFile("./full-mappings.json", JSON.stringify(content));
