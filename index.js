import puppeteer from "puppeteer";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
// import readline from "readline/promises";
// import readline from ""
import readline from "node:readline/promises";

const browser = await puppeteer.launch({ headless: "new" });

// Website we'll be scraping
const baseUrl = new URL("https://courses.cs.vt.edu/cs3214/fall2023");
const baseUrlString = baseUrl.toString();
const linksStack = [baseUrlString];
const visited = new Set();

// The page we'll be using the load everything
const page = await browser.newPage();

const filePattern = new RegExp(String.raw`(?:/[^\0/.]+/)+[^\0/.]+\.[^\0/.]+`);

/**
 * @param {string} url url to check
 * @returns {boolean} whether or not the given path was pointing to a file
 */
function isFile(url) {
  return filePattern.test(url);
}

/**
 * Converts a given url to a path. The paths start from the current directory, then continues based
 * on the pathname of the url. For example, "https://courses.cs.vt.edu/cs3214/fall2023" gets turned into
 * "<CWD>/fall2023" where <CWD> is the current working directory.
 *
 * @param {string} url the url to convert into a path
 * @returns {string} the string verson of a path for the file
 */
function urlToPath(url) {
  const u = new URL(url);

  // Put the file in folders based on its pathname, starting from cwd
  let cwd = process.cwd();
  return path.join(cwd, u.pathname);
}

/**
 * @param {string} url url we've potentially scraped before
 * @returns {Promise<boolean>} whether the HTML file for the url is on the disk
 */
async function diskHasLink(url) {
  const p = urlToPath(url);
  try {
    await fs.access(`${p}.html`, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * @returns {Promise<boolean>} true if we should use cached versions of the HTML files for URLs when possible
 **/
async function shouldUseCache() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const answer = await rl.question(
      "Do you want to use cached files when possible? [Y/n] ",
    );
    const lowered = answer.toLowerCase();
    if (lowered === "y" || lowered.length == 0) {
      // Type yes or accepted default value of yes
      rl.close();
      return true;
    } else if (lowered === "n") {
      rl.close();
      return false;
    } else {
      console.log(`Invalid option "${answer}". Try again.`);
    }
  }
}

async function addLinks(page, wasFromCache) {
  const links = await page.$$("a");
  for (const link of links) {
    const destHandle = await link.getProperty("href");
    const dest = await destHandle.jsonValue();

    const url = new URL(dest);
    if (url.pathname.startsWith(baseUrl.pathname)) {
      if (wasFromCache) {
        // Need to turn "file:///cs3214/fall2023/submissionfaq" into "https://courses.cs.vt.edu/cs3214/fall2023/faq"
        url.host = baseUrl.host;
        url.protocol = baseUrl.protocol;
      }

      // Remove search parameters and hash so we don't repeatedly scrape the same URL
      url.search = "";
      url.hash = "";

      let res = url.toString();

      // Remove trailing slash so we don't repeat pages like
      // https://courses.cs.vt.edu/cs3214/fall2023/ and
      // https://courses.cs.vt.edu/cs3214/fall2023
      if (res[res.length - 1] == "/") {
        res = res.slice(0, -1);
      }

      if (isFile(url.pathname)) {
        // This is a file, so we never want to visit it
        visited.add(res);
      } else if (!visited.has(res)) {
        // It's a URL that we haven't visited, so we'll need to scrape it
        linksStack.push(res);
      }
    }
  }
}

/**
 * @param {string} html_content - the HTML content of the page to save
 * @param {string} url - the url of the page
 */
async function saveFile(html_content, url) {
  const p = urlToPath(url);

  // Make directories the file is in as needed
  const parsed = path.parse(p);
  await fs.mkdir(parsed.dir, { recursive: true });

  // Write the file contents
  await fs.writeFile(`${p}.html`, html_content);
}

async function loadPage(page, url, useLocal) {
  const message = useLocal ? "local" : "remote";
  console.log(visited.size, linksStack.length, url.toString(), "--", message);

  const dest = useLocal ? `file://${urlToPath(url)}.html` : url;
  await page.goto(
    // Use cached version if enabled and we have it, fall back to URL
    dest,
    // Wait until we have no network connections at all for 500ms
    // https://pptr.dev/api/puppeteer.puppeteerlifecycleevent
    { waitUntil: "networkidle0" },
  );
}

const useCache = await shouldUseCache();

while (linksStack.length > 0) {
  const urlString = linksStack.pop();
  if (visited.has(urlString)) {
    // We've already seen this link, so skip it
    continue;
  }
  visited.add(urlString);

  const inCache = await diskHasLink(urlString);
  const useLocal = useCache && inCache;

  await loadPage(page, urlString, useLocal);

  await addLinks(page, useLocal);

  if (!useCache || !inCache) {
    // We're either re-scraping everything or we aren't but this is a new file
    saveFile(await page.content(), urlString);
  }
}

await fs.writeFile("visited.txt", Array.from(visited).join("\n"));
await browser.close();
