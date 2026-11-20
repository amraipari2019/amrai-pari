"use client";

import { useActionState, useState } from "react";
import type { ContentResource, Field } from "@/lib/admin/resources";
import { toDhakaInput } from "@/lib/admin/datetime";
import { programIconNames } from "@/components/ui/program-icon";
import type { ActionState } from "@/lib/admin/actions";
import { cn } from "@/lib/utils";
import { ImageField } from "./image-upload";
import { FieldShell, inputCls, Notice, SubmitButton } from "./ui";

type Row = Record<string, unknown>;

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function str(v: unknown) {
  return v === null || v === undefined ? "" : String(v);
}

function Input({
  field,
  col,
  row,
  relations,
  onTitle,
}: {
  field: Field;
  col: string;
  row: Row;
  relations: Record<string, { value: string; label: string }[]>;
  onTitle?: (v: string) => void;
}) {
  const id = `f-${col}`;
  const value = row[col];
  const lang = col.endsWith("_bn") ? "bn" : undefined;
  switch (field.type) {
    case "textarea":
    case "longtext":
      return (
        <textarea
          id={id}
          name={col}
          lang={lang}
          defaultValue={str(value)}
          rows={field.type === "longtext" ? 10 : 3}
          className={inputCls}
        />
      );
    case "number":
      return <input id={id} name={col} type="number" defaultValue={str(value)} className={inputCls} />;
    case "date":
      return (
        <input id={id} name={col} type="date" defaultValue={str(value).slice(0, 10)} className={inputCls} />
      );
    case "datetime":
      return (
        <input
          id={id}
          name={col}
          type="datetime-local"
          defaultValue={toDhakaInput(value)}
          className={inputCls}
        />
      );
    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-sm">
          <input
            id={id}
            name={col}
            type="checkbox"
            defaultChecked={value === true}
            className="size-4 accent-[var(--primary)]"
          />
          {field.label}
        </label>
      );
    case "select":
    case "relation":
    case "icon": {
      const options =
        field.type === "icon"
          ? programIconNames.map((n) => ({ value: n, label: n }))
          : field.type === "relation"
            ? (relations[field.name] ?? [])
            : (field.options ?? []);
      return (
        <select id={id} name={col} defaultValue={str(value)} className={inputCls}>
          {!field.required ? <option value="">—</option> : null}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }
    case "image":
      return null; // handled by ImageField
    default:
      return (
        <input
          id={id}
          name={col}
          lang={lang}
          defaultValue={str(value)}
          className={inputCls}
          onChange={onTitle ? (e) => onTitle(e.target.value) : undefined}
        />
      );
  }
}

export function ContentForm({
  resource,
  row,
  relations,
  action,
}: {
  resource: ContentResource;
  row: Row | null;
  relations: Record<string, { value: string; label: string }[]>;
  action: (state: ActionState, fd: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, null);
  const data = row ?? {};
  const slugField = resource.fields.find((f) => f.type === "slug");
  const [slug, setSlug] = useState(str(data.slug));
  const [slugTouched, setSlugTouched] = useState(!!data.slug);

  return (
    <form action={formAction} className="space-y-6">
      <Notice state={state} />
      <div className="grid gap-5 md:grid-cols-2">
        {resource.fields.map((field) => {
          const full = !field.half;
          if (field.type === "checkbox") {
            return (
              <div key={field.name} className={cn(full && "md:col-span-2")}>
                <Input field={field} col={field.name} row={data} relations={relations} />
                {field.help ? <p className="mt-1 text-xs text-muted-foreground">{field.help}</p> : null}
              </div>
            );
          }
          if (field.type === "image") {
            return (
              <FieldShell key={field.name} label={field.label} help={field.help} className="md:col-span-2">
                <ImageField name={field.name} defaultValue={str(data[field.name])} folder={resource.key} />
              </FieldShell>
            );
          }
          if (field.type === "slug") {
            return (
              <FieldShell
                key={field.name}
                label={field.label}
                help={field.help}
                required
                htmlFor="f-slug"
                className="md:col-span-2"
              >
                <input
                  id="f-slug"
                  name="slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value.toLowerCase());
                  }}
                  className={`${inputCls} font-mono`}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  required
                />
              </FieldShell>
            );
          }
          if (field.bilingual) {
            return (
              <fieldset
                key={field.name}
                className="grid gap-3 rounded-md border border-border p-4 md:col-span-2 md:grid-cols-2"
              >
                <legend className="px-1 text-sm font-semibold text-primary">
                  {field.label}
                  {field.required ? <span className="text-accent"> *</span> : null}
                </legend>
                <FieldShell
                  label="English"
                  htmlFor={`f-${field.name}_en`}
                  className="[&>label]:font-normal [&>label]:text-muted-foreground"
                >
                  <Input
                    field={field}
                    col={`${field.name}_en`}
                    row={data}
                    relations={relations}
                    onTitle={
                      slugField?.slugFrom === `${field.name}_en` && !slugTouched
                        ? (v) => setSlug(slugify(v))
                        : undefined
                    }
                  />
                </FieldShell>
                <FieldShell
                  label="বাংলা (Bangla)"
                  htmlFor={`f-${field.name}_bn`}
                  className="[&>label]:font-normal [&>label]:text-muted-foreground"
                >
                  <Input field={field} col={`${field.name}_bn`} row={data} relations={relations} />
                </FieldShell>
                {field.help ? (
                  <p className="text-xs text-muted-foreground md:col-span-2">{field.help}</p>
                ) : null}
              </fieldset>
            );
          }
          return (
            <FieldShell
              key={field.name}
              label={field.label}
              help={field.help}
              required={field.required}
              htmlFor={`f-${field.name}`}
              className={cn(full && "md:col-span-2")}
            >
              <Input field={field} col={field.name} row={data} relations={relations} />
            </FieldShell>
          );
        })}
      </div>
      <div className="sticky bottom-0 -mx-6 flex items-center gap-3 border-t border-border bg-white px-6 py-3">
        <SubmitButton>{row ? "Save changes" : `Create ${resource.singular.toLowerCase()}`}</SubmitButton>
        <p className="text-xs text-muted-foreground">
          Empty Bangla fields fall back to English on the website.
        </p>
      </div>
    </form>
  );
}
