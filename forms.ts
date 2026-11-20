import { z } from "zod";

/**
 * One schema per public form. Error messages are translation keys
 * (form.err_*) so the browser shows them in the visitor's language.
 */
const req = (max = 200) => z.string().trim().min(1, "err_required").max(max, "err_tooLong");
const opt = (max = 200) =>
  z
    .string()
    .trim()
    .max(max, "err_tooLong")
    .optional()
    .transform((v) => (v ? v : null));

// Accepts Bengali digits too, normalises to 01XXXXXXXXX (optionally +880).
export const bdPhone = z
  .string()
  .trim()
  .min(1, "err_required")
  .transform((v) => v.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d))).replace(/[\s-]/g, ""))
  .refine((v) => /^(\+?880|0)1[3-9]\d{8}$/.test(v), "err_phone");

const optEmail = z
  .string()
  .trim()
  .max(200, "err_tooLong")
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || z.email().safeParse(v).success, "err_email");

const consent = z.literal("on", { error: "err_consent" }).transform(() => true);

export const volunteerSchema = z.object({
  full_name: req(120),
  phone: bdPhone,
  email: optEmail,
  area: opt(120),
  occupation: opt(120),
  interests: z
    .array(z.enum(["education", "health", "events", "fundraising", "media", "other"]))
    .max(6)
    .default([]),
  availability: z.enum(["weekdays", "weekends", "events", "flexible"]).optional().nullable(),
  skills: opt(1000),
  message: opt(2000),
  consent,
});

export const assistanceSchema = z.object({
  full_name: req(120),
  phone: bdPhone,
  email: optEmail,
  address: opt(300),
  assistance_type: z.enum(["education", "health", "food", "elderly", "other"], { error: "err_required" }),
  household_size: z.coerce
    .number({ error: "err_number" })
    .int("err_number")
    .min(1, "err_number")
    .max(30, "err_number")
    .optional()
    .nullable(),
  description: req(3000),
  consent,
});

export const contactSchema = z.object({
  full_name: req(120),
  email: optEmail,
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.union([z.null(), bdPhone])),
  subject: opt(200),
  message: req(3000),
});

export const partnershipSchema = z.object({
  organization: req(200),
  contact_person: req(120),
  email: z.string().trim().min(1, "err_required").pipe(z.email("err_email")),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.union([z.null(), bdPhone])),
  partnership_type: z.enum(["program", "inkind", "medical", "csr", "other"]).optional().nullable(),
  message: req(3000),
});

export const registrationSchema = z.object({
  event_id: z.uuid(),
  full_name: req(120),
  phone: bdPhone,
  email: optEmail,
  attendees: z.coerce
    .number({ error: "err_number" })
    .int()
    .min(1, "err_number")
    .max(10, "err_number")
    .default(1),
});

/** Turn FormData into a plain object; repeated keys become arrays; blanks are dropped. */
export function formDataToObject(fd: FormData, arrays: string[] = []) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v !== "string") continue;
    if (arrays.includes(k)) {
      const list = (out[k] as string[] | undefined) ?? [];
      list.push(v);
      out[k] = list;
    } else if (v !== "") {
      out[k] = v;
    }
  }
  return out;
}
