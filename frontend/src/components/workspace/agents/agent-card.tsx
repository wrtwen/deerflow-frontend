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

export function AgentCard({ agent }: AgentCardProps) {
  const { t } = useI18n();
  const router = useRouter();
  const AgentIcon = agentIcons[agent.name] ?? BotIcon;

  function handleChat() {
    router.push(`/workspace/agents/${agent.name}/chats/new`);
  }

  return (
    <Card className="group flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
              <AgentIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base">
                {agent.display_name || agent.name}
              </CardTitle>
              {agent.model && (
                <Badge variant="secondary" className="mt-0.5 text-xs">
                  {agent.model}
                </Badge>
              )}
            </div>
          </div>
        </div>
        {agent.description && (
          <CardDescription className="mt-2 line-clamp-2 text-sm">
            {agent.description}
          </CardDescription>
        )}
      </CardHeader>

      {(agent.tool_groups?.length ?? agent.skills?.length ?? 0) > 0 && (
        <CardContent className="pt-0 pb-3">
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

      <CardFooter className="mt-auto pt-3">
        <Button size="sm" className="w-full" onClick={handleChat}>
          <MessageSquareIcon className="mr-1.5 h-3.5 w-3.5" />
          {t.agents.chat}
        </Button>
      </CardFooter>
    </Card>
  );
}
