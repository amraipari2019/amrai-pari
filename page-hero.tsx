import { cn } from "@/lib/utils";

/** Inner-page header: sky field from the logo, navy title, bands underneath. */
export function PageHero({
  title,
  intro,
  children,
  className,
}: {
  title: string;
  intro?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("bg-sky", className)}>
      <div className="mx-auto max-w-6xl px-4 pt-14 pb-12 sm:px-6 sm:pt-20">
        <h1 className="max-w-3xl text-4xl font-bold text-primary sm:text-5xl">{title}</h1>
        {intro ? <p className="mt-4 max-w-2xl text-lg text-primary/80">{intro}</p> : null}
        {children}
      </div>
      <div className="bands" aria-hidden />
    </header>
  );
}

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>;
}

export function SectionTitle({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold text-primary sm:text-4xl">{title}</h2>
        {body ? <p className="mt-2 text-muted-foreground">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border bg-muted px-6 py-10 text-center text-muted-foreground">
      {children}
    </p>
  );
}

export function Prose({ text, className }: { text: string; className?: string }) {
  const parts = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className={cn("prose-body max-w-[68ch] text-lg leading-relaxed", className)}>
      {parts.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}
