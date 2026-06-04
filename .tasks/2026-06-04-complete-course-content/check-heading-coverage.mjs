import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "learn-csharp/src/data/course/content");
const docs = [
  "docs/00-环境准备与项目骨架.md",
  "docs/01-CSharp语言核心.md",
  "docs/02-ASPNET-Core框架.md",
  "docs/03-EF-Core数据库.md",
  "docs/04-认证授权.md",
  "docs/05-SignalR实时通信.md",
  "docs/06-工程化与进阶.md",
];

const content = fs
  .readdirSync(CONTENT_DIR)
  .filter((fileName) => fileName.endsWith(".ts"))
  .map((fileName) => fs.readFileSync(path.join(CONTENT_DIR, fileName), "utf8"))
  .join("\n");

let missingCount = 0;

for (const doc of docs) {
  const source = fs.readFileSync(path.join(ROOT, doc), "utf8");
  const headings = source
    .split(/\r?\n/)
    .map((line) => /^(#{2,4})\s+(.+)$/.exec(line.trim()))
    .filter(Boolean)
    .map((match) => match[2]);
  const missing = headings.filter((heading) => !content.includes(`"text": ${JSON.stringify(heading)}`));

  console.log(`\n${doc}`);
  console.log(`headings=${headings.length}, missing=${missing.length}`);

  for (const heading of missing) {
    console.log(`- ${heading}`);
  }

  missingCount += missing.length;
}

if (missingCount > 0) {
  process.exitCode = 1;
}
