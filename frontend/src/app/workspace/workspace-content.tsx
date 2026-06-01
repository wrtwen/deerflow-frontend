import { cookies, headers } from "next/headers";
import { Toaster } from "sonner";

import { QueryClientProvider } from "@/components/query-client-provider";
import { CommandPalette } from "@/components/workspace/command-palette";
import { SettingsDialog } from "@/components/workspace/settings";

function parseSidebarOpenCookie(
  value: string | undefined,
): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export async function WorkspaceContent({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const initialSidebarOpen = parseSidebarOpenCookie(
    cookieStore.get("sidebar_state")?.value,
  );

  // 检查是否从嵌入页面加载，如果是则隐藏侧边栏
  const headersList = await headers();
  const referer = headersList.get("referer") || "";
  const isEmbedded = referer.includes("deerflow-chat.html");

  if (isEmbedded) {
    // 嵌入模式：不显示侧边栏，只显示对话内容
    return (
      <QueryClientProvider>
        <div className="h-screen w-full">{children}</div>
        <Toaster position="top-center" />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider>
      <div className="h-screen w-full">{children}</div>
      <CommandPalette />
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
