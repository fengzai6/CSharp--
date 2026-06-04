import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "learn-csharp/src/data/course/content");
const LESSON_DIR = path.join(ROOT, "learn-csharp/src/lessons");

const docs = {
  setup: "docs/00-环境准备与项目骨架.md",
  csharp: "docs/01-CSharp语言核心.md",
  aspnet: "docs/02-ASPNET-Core框架.md",
  ef: "docs/03-EF-Core数据库.md",
  auth: "docs/04-认证授权.md",
  signalr: "docs/05-SignalR实时通信.md",
  engineering: "docs/06-工程化与进阶.md",
};

const lessons = [
  {
    blocksName: "setupSdkBlocks",
    componentName: "SetupSdkLesson",
    doc: "setup",
    file: "setup/sdk.tsx",
    segments: [{ start: 0, endHeading: "## 第一个控制台项目" }],
    title: "确认 SDK 与版本基线",
  },
  {
    blocksName: "setupSolutionBlocks",
    componentName: "SetupSolutionLesson",
    doc: "setup",
    file: "setup/solution.tsx",
    segments: [
      { startHeading: "## 第一个控制台项目", endHeading: "## NuGet 包" },
    ],
    title: "搭建 Solution 与多项目结构",
  },
  {
    blocksName: "setupFirstApiBlocks",
    componentName: "SetupFirstApiLesson",
    doc: "setup",
    file: "setup/first-api.tsx",
    nextLesson: {
      label: "进入 C# 语言核心",
      targetModuleId: "csharp-core",
      text: "完成环境和骨架后，进入 C# 语言核心。下一章开始把 TypeScript 经验迁移到 C# 类型系统、LINQ 和 async/await。",
    },
    segments: [{ startHeading: "## NuGet 包" }],
    title: "运行最小 Web API",
  },
  {
    blocksName: "csharpTypesBlocks",
    componentName: "CsharpTypesLesson",
    doc: "csharp",
    file: "csharp-core/types.tsx",
    segments: [{ start: 0, endHeading: "## 第 2 周：C# 核心特性" }],
    title: "类型、空值和值/引用",
  },
  {
    blocksName: "csharpLinqRecordBlocks",
    componentName: "CsharpLinqRecordLesson",
    doc: "csharp",
    file: "csharp-core/linq-record.tsx",
    segments: [
      {
        startHeading: "## 第 2 周：C# 核心特性",
        endHeading: "### 2.3 异步编程 — async/await 与 Task",
      },
      {
        startHeading: "### 2.4 委托、事件与 Lambda",
        endHeading: "## 实战练习清单",
      },
    ],
    title: "LINQ、模式匹配与 record",
  },
  {
    blocksName: "csharpAsyncBlocks",
    componentName: "CsharpAsyncLesson",
    doc: "csharp",
    file: "csharp-core/async.tsx",
    nextLesson: {
      label: "进入 ASP.NET Core 框架",
      targetModuleId: "aspnet-core",
      text: "掌握 C# 语言核心后，进入 ASP.NET Core。下一章开始把这些类型、DTO、async 方法放进真正的 Web API。",
    },
    segments: [
      {
        startHeading: "### 2.3 异步编程 — async/await 与 Task",
        endHeading: "### 2.4 委托、事件与 Lambda",
      },
      { startHeading: "## 实战练习清单" },
    ],
    title: "async/await 与 Task",
  },
  {
    blocksName: "aspnetProgramBlocks",
    componentName: "AspnetProgramLesson",
    doc: "aspnet",
    file: "aspnet-core/program.tsx",
    segments: [{ start: 0, endHeading: "## Controller 与路由" }],
    title: "Program.cs 与请求管道",
  },
  {
    blocksName: "aspnetControllerDiBlocks",
    componentName: "AspnetControllerDiLesson",
    doc: "aspnet",
    file: "aspnet-core/controller-di.tsx",
    segments: [
      {
        startHeading: "## Controller 与路由",
        endHeading: "## 数据验证",
      },
      {
        startHeading: "## 授权（Authorization）",
        endHeading: "## 配置管理",
      },
    ],
    title: "Controller、Service 与 DI",
  },
  {
    blocksName: "aspnetOpenApiValidationBlocks",
    componentName: "AspnetOpenApiValidationLesson",
    doc: "aspnet",
    file: "aspnet-core/openapi-validation.tsx",
    nextLesson: {
      label: "进入 EF Core 数据库",
      targetModuleId: "ef-core",
      text: "Web API 框架主线完成后，进入 EF Core。下一章把实体、关系、事务和迁移补起来。",
    },
    segments: [
      {
        startHeading: "## 数据验证",
        endHeading: "## 授权（Authorization）",
      },
      { startHeading: "## 配置管理" },
    ],
    title: "验证、OpenAPI 与结构",
  },
  {
    blocksName: "efDbContextBlocks",
    componentName: "EfDbContextLesson",
    doc: "ef",
    file: "ef-core/dbcontext.tsx",
    segments: [
      { start: 0, endHeading: "### 关系映射" },
    ],
    title: "DbContext 与实体配置",
  },
  {
    blocksName: "efRelationshipsBlocks",
    componentName: "EfRelationshipsLesson",
    doc: "ef",
    file: "ef-core/relationships.tsx",
    segments: [
      {
        startHeading: "### 关系映射",
        endHeading: "## 增删改查",
      },
      {
        startHeading: "## 关系数据查询：Include 与投影",
        endHeading: "## 变更追踪",
      },
    ],
    title: "关系建模与查询策略",
  },
  {
    blocksName: "efTransactionsBlocks",
    componentName: "EfTransactionsLesson",
    doc: "ef",
    file: "ef-core/transactions.tsx",
    nextLesson: {
      label: "进入认证授权",
      targetModuleId: "auth",
      text: "完成数据库建模和事务后，进入认证授权。下一章会把用户、角色、权限和令牌体系接上。",
    },
    segments: [
      {
        startHeading: "## 增删改查",
        endHeading: "## 关系数据查询：Include 与投影",
      },
      { startHeading: "## 变更追踪" },
    ],
    title: "事务、批量操作与迁移",
  },
  {
    blocksName: "authPasswordJwtBlocks",
    componentName: "AuthPasswordJwtLesson",
    doc: "auth",
    file: "auth/password-jwt.tsx",
    segments: [{ start: 0, endHeading: "## Refresh Token" }],
    title: "密码哈希与 JWT",
  },
  {
    blocksName: "authRefreshPolicyBlocks",
    componentName: "AuthRefreshPolicyLesson",
    doc: "auth",
    file: "auth/refresh-policy.tsx",
    nextLesson: {
      label: "进入 SignalR 实时通信",
      targetModuleId: "signalr",
      text: "认证授权完成后，进入 SignalR。下一章会把 JWT 认证带到实时连接里。",
    },
    segments: [{ startHeading: "## Refresh Token" }],
    title: "Refresh Token 与 Policy",
  },
  {
    blocksName: "signalrHubBlocks",
    componentName: "SignalrHubLesson",
    doc: "signalr",
    file: "signalr/hub.tsx",
    segments: [{ start: 0, endHeading: "## 认证集成" }],
    title: "Hub、Groups 与消息发送",
  },
  {
    blocksName: "signalrAuthReconnectBlocks",
    componentName: "SignalrAuthReconnectLesson",
    doc: "signalr",
    file: "signalr/auth-reconnect.tsx",
    nextLesson: {
      label: "进入工程化与进阶",
      targetModuleId: "engineering",
      text: "实时通信完成后，进入工程化。下一章补齐测试、日志、缓存、健康检查、限流和部署。",
    },
    segments: [{ startHeading: "## 认证集成" }],
    title: "认证与断线重连",
  },
  {
    blocksName: "engineeringTestingBlocks",
    componentName: "EngineeringTestingLesson",
    doc: "engineering",
    file: "engineering/testing.tsx",
    segments: [{ start: 0, endHeading: "## 日志" }],
    title: "测试分层",
  },
  {
    blocksName: "engineeringObservabilityBlocks",
    componentName: "EngineeringObservabilityLesson",
    doc: "engineering",
    file: "engineering/observability.tsx",
    segments: [
      { startHeading: "## 日志", endHeading: "## 速率限制" },
    ],
    title: "日志、缓存、健康检查",
  },
  {
    blocksName: "engineeringDeployBlocks",
    componentName: "EngineeringDeployLesson",
    doc: "engineering",
    file: "engineering/deploy.tsx",
    segments: [{ startHeading: "## 速率限制" }],
    title: "Docker、限流与 AOT",
  },
];

