import { describe, expect, it } from "vitest";
import {
  assistanceSchema,
  bdPhone,
  contactSchema,
  formDataToObject,
  partnershipSchema,
  volunteerSchema,
} from "@/lib/validation/forms";

describe("Bangladeshi phone numbers", () => {
  it.each(["01712345678", "+8801712345678", "8801712345678", "0171-234 5678", "০১৭১২৩৪৫৬৭৮"])(
    "accepts %s",
    (v) => {
      expect(bdPhone.safeParse(v).success).toBe(true);
    },
  );
  it.each(["", "12345", "01212345678", "0171234567", "phone"])("rejects %s", (v) => {
    expect(bdPhone.safeParse(v).success).toBe(false);
  });
  it("normalises Bengali digits", () => {
    expect(bdPhone.parse("০১৭১২৩৪৫৬৭৮")).toBe("01712345678");
  });
});

describe("volunteer form", () => {
  const base = { full_name: "Rahim", phone: "01712345678", consent: "on" };
  it("accepts the minimum", () => {
    const r = volunteerSchema.parse(base);
    expect(r).toMatchObject({ full_name: "Rahim", consent: true, interests: [], email: null });
  });
  it("requires consent", () => {
    const r = volunteerSchema.safeParse({ ...base, consent: undefined });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe("err_consent");
  });
  it("rejects unknown interests", () => {
    expect(volunteerSchema.safeParse({ ...base, interests: ["hacking"] }).success).toBe(false);
  });
  it("uses translation keys for errors", () => {
    const r = volunteerSchema.safeParse({ ...base, email: "not-an-email" });
    expect(r.error?.issues[0].message).toBe("err_email");
  });
});

describe("other forms", () => {
  it("assistance needs a type and description", () => {
    const r = assistanceSchema.safeParse({ full_name: "A", phone: "01712345678", consent: "on" });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.path[0]).sort()).toEqual(["assistance_type", "description"]);
  });
  it("household size is coerced and bounded", () => {
    const base = {
      full_name: "A",
      phone: "01712345678",
      consent: "on",
      assistance_type: "food",
      description: "x",
    };
    expect(assistanceSchema.parse({ ...base, household_size: "4" }).household_size).toBe(4);
    expect(assistanceSchema.safeParse({ ...base, household_size: "400" }).success).toBe(false);
  });
  it("contact phone is optional but validated", () => {
    expect(contactSchema.safeParse({ full_name: "A", message: "hi" }).success).toBe(true);
    expect(contactSchema.safeParse({ full_name: "A", message: "hi", phone: "123" }).success).toBe(false);
  });
  it("partnership email is required", () => {
    expect(
      partnershipSchema.safeParse({ organization: "O", contact_person: "C", message: "m" }).success,
    ).toBe(false);
  });
});

describe("formDataToObject", () => {
  it("collects repeated keys as arrays and drops blanks", () => {
    const fd = new FormData();
    fd.append("interests", "education");
    fd.append("interests", "health");
    fd.append("email", "");
    fd.append("full_name", "Rahim");
    expect(formDataToObject(fd, ["interests"])).toEqual({
      interests: ["education", "health"],
      full_name: "Rahim",
    });
  });
});
