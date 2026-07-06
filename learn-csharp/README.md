# learn-csharp

面向有 TypeScript / NestJS 背景的开发者的 C#、ASP.NET Core、EF Core、SignalR 学习课程。

## 课程内容

- `src/data/course/index.ts` 维护课程模块、章节顺序、老师提示和阶段验收问题。
- `src/lessons/**` 存放每节课程正文，内容以可交互 React 组件呈现。
- `src/components/lesson-ui` 提供课程正文、代码块、检查点、实战任务等通用组件。

## 开发命令

```bash
yarn install
yarn dev
yarn lint
yarn build
```

## 内容维护原则

- 优先保证示例可复制、概念准确、章节之间命名一致。
- 正文已经完成主线任务时，不额外保留重复实战。
- 新增课程内容优先对照 TypeScript / NestJS 心智模型解释关键差异。
