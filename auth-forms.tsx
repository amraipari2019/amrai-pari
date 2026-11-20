"use client";

import { useActionState } from "react";
import { requestPasswordReset, signIn } from "@/lib/admin/actions";
import { inputCls, Notice, SubmitButton } from "./ui";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(signIn, null);
  return (
    <form action={action} className="space-y-4">
      <Notice state={state} />
      <input type="hidden" name="next" value={next} />
      <label className="block text-sm font-semibold text-primary">
        Email
        <input name="email" type="email" autoComplete="username" required className={`${inputCls} mt-1`} />
      </label>
      <label className="block text-sm font-semibold text-primary">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={`${inputCls} mt-1`}
        />
      </label>
      <SubmitButton pendingText="Signing in…" className="w-full">
        Sign in
      </SubmitButton>
    </form>
  );
}

export function ForgotForm() {
  const [state, action] = useActionState(requestPasswordReset, null);
  return (
    <form action={action} className="space-y-4">
      <Notice state={state} />
      <label className="block text-sm font-semibold text-primary">
        Email
        <input name="email" type="email" autoComplete="username" required className={`${inputCls} mt-1`} />
      </label>
      <SubmitButton pendingText="Sending…" className="w-full">
        Send reset link
      </SubmitButton>
    </form>
  );
}
