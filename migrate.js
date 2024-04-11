import fs from "node:fs/promises";
import path from "node:path";

const mappings = JSON.parse(await fs.readFile("./full-mappings.json"));

const blacklist = [
  // Duplicated by repos
  "cs3214/spring2024/exercises/ex3/simula24",
  // Invalid content
  "exercises/ex0/zero.txt",
  "exercises/ex0/random.txt",
  "exercises/ex0/utf32-demo.txt",
  "exercises/ex0/utf8-demo.txt",
  // No useful info
  "cs3214/spring2024.html",
  "cs3214/spring2024/exercises.html",
  "cs3214/spring2024/officehours.html",
  "cs3214/spring2024/login.html",
  // Things that probably shouldn't exist
  "cs3214/spring2024/documents.html",
];
const blacklistFilename = [
  ".git",
  ".gitignore",
  ".gitattributes",
  "__init__.py",
];
const blacklistExt = [".svg", ".png", ".jpg", ".tar", ".gz", ".mp4", ".hprof"];

/**
 * Check whether a given path is blacklisted.
 * @param {any} p the path to check
 * @returns {boolean} `true` if blacklisted, `false` otherwise
 */
function isBlacklisted(p) {
  const basename = path.basename(p);
  const ext = path.extname(p);
  return (
    blacklistFilename.includes(basename.toLowerCase()) ||
    blacklistExt.includes(ext.toLowerCase()) ||
    blacklist.some((entry) => p.includes(entry))
  );
}

/**
 * All of the assignment categories that we're grouping together.
 * @enum {string}
 */
const categories = Object.freeze({
  ex0: "ex0",
  ex1: "ex1",
  ex2: "ex2",
  ex3: "ex3",
  ex4: "ex4",
  ex5: "ex5",
  p1: "p1",
  p2: "p2",
  p3: "p3",
  p4: "p4",
  midterm: "midterm",
  final: "final",
  material: "material",
  admin: "admin",
});
/** @type {categories[]} */
const exercises = [
  categories.ex0,
  categories.ex1,
  categories.ex2,
  categories.ex3,
  categories.ex4,
  categories.ex5,
];
/** @type {categories[]} */
// const projects = [categories.p1, categories.p2, categories.p3, categories.p4];

/** @type {Map<categories, string[]>} */
const groups = new Map(Object.values(categories).map((cat) => [cat, []]));

/** @type {[string, categories][]} */
const repoMap = [
  // Repos
  ["repos/cs3214-cush", categories.p1],
  ["repos/threadlab", categories.p2],
  ["repos/malloclab", categories.p3],
  ["repos/simula24", categories.ex3],
];

const projectMap = [
  ["/projects/project1", categories.p1],
  ["/projects/project2", categories.p2],
  ["/projects/project3", categories.p3],
  ["/projects/project4", categories.p4],
  ["/documents/fuzz", categories.p4],
  ["/projects/helpsessions/cush", categories.p1],
  ["/projects/helpsessions/threadpool", categories.p2],
  ["/projects/helpsessions/malloclab", categories.p3],
  ["/projects/cush-handout.pdf", categories.p1],
  ["/projects/threadpool-handout.pdf", categories.p2],
  ["/projects/malloclab-cs3214.pdf", categories.p3],
];

/** @type {[string, categories][]} */
const exerciseMap = [
  // Exercise folder
  ...exercises.map((ex) => [`/exercises/${ex}`, ex]),
  // Individual page, like `/exercises/exercise4.html` or `/exercises/exercise5discovery.html`
  ...exercises.map((ex) => [`/exercises/${ex.replace("ex", "exercise")}`, ex]),
];

/** @type {[string, categories][]} */
const testsMap = [
  ["Test1", categories.midterm],
  ["Test_1", categories.midterm],
  ["Test_2", categories.midterm],
  ["Midterm", categories.midterm],
  ["Final", categories.final],
];

const courseMaterial = ["/questions/", "/lecturenotes/", "repos/cs3214-videos"];

const administrative = [
  "cs3214/spring2024/documents/CS3214-Syllabus-Fall23.pdf",
  "cs3214/spring2024/documents/cs3214-fall2022-grades.pdf",
  "cs3214/spring2024/documents/cs3214-fall2023-grades.pdf",
  "cs3214/spring2024/documents/cs3214-spring2023-grades.pdf",
  "cs3214/spring2024/documents/CS3214-Syllabus-Spring24.pdf",
  "cs3214/spring2024/submissionfaq.html",
  "cs3214/spring2024/faq.html",
  "cs3214/spring2024/policies.html",
  "cs3214/spring2024/docs.html",
  "cs3214/spring2024/lectures.html",
  "cs3214/spring2024/staff.html",
  "cs3214/spring2024/projects/duedates.html",
  "cs3214/spring2024/exercises/duedates.html",
  "cs3214/spring2024/submissions.html",
  "cs3214/spring2024/grouper.html",
  "cs3214/spring2024/syllabusquiz.html",
  "cs3214/spring2024/auth/welcome.html",
];

const groupMap = [
  ...repoMap,
  ...testsMap,
  ...exerciseMap,
  ...projectMap,
  ...courseMaterial.map((key) => [key, categories.material]),
  ...administrative.map((key) => [key, categories.admin]),
];

const notAdded = [];

function addToGroup(file) {
  if (isBlacklisted(file)) {
    console.log("Blacklisted", file);
    return;
  }

  // Whether we added the file to one or more groups
  let added = false;

  for (const [key, dest] of groupMap) {
    if (file.includes(key)) {
      groups.get(dest).push(file);
      added = true;
    }
  }

  if (!added) {
    notAdded.push(file);
  }
}

for (const file of Object.keys(mappings)) {
  addToGroup(file);
}
console.log("Groups:", groups);
console.log("Not added:", notAdded);
