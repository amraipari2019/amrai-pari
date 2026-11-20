"use client";

import { createContext, useActionState, useContext, useEffect, useId, useRef, useState } from "react";
import Script from "next/script";
import { useLocale, useTranslations } from "next-intl";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initialFormState, type FormState } from "@/lib/forms/types";
import { cn } from "@/lib/utils";

type Action = (state: FormState, fd: FormData) => Promise<FormState>;

const ErrorsContext = createContext<Record<string, string>>({});

/**
 * Shared shell for every public form: progressive enhancement (works without
 * JS), bilingual errors, honeypot + timing bot checks, optional Turnstile,
 * and a success panel showing the reference number.
 */
export function PublicForm({
  action,
  submitLabel,
  children,
  hidden,
  turnstileSiteKey,
}: {
  action: Action;
  submitLabel: string;
  children: React.ReactNode;
  hidden?: Record<string, string>;
  turnstileSiteKey?: string;
}) {
  const t = useTranslations("form");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const startedRef = useRef<HTMLInputElement>(null);
  const [formKey, setFormKey] = useState(0);
  const [dismissed, setDismissed] = useState("");
  const successRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLParagraphElement>(null);

  // Record when the form appeared (client only) for the bot-timing check.
  useEffect(() => {
    if (startedRef.current) startedRef.current.value = String(Date.now());
  }, [formKey, state]);
  useEffect(() => {
    if (state.status === "success") successRef.current?.focus();
    if (state.status === "error") alertRef.current?.focus();
  }, [state]);

  if (state.status === "success" && state.reference !== dismissed) {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="rounded-lg border-2 border-secondary bg-white p-8 text-center outline-none"
      >
        <CircleCheck className="mx-auto size-12 text-secondary" aria-hidden />
        <h3 className="mt-4 text-2xl font-bold text-primary">{t("successTitle")}</h3>
        <p className="mt-2 text-lg">{t("successBody")}</p>
        <p className="mt-3 inline-block rounded bg-muted px-4 py-2 font-mono text-xl font-bold tracking-wider text-primary">
          {state.reference}
        </p>
        <div>
          <Button
            variant="ghost"
            className="mt-6"
            onClick={() => {
              setDismissed(state.reference);
              setFormKey((k) => k + 1);
            }}
          >
            {t("sendAnother")}
          </Button>
        </div>
      </div>
    );
  }

  const fieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const errorText =
    state.status === "error"
      ? {
          fields: t("errorFields"),
          generic: t("errorGeneric"),
          notReady: t("errorNotReady"),
          captcha: t("errorCaptcha"),
        }[state.error]
      : null;

  return (
    <ErrorsContext.Provider value={fieldErrors}>
      <form key={formKey} action={formAction} className="space-y-5" noValidate>
        {errorText ? (
          <p
            ref={alertRef}
            tabIndex={-1}
            role="alert"
            className="rounded-lg border-l-4 border-accent bg-red-50 px-4 py-3 font-medium text-accent outline-none"
          >
            {errorText}
          </p>
        ) : null}
        <input ref={startedRef} type="hidden" name="_t" defaultValue="" />
        <input type="hidden" name="_locale" value={locale} />
        {Object.entries(hidden ?? {}).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        {/* Honeypot: invisible to people, tempting to bots */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        {children}
        {turnstileSiteKey ? (
          <>
            <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
            <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-language={locale} />
          </>
        ) : null}
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending ? t("sending") : submitLabel}
        </Button>
      </form>
    </ErrorsContext.Provider>
  );
}

function useFieldError(name: string) {
  const errors = useContext(ErrorsContext);
  const t = useTranslations("form");
  const key = errors[name];
  return key ? t(key as "err_required") : null;
}

const inputClass =
  "block w-full rounded-lg border-2 border-border bg-white px-3.5 py-2.5 text-base transition-colors focus:border-primary focus:outline-none aria-[invalid=true]:border-accent";

function Label({ htmlFor, label, required }: { htmlFor: string; label: string; required?: boolean }) {
  const t = useTranslations("form");
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block font-semibold text-primary">
      {label}
      {required ? (
        <span className="text-accent" aria-hidden>
          {" "}
          *
        </span>
      ) : (
        <span className="ml-1.5 text-sm font-normal text-muted-foreground">({t("optional")})</span>
      )}
    </label>
  );
}

function ErrorText({ id, error }: { id: string; error: string | null }) {
  return error ? (
    <p id={id} className="mt-1.5 text-sm font-medium text-accent">
      {error}
    </p>
  ) : null;
}

export function TextField({
  name,
  label,
  required,
  type = "text",
  hint,
  ...rest
}: {
  name: string;
  label: string;
  required?: boolean;
  type?: string;
  hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "type">) {
  const id = useId();
  const error = useFieldError(name);
  return (
    <div>
      <Label htmlFor={id} label={label} required={required} />
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className={inputClass}
        {...rest}
      />
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <ErrorText id={`${id}-err`} error={error} />
    </div>
  );
}

export function TextArea({
  name,
  label,
  required,
  hint,
  rows = 5,
}: {
  name: string;
  label: string;
  required?: boolean;
  hint?: string;
  rows?: number;
}) {
  const id = useId();
  const error = useFieldError(name);
  return (
    <div>
      <Label htmlFor={id} label={label} required={required} />
      {hint ? (
        <p id={`${id}-hint`} className="-mt-0.5 mb-1.5 text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <textarea
        id={id}
        name={name}
        rows={rows}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className={inputClass}
      />
      <ErrorText id={`${id}-err`} error={error} />
    </div>
  );
}

export function SelectField({
  name,
  label,
  required,
  options,
  placeholder = "—",
}: {
  name: string;
  label: string;
  required?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const id = useId();
  const error = useFieldError(name);
  return (
    <div>
      <Label htmlFor={id} label={label} required={required} />
      <select
        id={id}
        name={name}
        required={required}
        defaultValue=""
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className={inputClass}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ErrorText id={`${id}-err`} error={error} />
    </div>
  );
}

export function ChoiceGroup({
  name,
  label,
  options,
  multiple,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  multiple?: boolean;
}) {
  const error = useFieldError(name);
  const t = useTranslations("form");
  return (
    <fieldset>
      <legend className="mb-2 font-semibold text-primary">
        {label} <span className="ml-1 text-sm font-normal text-muted-foreground">({t("optional")})</span>
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-border px-3 py-2.5 has-[:checked]:border-primary has-[:checked]:bg-muted"
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              name={name}
              value={o.value}
              className="size-4 accent-[var(--primary)]"
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      <ErrorText id={`${name}-err`} error={error} />
    </fieldset>
  );
}

export function ConsentField() {
  const t = useTranslations("form");
  const error = useFieldError("consent");
  const id = useId();
  return (
    <div>
      <label className={cn("flex cursor-pointer items-start gap-3", error && "text-accent")}>
        <input
          type="checkbox"
          name="consent"
          required
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className="mt-1 size-5 shrink-0 accent-[var(--primary)]"
        />
        <span>{t("consent")}</span>
      </label>
      <ErrorText id={`${id}-err`} error={error} />
    </div>
  );
}
