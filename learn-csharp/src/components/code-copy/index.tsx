import { CheckOutlined, CopyOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { useState } from "react";

interface ICodeCopyProps {
  code: string;
  language: string;
  title: string;
}

export const CodeCopy = ({ code, language, title }: ICodeCopyProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 shadow-sm">
      <div className="flex min-h-11 items-center justify-between border-b border-slate-800 px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-100">
            {title}
          </p>
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
      <pre className="m-0 overflow-x-auto p-4 text-sm leading-6 text-slate-100">
        <code>{code}</code>
      </pre>
    </section>
  );
};
