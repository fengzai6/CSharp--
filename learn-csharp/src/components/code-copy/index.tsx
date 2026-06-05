import { CheckOutlined, CopyOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { Highlight, Prism, themes } from "prism-react-renderer";
import { useState } from "react";

// 将 Prism 设置为全局对象，prismjs 组件需要它
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).Prism = Prism;

// 导入额外的语言支持
// @ts-expect-error prismjs components don't have type definitions
import("prismjs/components/prism-csharp");
// @ts-expect-error prismjs components don't have type definitions
import("prismjs/components/prism-bash");
// @ts-expect-error prismjs components don't have type definitions
import("prismjs/components/prism-docker");

interface ICodeCopyProps {
  code: string;
  language: string;
  title: string;
}

const PRISM_LANG: Record<string, string> = {
  bash: "bash",
  csharp: "csharp",
  dockerfile: "docker",
  json: "json",
  typescript: "typescript",
  xml: "markup",
};

export const CodeCopy = ({ code, language, title }: ICodeCopyProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const prismLang = PRISM_LANG[language];

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 shadow-sm">
      <div className="flex min-h-11 items-center justify-between border-b border-slate-800 px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-100">{title}</p>
          <p className="font-mono text-xs text-slate-400">{language}</p>
        </div>
        <Tooltip title={copied ? "已复制" : "复制代码"}>
          <Button
            aria-label={copied ? "已复制" : "复制代码"}
            icon={copied ? <CheckOutlined /> : <CopyOutlined />}
            shape="circle"
            type="text"
            className="text-slate-200! hover:bg-slate-800!"
            onClick={handleCopy}
          />
        </Tooltip>
      </div>
      {prismLang ? (
        <Highlight
          code={code.trimEnd()}
          language={prismLang}
          theme={themes.nightOwl}
        >
          {({ getLineProps, getTokenProps, style, tokens }) => (
            <pre
              className="m-0 overflow-x-auto p-4 text-sm leading-6"
              style={style}
            >
              <code>
                {tokens.map((line, i) => (
                  <span key={i} {...getLineProps({ line })}>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                    {"\n"}
                  </span>
                ))}
              </code>
            </pre>
          )}
        </Highlight>
      ) : (
        <pre className="m-0 overflow-x-auto p-4 text-sm leading-6 text-slate-100">
          <code>{code}</code>
        </pre>
      )}
    </section>
  );
};
