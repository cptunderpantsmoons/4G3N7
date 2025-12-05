const Swatch = ({ name, value }: { name: string; value: string }) => (
  <div className="flex flex-col gap-2 rounded-2xl border border-[var(--border)]/70 bg-[rgba(255,255,255,0.04)] p-4">
    <div className="h-16 rounded-xl" style={{ backgroundColor: value }} />
    <p className="text-sm font-semibold text-[var(--foreground)]">{name}</p>
    <p className="text-xs text-[var(--muted-foreground)]">{value}</p>
  </div>
);

export default function BrandingPage() {
  return (
    <div className="relative min-h-screen bg-[var(--background)]">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="mesh-overlay absolute inset-0" />
      </div>
      <div className="relative mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-16 pt-12">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Brand System</p>
          <h1 className="text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">
            4G3N7 visual language
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-[var(--muted-foreground)]">
            A concise reference for the 4G3N7 identity. Use this page alongside the repository guide in
            <code className="mx-1 rounded bg-[rgba(255,255,255,0.06)] px-2 py-1 text-[var(--foreground)]">docs/BRANDING.md</code>
            to keep UI surfaces consistent.
          </p>
        </div>

        <section className="grid gap-6 rounded-3xl border border-[var(--border)]/70 bg-[rgba(14,20,34,0.9)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] lg:grid-cols-[1.2fr,1fr]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Core palette</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Swatch name="Ink" value="#04060D" />
              <Swatch name="Surface" value="#0F1628" />
              <Swatch name="Panel" value="#121C33" />
              <Swatch name="Electric" value="#27F5C5" />
              <Swatch name="Signal" value="#F6C452" />
              <Swatch name="Heat" value="#FF6B4A" />
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)]/60 bg-[rgba(255,255,255,0.04)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Usage</p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
              <li>Primary CTA + focus: Electric → hover Signal.</li>
              <li>Backgrounds: Ink to Surface gradients; border with #1F2A45.</li>
              <li>Warnings &amp; approvals: Heat backgrounds with Ink text.</li>
              <li>Success + status dots: Electric or Ice; keep contrast high.</li>
            </ul>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-[var(--border)]/70 bg-[rgba(14,20,34,0.9)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] lg:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Typography</p>
            <div className="rounded-2xl border border-[var(--border)]/60 bg-[rgba(255,255,255,0.04)] p-4">
              <p className="font-heading text-2xl text-[var(--foreground)]">Space Grotesk — headlines</p>
              <p className="font-body text-sm text-[var(--muted-foreground)]">Weights 600–700, -0.02em tracking, generous line-height.</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)]/60 bg-[rgba(255,255,255,0.04)] p-4">
              <p className="font-body text-xl text-[var(--foreground)]">Manrope — body &amp; UI</p>
              <p className="text-sm text-[var(--muted-foreground)]">Weights 400–600, neutral tone. Prefer uppercase labels with wide tracking for status.</p>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Logos</p>
            <div className="rounded-2xl border border-[var(--border)]/60 bg-[rgba(255,255,255,0.04)] p-4">
              <p className="text-sm text-[var(--foreground)]">
                Primary wordmark lives at `packages/bytebot-ui/public/4g3n7-wordmark.svg`.
              </p>
              <p className="text-sm text-[var(--foreground)]">
                Glyph lives at `packages/bytebot-ui/public/4g3n7-glyph.svg` for avatars/favicons.
              </p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Keep 16px padding, avoid stretching, and stick to Electric on Ink for most contexts. Invert on light backgrounds.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--border)]/70 bg-[rgba(14,20,34,0.9)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Voice &amp; motion</p>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)]/60 bg-[rgba(255,255,255,0.04)] p-4">
              <p className="text-sm font-semibold text-[var(--foreground)]">Tone</p>
              <p className="text-sm text-[var(--muted-foreground)]">Concrete, outcome-first, short verbs. Avoid generic AI jargon.</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)]/60 bg-[rgba(255,255,255,0.04)] p-4">
              <p className="text-sm font-semibold text-[var(--foreground)]">Motion</p>
              <p className="text-sm text-[var(--muted-foreground)]">Ease-out 150–220ms, slight elevation on hover, staggered list reveals.</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)]/60 bg-[rgba(255,255,255,0.04)] p-4">
              <p className="text-sm font-semibold text-[var(--foreground)]">Composition</p>
              <p className="text-sm text-[var(--muted-foreground)]">Wide breathing room, thin dividers, mesh gradients behind key sections.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
