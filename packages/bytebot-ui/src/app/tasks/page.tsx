"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { TaskItem } from "@/components/tasks/TaskItem";
import { TaskTabs, TabKey, TAB_CONFIGS } from "@/components/tasks/TaskTabs";
import { Pagination } from "@/components/ui/pagination";
import { fetchTasks, fetchTaskCounts } from "@/utils/taskUtils";
import { Task } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";

function TasksPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize activeTab from URL params
  const getInitialTab = (): TabKey => {
    const tabParam = searchParams.get("tab");
    if (tabParam && Object.keys(TAB_CONFIGS).includes(tabParam)) {
      return tabParam as TabKey;
    }
    return "ALL";
  };

  const [activeTab, setActiveTab] = useState<TabKey>(getInitialTab);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [taskCounts, setTaskCounts] = useState<Record<TabKey, number>>({
    ALL: 0,
    ACTIVE: 0,
    COMPLETED: 0,
    CANCELLED_FAILED: 0,
  });
  const PAGE_SIZE = 10;

  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      try {
        const statuses =
          activeTab === "ALL" ? undefined : TAB_CONFIGS[activeTab].statuses;
        const result = await fetchTasks({
          page: currentPage,
          limit: PAGE_SIZE,
          statuses,
        });
        setTasks(result.tasks);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } catch (error) {
        console.error("Failed to load tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [currentPage, activeTab]);

  useEffect(() => {
    const loadTaskCounts = async () => {
      try {
        const counts = await fetchTaskCounts();
        setTaskCounts(counts);
      } catch (error) {
        console.error("Failed to load task counts:", error);
      }
    };

    loadTaskCounts();
  }, []);

  // Sync activeTab with URL params when they change
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const newTab: TabKey =
      tabParam && Object.keys(TAB_CONFIGS).includes(tabParam)
        ? (tabParam as TabKey)
        : "ALL";

    if (newTab !== activeTab) {
      setActiveTab(newTab);
      setCurrentPage(1);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setCurrentPage(1);

    // Update URL with the new tab
    const newSearchParams = new URLSearchParams(searchParams);
    if (tab === "ALL") {
      newSearchParams.delete("tab");
    } else {
      newSearchParams.set("tab", tab);
    }

    const newUrl = `/tasks${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ""}`;
    router.push(newUrl, { scroll: false });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />

      <main className="flex-1 overflow-scroll px-6 pt-6 pb-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                Missions
              </p>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">
                Tasks
              </h1>
            </div>
            <Link
              href="/"
              className="glow-ring inline-flex items-center gap-2 rounded-full bg-[var(--color-4g3n7-electric)] px-4 py-2 text-[var(--color-4g3n7-ink)]"
            >
              <span className="text-sm font-semibold">New Task</span>
              <span className="text-lg leading-none">+</span>
            </Link>
          </div>

          {!isLoading && (
            <TaskTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              taskCounts={taskCounts}
            />
          )}

          {isLoading ? (
            <div className="rounded-2xl border border-[var(--border)]/70 bg-[rgba(255,255,255,0.03)] p-8 text-center shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-3 border-[var(--border)] border-t-[var(--color-4g3n7-electric)]" />
              <p className="text-[var(--muted-foreground)]">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)]/70 bg-[rgba(14,20,34,0.9)] p-8 text-center shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
              <div className="flex flex-col items-center justify-center space-y-2">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                  No tasks yet
                </h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Get started by creating a first task
                </p>
                <Link href="/">
                  <Button variant="default">+ New Task</Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {tasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  total={total}
                  pageSize={PAGE_SIZE}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function TasksPageFallback() {
  return (
    <div className="p-8 text-center text-[var(--muted-foreground)]">
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-3 border-[var(--border)] border-t-[var(--color-4g3n7-electric)]" />
      <p>Loading tasks...</p>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<TasksPageFallback />}>
      <TasksPageContent />
    </Suspense>
  );
}
