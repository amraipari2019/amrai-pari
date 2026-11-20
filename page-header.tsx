export function AdminHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-primary">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-border bg-white p-6 ${className}`}>{children}</div>;
}

export function Flash({ params }: { params: Record<string, string | string[] | undefined> }) {
  const msg = params.saved
    ? "Saved. The website shows the change now."
    : params.created
      ? "Created. Remember to tick “Show on the website” when it's ready."
      : params.deleted
        ? "Deleted."
        : params.denied
          ? "Your role doesn't have access to that page."
          : typeof params.error === "string"
            ? params.error
            : null;
  if (!msg) return null;
  const bad = !!params.denied || typeof params.error === "string";
  return (
    <p
      role="status"
      className={`mb-6 rounded-md border-l-4 px-3 py-2 text-sm font-medium ${bad ? "border-accent bg-red-50 text-accent" : "border-secondary bg-green-50 text-secondary"}`}
    >
      {msg}
    </p>
  );
}
