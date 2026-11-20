"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonVariantProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const inputCls =
  "block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function SubmitButton({
  children,
  pendingText = "Saving…",
  variant = "navy",
  className,
  ...rest
}: { children: React.ReactNode; pendingText?: string; className?: string } & ButtonVariantProps &
  React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size="sm" disabled={pending} className={className} {...rest}>
      {pending ? pendingText : children}
    </Button>
  );
}

export function Notice({ state }: { state: { error?: string; ok?: string } | null }) {
  if (!state) return null;
  if (state.error)
    return (
      <p
        role="alert"
        className="rounded-md border-l-4 border-accent bg-red-50 px-3 py-2 text-sm font-medium text-accent"
      >
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p
        role="status"
        className="rounded-md border-l-4 border-secondary bg-green-50 px-3 py-2 text-sm font-medium text-secondary"
      >
        {state.ok}
      </p>
    );
  return null;
}

export function FieldShell({
  label,
  htmlFor,
  help,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  help?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-primary">
        {label}
        {required ? <span className="text-accent"> *</span> : null}
      </label>
      {children}
      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
    </div>
  );
}

export function ConfirmButton({
  action,
  label,
  message,
}: {
  action: () => Promise<void>;
  label: string;
  message: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      <SubmitButton variant="danger" pendingText="Deleting…">
        {label}
      </SubmitButton>
    </form>
  );
}