const toKebabCase = (value) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const toCamelCase = (value) =>
  value.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());

const readDoc = (key) => {
  const raw = fs.readFileSync(path.join(ROOT, docs[key]), "utf8");
  return raw.split(/\r?\n/);
};

const findHeadingIndex = (lines, heading) => {
  const index = lines.findIndex((line) => line.trim() === heading);

  if (index === -1) {
    throw new Error(`Heading not found: ${heading}`);
  }

  return index;
};

const getSegmentLines = (lines, segment) => {
  const start =
    typeof segment.start === "number"
      ? segment.start
      : findHeadingIndex(lines, segment.startHeading);
  const end = segment.endHeading
    ? findHeadingIndex(lines, segment.endHeading)
    : lines.length;

  return lines.slice(start, end);
};

const stripListMarker = (line) =>
  line
    .trim()
    .replace(/^- \[ \]\s*/, "")
    .replace(/^[-*]\s*/, "")
    .replace(/^\d+\.\s*/, "");

const isTableLine = (line) => /^\s*\|.*\|\s*$/.test(line);
const isTableSeparator = (line) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);

const parseTableCells = (line) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

const parseBlocks = (lines) => {
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed || trimmed === "---") {
      index += 1;
      continue;
    }

    const headingMatch = /^(#{1,4})\s+(.+)$/.exec(trimmed);

    if (headingMatch) {
      const level = headingMatch[1].length;

      if (level > 1) {
        blocks.push({
          level: Math.min(level, 4),
          text: headingMatch[2],
          type: "heading",
        });
      }

      index += 1;
      continue;
    }

    const fenceMatch = /^```(\S*)$/.exec(trimmed);

    if (fenceMatch) {
      const previousLine = lines[index - 1]?.trim() ?? "";

      if (!fenceMatch[1] && previousLine) {
        index += 1;
        continue;
      }

      const language = fenceMatch[1] || "text";
      const codeLines = [];
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      index += 1;
      blocks.push({
        code: codeLines.join("\n"),
        language,
        title: language === "text" ? "示例" : `${language} 示例`,
        type: "code",
      });
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoteLines = [];

      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }

      blocks.push({ text: quoteLines.join(" "), type: "quote" });
      continue;
    }

    if (isTableLine(line)) {
      const tableLines = [];

      while (index < lines.length && isTableLine(lines[index])) {
        tableLines.push(lines[index]);
        index += 1;
      }

      const rows = tableLines
        .filter((tableLine) => !isTableSeparator(tableLine))
        .map(parseTableCells);
      const [headers = [], ...bodyRows] = rows;

      blocks.push({ headers, rows: bodyRows, type: "table" });
      continue;
    }

    if (/^- \[ \]\s+/.test(trimmed)) {
      const items = [];

      while (index < lines.length && /^- \[ \]\s+/.test(lines[index].trim())) {
        items.push(stripListMarker(lines[index]));
        index += 1;
      }

      blocks.push({
        id: `checklist-${blocks.length + 1}`,
        items,
        title: "练习清单",
        type: "checklist",
      });
      continue;
    }

    if (/^([-*]|\d+\.)\s+/.test(trimmed)) {
      const items = [];
      const ordered = /^\d+\.\s+/.test(trimmed);

      while (
        index < lines.length &&
        (ordered
          ? /^\d+\.\s+/.test(lines[index].trim())
          : /^[-*]\s+/.test(lines[index].trim()))
      ) {
        items.push(stripListMarker(lines[index]));
        index += 1;
      }

      blocks.push({ items, ordered, type: "list" });
      continue;
    }

    const paragraphLines = [];

    while (index < lines.length) {
      const current = lines[index];
      const currentTrimmed = current.trim();

      if (
        !currentTrimmed ||
        currentTrimmed === "---" ||
        /^(#{1,4})\s+/.test(currentTrimmed) ||
        currentTrimmed.startsWith(">") ||
        currentTrimmed.startsWith("```") ||
        isTableLine(current) ||
        /^([-*]|\d+\.)\s+/.test(currentTrimmed)
      ) {
        break;
      }

      paragraphLines.push(currentTrimmed);
      index += 1;
    }

    blocks.push({ text: paragraphLines.join(" "), type: "paragraph" });
  }

  return blocks;
};

