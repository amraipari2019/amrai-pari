"use client";

import { useTranslations } from "next-intl";
import {
  submitAssistance,
  submitContact,
  submitPartnership,
  submitRegistration,
  submitVolunteer,
} from "@/lib/forms/actions";
import { ChoiceGroup, ConsentField, PublicForm, SelectField, TextArea, TextField } from "./public-form";

type Props = { turnstileSiteKey?: string };

function ContactBlock() {
  const f = useTranslations("form");
  return (
    <>
      <TextField name="full_name" label={f("fullName")} required autoComplete="name" />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="phone"
          label={f("phone")}
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="01XXXXXXXXX"
        />
        <TextField name="email" label={f("email")} type="email" autoComplete="email" />
      </div>
    </>
  );
}

export function VolunteerForm({ turnstileSiteKey }: Props) {
  const t = useTranslations("volunteerForm");
  const opts = (prefix: string, keys: string[]) =>
    keys.map((k) => ({ value: k, label: t(`${prefix}_${k}` as "interest_education") }));
  return (
    <PublicForm action={submitVolunteer} submitLabel={t("submit")} turnstileSiteKey={turnstileSiteKey}>
      <ContactBlock />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="area" label={t("area")} autoComplete="address-level2" />
        <TextField name="occupation" label={t("occupation")} />
      </div>
      <ChoiceGroup
        name="interests"
        multiple
        label={t("interests")}
        options={opts("interest", ["education", "health", "events", "fundraising", "media", "other"])}
      />
      <ChoiceGroup
        name="availability"
        label={t("availability")}
        options={opts("avail", ["weekdays", "weekends", "events", "flexible"])}
      />
      <TextArea name="skills" label={t("skills")} rows={3} />
      <TextArea name="message" label={t("message")} rows={3} />
      <ConsentField />
    </PublicForm>
  );
}

export function AssistanceForm({ turnstileSiteKey }: Props) {
  const t = useTranslations("assistanceForm");
  return (
    <PublicForm action={submitAssistance} submitLabel={t("submit")} turnstileSiteKey={turnstileSiteKey}>
      <ContactBlock />
      <TextField name="address" label={t("address")} autoComplete="street-address" />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          name="assistance_type"
          label={t("type")}
          required
          options={["education", "health", "food", "elderly", "other"].map((k) => ({
            value: k,
            label: t(`type_${k}` as "type_education"),
          }))}
        />
        <TextField
          name="household_size"
          label={t("household")}
          type="number"
          min={1}
          max={30}
          inputMode="numeric"
        />
      </div>
      <TextArea name="description" label={t("description")} hint={t("descriptionHint")} required rows={6} />
      <ConsentField />
      <p className="text-sm text-muted-foreground">{t("note")}</p>
    </PublicForm>
  );
}

export function ContactForm({ turnstileSiteKey }: Props) {
  const t = useTranslations("contactForm");
  const f = useTranslations("form");
  return (
    <PublicForm action={submitContact} submitLabel={t("submit")} turnstileSiteKey={turnstileSiteKey}>
      <TextField name="full_name" label={f("fullName")} required autoComplete="name" />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="email" label={f("email")} type="email" autoComplete="email" />
        <TextField
          name="phone"
          label={f("phone")}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="01XXXXXXXXX"
        />
      </div>
      <TextField name="subject" label={t("subject")} />
      <TextArea name="message" label={f("message")} required rows={6} />
    </PublicForm>
  );
}

export function PartnershipForm({ turnstileSiteKey }: Props) {
  const t = useTranslations("partnershipForm");
  const f = useTranslations("form");
  return (
    <PublicForm action={submitPartnership} submitLabel={t("submit")} turnstileSiteKey={turnstileSiteKey}>
      <TextField name="organization" label={t("organization")} required autoComplete="organization" />
      <TextField name="contact_person" label={t("contactPerson")} required autoComplete="name" />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="email" label={f("email")} required type="email" autoComplete="email" />
        <TextField
          name="phone"
          label={f("phone")}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="01XXXXXXXXX"
        />
      </div>
      <SelectField
        name="partnership_type"
        label={t("type")}
        options={["program", "inkind", "medical", "csr", "other"].map((k) => ({
          value: k,
          label: t(`type_${k}` as "type_program"),
        }))}
      />
      <TextArea name="message" label={f("message")} required rows={6} />
    </PublicForm>
  );
}

export function RegistrationForm({ eventId, turnstileSiteKey }: Props & { eventId: string }) {
  const t = useTranslations("registrationForm");
  return (
    <PublicForm
      action={submitRegistration}
      submitLabel={t("submit")}
      hidden={{ event_id: eventId }}
      turnstileSiteKey={turnstileSiteKey}
    >
      <ContactBlock />
      <TextField
        name="attendees"
        label={t("attendees")}
        type="number"
        min={1}
        max={10}
        defaultValue={1}
        inputMode="numeric"
      />
    </PublicForm>
  );
}
