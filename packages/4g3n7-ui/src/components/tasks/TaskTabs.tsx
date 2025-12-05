import React from "react";
import { TaskStatus } from "@/types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tick02Icon,
  CursorProgress04Icon,
  MultiplicationSignIcon,
  ListViewIcon,
} from "@hugeicons/core-free-icons";

type TabKey = "ALL" | "ACTIVE" | "COMPLETED" | "CANCELLED_FAILED";

interface TaskTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  taskCounts: Record<TabKey, number>;
}

interface TabConfig {
  label: string;
  icon:
    | typeof Tick02Icon
    | typeof CursorProgress04Icon
    | typeof MultiplicationSignIcon
    | typeof ListViewIcon;
  color: string;
  statuses: TaskStatus[];
}

const TAB_CONFIGS: Record<TabKey, TabConfig> = {
  ALL: {
    label: "All",
    icon: ListViewIcon,
    color: "text-[var(--muted-foreground)]",
    statuses: Object.values(TaskStatus),
  },
  ACTIVE: {
    label: "Active",
    icon: CursorProgress04Icon,
    color: "text-[var(--muted-foreground)]",
    statuses: [
      TaskStatus.PENDING,
      TaskStatus.RUNNING,
      TaskStatus.NEEDS_HELP,
      TaskStatus.NEEDS_REVIEW,
    ],
  },
  COMPLETED: {
    label: "Completed",
    icon: Tick02Icon,
    color: "text-[var(--muted-foreground)]",
    statuses: [TaskStatus.COMPLETED],
  },
  CANCELLED_FAILED: {
    label: "Cancelled/Failed",
    icon: MultiplicationSignIcon,
    color: "text-[var(--muted-foreground)]",
    statuses: [TaskStatus.CANCELLED, TaskStatus.FAILED],
  },
};

export const TaskTabs: React.FC<TaskTabsProps> = ({
  activeTab,
  onTabChange,
  taskCounts,
}) => {
  const tabs = Object.entries(TAB_CONFIGS) as [TabKey, TabConfig][];

  return (
    <div className="mb-6 border-b border-[var(--border)]/70">
      <div className="flex overflow-x-auto">
        {tabs.map(([tabKey, config]) => {
          const isActive = activeTab === tabKey;
          const count = taskCounts[tabKey] || 0;

          return (
            <button
              key={tabKey}
              onClick={() => onTabChange(tabKey)}
              className={`flex cursor-pointer items-center space-x-2 border-b-2 px-4 py-3 whitespace-nowrap transition-colors ${
                isActive
                  ? "border-[var(--color-4g3n7-electric)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              <HugeiconsIcon
                icon={config.icon}
                className={`h-4 w-4 ${isActive ? "text-[var(--color-4g3n7-electric)]" : config.color}`}
              />
              <span className="text-sm font-medium">{config.label}</span>
              {count > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    isActive
                      ? "bg-[var(--color-4g3n7-electric)] text-[var(--color-4g3n7-ink)]"
                      : "bg-[rgba(255,255,255,0.06)] text-[var(--foreground)]"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Export the TabKey type and TAB_CONFIGS for use in other components
export type { TabKey };
export { TAB_CONFIGS };