const writeContentFile = (lesson) => {
  const lines = readDoc(lesson.doc);
  const segmentLines = lesson.segments.flatMap((segment) =>
    getSegmentLines(lines, segment),
  );
  const blocks = parseBlocks(segmentLines);
  const fileName = `${toKebabCase(lesson.blocksName.replace(/Blocks$/, ""))}.ts`;
  const target = path.join(CONTENT_DIR, fileName);
  const content = `import type { ILessonBlock } from "@/components/lesson-ui";\n\nexport const ${lesson.blocksName} = ${JSON.stringify(
    blocks,
    null,
    2,
  )} satisfies ILessonBlock[];\n`;

  fs.writeFileSync(target, content);

  return {
    contentFile: fileName.replace(/\.ts$/, ""),
    count: blocks.length,
  };
};

const writeLessonFile = (lesson, contentFile) => {
  const target = path.join(LESSON_DIR, lesson.file);
  const nextLesson = lesson.nextLesson
    ? `\n      nextLesson={${JSON.stringify(lesson.nextLesson)}}`
    : "";
  const content = `import { StructuredLesson } from "@/components/lesson-ui";\nimport { ${lesson.blocksName} } from "@/data/course/content/${contentFile}";\nimport type { ILessonComponentProps } from "@/data/course";\n\nexport const ${lesson.componentName} = ({\n  completedChecklistIds,\n  onGoToModule,\n  onToggleChecklistItem,\n}: ILessonComponentProps) => (\n  <StructuredLesson\n    blocks={${lesson.blocksName}}\n    completedChecklistIds={completedChecklistIds}\n    lessonId="${toKebabCase(lesson.blocksName.replace(/Blocks$/, ""))}"\n    title="${lesson.title}"\n    onGoToModule={onGoToModule}\n    onToggleChecklistItem={onToggleChecklistItem}${nextLesson}\n  />\n);\n`;

  fs.writeFileSync(target, content);
};

fs.mkdirSync(CONTENT_DIR, { recursive: true });

for (const lesson of lessons) {
  const { contentFile, count } = writeContentFile(lesson);
  writeLessonFile(lesson, contentFile);
  console.log(`${lesson.file}: ${count} blocks`);
}
