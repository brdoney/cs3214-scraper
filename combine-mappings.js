import fs from "node:fs/promises";

const website = JSON.parse(await fs.readFile("./website-mappings.json"));
const gitlab = JSON.parse(await fs.readFile("./gitlab-mappings.json"));

const mappings = [website, gitlab];

// Verify that we don't have duplicate keys as we add them
let seen = new Set();
const full_mappings = {};
for (const map of mappings) {
  for (const [key, val] of Object.entries(map)) {
    if (seen.size === seen.add(key).size) {
      throw new Error(`Duplicate key ${key}`);
    }
    full_mappings[key] = val;
  }
}

await fs.writeFile(
  "website-mappings.json",
  JSON.stringify(full_mappings, null, 2),
);
