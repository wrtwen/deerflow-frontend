"use client";

import { BarChart3, BotIcon, Brain, ClipboardPen } from "lucide-react";

import { type Agent } from "@/core/agents";
import { cn } from "@/lib/utils";

const welcomeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "hazard-intel": Brain,
  "hazard-input": ClipboardPen,
  "hazard-stats": BarChart3,
};

const welcomeDisplayNames: Record<string, string> = {
  "hazard-intel": "隐患智能助手",
  "hazard-input": "隐患录入助手",
  "hazard-stats": "隐患统计分析助手",
};

export function AgentWelcome({
  className,
  agent,
  agentName,
}: {
  className?: string;
  agent: Agent | null | undefined;
  agentName: string;
}) {
  const displayName = agent?.display_name || agent?.name || welcomeDisplayNames[agentName] || agentName;
  const description = agent?.description;
  const IconComponent = welcomeIcons[agentName] ?? BotIcon;

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col items-center justify-center gap-1.5 px-4 py-3 text-center sm:gap-2 sm:px-8 sm:py-4",
        className,
      )}
    >
      <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12">
        <IconComponent className="text-primary h-5 w-5 sm:h-6 sm:w-6" />
      </div>
      <div className="text-lg font-bold sm:text-2xl">{displayName}</div>
      {description && (
        <p className="text-muted-foreground max-w-sm text-xs sm:text-sm">{description}</p>
      )}
    </div>
  );
}
