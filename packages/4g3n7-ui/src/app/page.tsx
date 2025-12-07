"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { ChatInput } from "@/components/messages/ChatInput";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { startTask } from "@/utils/taskUtils";
import { Model } from "@/types";
import { TaskList } from "@/components/tasks/TaskList";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SecurityValidationIcon,
  Target02Icon,
  NoodlesIcon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";

interface FileWithBase64 {
  name: string;
  base64: string;
  type: string;
  size: number;
}

const CpuBoltIcon = SecurityValidationIcon;
const ChartSuccessIcon = NoodlesIcon;

const FeatureCard = ({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon: typeof CpuBoltIcon;
}) => (
  <div className="group relative overflow-hidden rounded-2xl border border-[var(--border)]/70 bg-[rgba(20,26,42,0.6)] p-5 shadow-[0_18px_70px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:-translate-y-1">
    <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
      <div className="mesh-overlay h-full w-full" />
    </div>
    <div className="relative flex h-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(39,245,197,0.12)] text-[var(--color-4g3n7-electric)]">
          <HugeiconsIcon icon={icon} className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--foreground)]">
          {title}
        </h3>
      </div>
      <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
        {body}
      </p>
    </div>
  </div>
);

export default function Home() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileWithBase64[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/tasks/models")
      .then((res) => res.json())
      .then((data) => {
        setModels(data);
        if (data.length > 0) setSelectedModel(data[0]);
      })
      .catch((err) => console.error("Failed to load models", err));
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    setIsLoading(true);

    try {
      if (!selectedModel) throw new Error("No model selected");
      const taskData: {
        description: string;
        model: Model;
        files?: FileWithBase64[];
      } = {
        description: input,
        model: selectedModel,
      };

      if (uploadedFiles.length > 0) {
        taskData.files = uploadedFiles;
      }

      const task = await startTask(taskData);

      if (task && task.id) {
        router.push(`/tasks/${task.id}`);
      } else {
        console.error("Failed to create task");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (files: FileWithBase64[]) => {
    setUploadedFiles(files);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="mesh-overlay absolute inset-0" />
        <div className="absolute left-[-20%] top-[-30%] h-[60vh] w-[60vh] rounded-full bg-[rgba(39,245,197,0.14)] blur-[140px]" />
        <div className="absolute right-[-10%] top-[20%] h-[45vh] w-[45vh] rounded-full bg-[rgba(246,196,82,0.14)] blur-[120px]" />
      </div>

      <Header />

      <main className="relative z-10">
        <section className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-14 pt-10 lg:flex-row lg:items-start lg:gap-14 lg:pt-16">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)]/80 bg-[rgba(255,255,255,0.05)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
              <span className="h-2 w-2 rounded-full bg-[var(--color-4g3n7-electric)]" />
              Autonomy Control Plane
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-[1.1] text-[var(--foreground)] sm:text-5xl lg:text-6xl">
                4G3N7 is the operating system for autonomous teams.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-[var(--muted-foreground)]">
                Orchestrate agents, humans, and workflows in one neon-quiet
                cockpit. Build runbooks, supervise execution, and keep every
                action observable, auditable, and on-brand.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/tasks"
                className="glow-ring inline-flex items-center gap-2 rounded-full bg-[var(--color-4g3n7-electric)] px-6 py-3 text-[var(--color-4g3n7-ink)]"
              >
                <span className="text-base font-semibold">Start a mission</span>
                <HugeiconsIcon icon={Target02Icon} className="h-4 w-4" />
              </Link>
              <Link
                href="https://docs.bytebot.ai/quickstart"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)]/80 bg-[rgba(255,255,255,0.04)] px-5 py-3 text-[var(--foreground)] transition hover:border-[var(--color-4g3n7-electric)]/60"
              >
                <span className="text-base font-semibold">View docs</span>
                <HugeiconsIcon icon={SecurityValidationIcon} className="h-4 w-4 text-[var(--color-4g3n7-ice)]" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "SLO uplift", value: "3.2x faster cycles" },
                { label: "Guardrails", value: "Policy-aware approvals" },
                { label: "Observability", value: "Trace every decision" },
                { label: "Uptime", value: "99.9% managed agents" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-[var(--border)]/80 bg-[rgba(255,255,255,0.03)] px-4 py-3"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-[var(--foreground)]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <div className="relative overflow-hidden rounded-3xl border border-[var(--border)]/70 bg-[rgba(14,20,34,0.9)] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <div className="absolute inset-0 opacity-40">
                <div className="mesh-overlay h-full w-full" />
              </div>
              <div className="relative flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                      Mission Control
                    </p>
                    <p className="text-xl font-semibold text-[var(--foreground)]">
                      Brief 4G3N7 and deploy
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-[var(--border)]/70 bg-[rgba(255,255,255,0.05)] px-3 py-1.5 text-xs text-[var(--muted-foreground)]">
                    <span className="h-2 w-2 rounded-full bg-[var(--color-4g3n7-electric)]" />
                    Synced
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border)]/80 bg-[rgba(255,255,255,0.03)] p-4 backdrop-blur">
                  <ChatInput
                    input={input}
                    isLoading={isLoading}
                    onInputChange={setInput}
                    onSend={handleSend}
                    onFileUpload={handleFileUpload}
                    minLines={3}
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Select
                      value={selectedModel?.name}
                      onValueChange={(val) =>
                        setSelectedModel(
                          models.find((m) => m.name === val) || null,
                        )
                      }
                    >
                      <SelectTrigger className="w-auto rounded-full border border-[var(--border)]/70 bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-[var(--foreground)]">
                        <SelectValue placeholder="Model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((m) => (
                          <SelectItem key={m.name} value={m.name}>
                            {m.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 rounded-full border border-[var(--border)]/70 bg-[rgba(39,245,197,0.08)] px-3 py-1.5 text-xs text-[var(--foreground)]">
                      <span className="h-2 w-2 rounded-full bg-[var(--color-4g3n7-electric)]" />
                      Encrypted uplink
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-[var(--border)]/70 bg-[rgba(246,196,82,0.08)] px-3 py-1.5 text-xs text-[var(--foreground)]">
                      <HugeiconsIcon icon={ChartSuccessIcon} className="h-4 w-4 text-[var(--color-4g3n7-signal)]" />
                      SOC2 ready
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--border)]/80 bg-[rgba(255,255,255,0.03)] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                      Current mission
                    </p>
                    <p className="mt-1 text-[var(--foreground)]">
                      Resolve onboarding backlog with triage agent + human approvals.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)]/80 bg-[rgba(39,245,197,0.05)] p-4 text-[var(--foreground)]">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                      Signal
                    </p>
                    <p className="mt-1 text-[var(--foreground)]">
                      Parallel routing enabled · Observability pinned to Grafana.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                System Modules
              </p>
              <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                Build a reliable agent stack without losing control.
              </h2>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[var(--border)]/70 bg-[rgba(255,255,255,0.04)] px-4 py-2 text-xs text-[var(--foreground)]">
              <HugeiconsIcon icon={NoodlesIcon} className="h-4 w-4 text-[var(--color-4g3n7-ice)]" />
              Modular · Secure · Observable
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              title="Orchestration graph"
              body="Compose agents, tools, and humans into repeatable runbooks. Branch safely, pin versions, and replay traces."
              icon={CpuBoltIcon}
            />
            <FeatureCard
              title="Human-in-the-loop"
              body="Inject approvals at any node with contextual evidence and rollback. Keep your operators in the cockpit."
              icon={SecurityValidationIcon}
            />
            <FeatureCard
              title="Full fidelity telemetry"
              body="Ship metrics, spans, and artifacts to your stack. Every decision is observable, compliant, and auditable."
              icon={ChartSuccessIcon}
            />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12">
          <div className="rounded-3xl border border-[var(--border)]/70 bg-[rgba(14,20,34,0.85)] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.4)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  Brand Kit
                </p>
                <h3 className="text-xl font-semibold text-[var(--foreground)]">
                  4G3N7 visual language at a glance.
                </h3>
              </div>
              <Link
                href="/docs/branding"
                className="text-sm text-[var(--color-4g3n7-ice)] underline decoration-[var(--color-4g3n7-ice)]/60 underline-offset-4 hover:text-[var(--color-4g3n7-electric)]"
              >
                View the full kit
              </Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-[1.4fr,1fr]">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { name: "Ink", value: "#04060D" },
                  { name: "Electric", value: "#27F5C5" },
                  { name: "Signal", value: "#F6C452" },
                  { name: "Heat", value: "#FF6B4A" },
                ].map((swatch) => (
                  <div
                    key={swatch.name}
                    className="flex flex-col gap-2 rounded-2xl border border-[var(--border)]/70 bg-[rgba(255,255,255,0.04)] p-4"
                  >
                    <div
                      className="h-16 rounded-xl"
                      style={{ backgroundColor: swatch.value }}
                    />
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {swatch.name}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {swatch.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-[var(--border)]/70 bg-[rgba(255,255,255,0.03)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  Typography
                </p>
                <p className="font-heading mt-2 text-2xl text-[var(--foreground)]">
                  Space Grotesk — headlines
                </p>
                <p className="font-body text-sm text-[var(--muted-foreground)]">
                  Manrope — interface + body copy
                </p>
                <p className="mt-4 text-sm leading-relaxed text-[var(--foreground)]">
                  Tone: precise, cinematic, and quietly confident. Use plenty of
                  negative space, thin strokes, and neon accents for emphasis.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <TaskList
            className="w-full rounded-2xl border border-[var(--border)]/70 bg-[rgba(14,20,34,0.85)] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
            title="Recent missions"
            description="Monitor the latest agent runs, scheduled automations, and approvals that need attention."
          />
        </section>
      </main>
    </div>
  );
}
