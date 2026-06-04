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

const lessonFiles = fs
  .readdirSync(CONTENT_DIR)
  .filter((fileName) => fileName.endsWith(".ts"));

const lessonSource = lessonFiles
  .map((fileName) => fs.readFileSync(path.join(CONTENT_DIR, fileName), "utf8"))
  .join("\n");

const countDocCodeBlocks = (source) => {
  const matches = source.match(/^```/gm);
  return matches ? Math.floor(matches.length / 2) : 0;
};

const countLessonCodeBlocks = (source) =>
  (source.match(/"type": "code"/g) ?? []).length;

const docCodeCount = docs
  .map((doc) => fs.readFileSync(path.join(ROOT, doc), "utf8"))
  .reduce((total, source) => total + countDocCodeBlocks(source), 0);
const lessonCodeCount = countLessonCodeBlocks(lessonSource);
const checklistCount = (lessonSource.match(/"type": "checklist"/g) ?? []).length;

console.log(`docCodeBlocks=${docCodeCount}`);
console.log(`lessonCodeBlocks=${lessonCodeCount}`);
console.log(`lessonChecklists=${checklistCount}`);

const requiredPhrases = [
  "实战练习清单",
  "阶段验收问题",
  "常见误区",
  "学习顺序建议",
  "第一个控制台项目",
  "泛型",
  "Endpoint Filters",
  "Change Tracker",
  "资源级授权",
  "连接统计",
  "Testcontainers",
  "速率限制",
  "AOT 的限制",
];

const missingPhrases = requiredPhrases.filter(
  (phrase) => !lessonSource.includes(phrase),
);

if (lessonCodeCount < docCodeCount || checklistCount < 7 || missingPhrases.length) {
  for (const phrase of missingPhrases) {
    console.log(`missingPhrase=${phrase}`);
  }

  process.exitCode = 1;
}
