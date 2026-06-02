import { headers } from "next/headers";

import { QueryClientProvider } from "@/components/query-client-provider";
import { WorkspaceShell } from "./workspace-shell";

export async function WorkspaceContent({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // 检查是否从嵌入页面加载，如果是则隐藏侧边栏
  const headersList = await headers();
  const referer = headersList.get("referer") || "";
  const isEmbedded = referer.includes("deerflow-chat.html");

  if (isEmbedded) {
    // 嵌入模式：不显示侧边栏，只显示对话内容
    return (
      <QueryClientProvider>
        <div className="h-screen w-full">{children}</div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider>
      <WorkspaceShell>{children}</WorkspaceShell>
    </QueryClientProvider>
  );
}
