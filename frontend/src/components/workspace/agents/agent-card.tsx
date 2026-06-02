"use client";

import { BarChart3, BotIcon, Brain, ClipboardPen, MessageSquareIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Agent } from "@/core/agents";
import { useI18n } from "@/core/i18n/hooks";

interface AgentCardProps {
  agent: Agent;
}

const agentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "hazard-intel": Brain,
  "hazard-input": ClipboardPen,
  "hazard-stats": BarChart3,
};

const agentDisplayNames: Record<string, string> = {
  "hazard-intel": "隐患智能助手",
  "hazard-input": "隐患录入助手",
  "hazard-stats": "隐患统计分析助手",
};

export function AgentCard({ agent }: AgentCardProps) {
  const { t } = useI18n();
  const router = useRouter();
  const AgentIcon = agentIcons[agent.name] ?? BotIcon;

  function handleChat() {
    router.push(`/workspace/agents/${agent.name}/chats/new`);
  }

  return (
    <Card className="group flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3 max-sm:pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 max-sm:gap-1.5">
            <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg max-sm:h-7 max-sm:w-7">
              <AgentIcon className="h-5 w-5 max-sm:h-4 max-sm:w-4" />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base max-sm:text-sm">
                {agent.display_name || agentDisplayNames[agent.name] || agent.name}
              </CardTitle>
              {agent.model && (
                <Badge variant="secondary" className="mt-0.5 text-xs max-sm:hidden">
                  {agent.model}
                </Badge>
              )}
            </div>
          </div>
        </div>
        {agent.description && (
          <CardDescription className="mt-2 line-clamp-2 text-sm max-sm:mt-1 max-sm:line-clamp-1 max-sm:text-xs">
            {agent.description}
          </CardDescription>
        )}
      </CardHeader>

      {(agent.tool_groups?.length ?? agent.skills?.length ?? 0) > 0 && (
        <CardContent className="pt-0 pb-3 max-sm:hidden">
          <div className="flex flex-wrap gap-1">
            {agent.tool_groups?.map((group) => (
              <Badge
                key={`tg:${group}`}
                variant="outline"
                className="text-xs"
              >
                {group}
              </Badge>
            ))}
            {agent.skills?.map((skill) => (
              <Badge
                key={`sk:${skill}`}
                variant="secondary"
                className="text-xs"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </CardContent>
      )}

      <CardFooter className="mt-auto pt-3 max-sm:pt-2">
        <Button size="sm" className="w-full" onClick={handleChat}>
          <MessageSquareIcon className="mr-1.5 h-3.5 w-3.5" />
          {t.agents.chat}
        </Button>
      </CardFooter>
    </Card>
  );
}
