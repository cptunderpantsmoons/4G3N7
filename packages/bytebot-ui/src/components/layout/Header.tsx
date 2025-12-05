import React from "react";
import Link from "next/link";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DocumentCodeIcon,
  TaskDaily01Icon,
  Home01Icon,
  ComputerIcon,
} from "@hugeicons/core-free-icons";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Home", href: "/", icon: Home01Icon },
  { label: "Tasks", href: "/tasks", icon: TaskDaily01Icon },
  { label: "Desktop", href: "/desktop", icon: ComputerIcon },
  { label: "Docs", href: "https://docs.bytebot.ai/quickstart", icon: DocumentCodeIcon, external: true },
];

export function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)]/80 bg-[#05080f]/80 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/4g3n7-wordmark.svg"
              alt="4G3N7"
              width={140}
              height={34}
              priority
              className="h-8 w-auto drop-shadow-[0_8px_24px_rgba(39,245,197,0.3)]"
            />
          </Link>
          <div className="hidden h-6 w-px bg-[var(--border)]/60 lg:block" />
          <nav className="hidden items-center gap-1 rounded-full border border-[var(--border)]/80 bg-[rgba(255,255,255,0.03)] px-1 py-1 text-sm lg:flex">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const base = "flex items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-150";
              const activeClasses =
                "bg-[rgba(39,245,197,0.12)] text-[var(--foreground)] shadow-[0_0_0_1px_rgba(39,245,197,0.5)]";
              const inactiveClasses =
                "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.06)]";

              const content = (
                <>
                  <HugeiconsIcon
                    icon={item.icon}
                    className={`h-4 w-4 ${active ? "text-[var(--color-4g3n7-electric)]" : "text-[var(--muted-foreground)]"}`}
                  />
                  <span>{item.label}</span>
                </>
              );

              return item.external ? (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${base} ${active ? activeClasses : inactiveClasses}`}
                >
                  {content}
                </a>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`${base} ${active ? activeClasses : inactiveClasses}`}
                >
                  {content}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)] md:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-4g3n7-electric)]" />
            <span>Live</span>
          </div>
          <Link
            href="/tasks"
            className="glow-ring inline-flex items-center gap-2 rounded-full bg-[var(--color-4g3n7-electric)] px-4 py-2 text-[var(--color-4g3n7-ink)]"
          >
            <span className="text-sm font-semibold">Launch Task</span>
            <HugeiconsIcon icon={TaskDaily01Icon} className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
