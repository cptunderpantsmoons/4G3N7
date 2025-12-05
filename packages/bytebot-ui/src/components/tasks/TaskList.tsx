"use client";

import React, { useEffect, useState, useCallback } from "react";
import { TaskItem } from "@/components/tasks/TaskItem";
import { fetchTasks } from "@/utils/taskUtils";
import { Task } from "@/types";
import { useWebSocket } from "@/hooks/useWebSocket";

interface TaskListProps {
  limit?: number;
  className?: string;
  title?: string;
  description?: string;
  showHeader?: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({ 
  limit = 5, 
  className = "", 
  title = "Latest Tasks",
  description,
  showHeader = true,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // WebSocket handlers for real-time updates
  const handleTaskUpdate = useCallback((updatedTask: Task) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    );
  }, []);

  const handleTaskCreated = useCallback((newTask: Task) => {
    setTasks(prev => {
      const updated = [newTask, ...prev];
      return updated.slice(0, limit);
    });
  }, [limit]);

  const handleTaskDeleted = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  // Initialize WebSocket for task list updates
  useWebSocket({
    onTaskUpdate: handleTaskUpdate,
    onTaskCreated: handleTaskCreated,
    onTaskDeleted: handleTaskDeleted,
  });

  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      try {
        const result = await fetchTasks({ limit });
        setTasks(result.tasks);
      } catch (error) {
        console.error("Failed to load tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [limit]);

  return (
    <div className={className}>
      {showHeader && (
        <div className="mb-6 flex flex-col gap-1">
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            {title}
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            {description}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border border-[var(--border)]/70 bg-[rgba(255,255,255,0.03)] p-4 text-center text-[var(--muted-foreground)] shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
          <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--color-4g3n7-electric)]" />
          <p className="text-sm">Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)]/80 bg-[rgba(255,255,255,0.02)] p-4 text-center shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
          <p className="text-sm text-[var(--muted-foreground)]">No tasks available</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]/80">Your completed tasks will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};
