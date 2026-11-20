"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/admin/actions";
import { Notice } from "./ui";

/** Wrap any server-action form to show its success / error message. */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (state: ActionState, fd: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={className}>
      <div className="mb-4 empty:hidden">
        <Notice state={state} />
      </div>
      {children}
    </form>
  );
}
