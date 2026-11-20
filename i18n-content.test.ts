import { describe, expect, it } from "vitest";
import { formatNumber, pick } from "@/lib/i18n-content";
import { fromDhakaInput, toDhakaInput } from "@/lib/admin/datetime";
import { contentResources } from "@/lib/admin/resources";
import en from "../messages/en.json";

describe("bilingual content", () => {
  it("falls back to English when Bangla is empty", () => {
    expect(pick({ title_en: "Education", title_bn: "" }, "title", "bn")).toBe("Education");
    expect(pick({ title_en: "Education", title_bn: "শিক্ষা" }, "title", "bn")).toBe("শিক্ষা");
  });
  it("converts digits to Bangla", () => {
    expect(formatNumber("2019", "bn")).toBe("২০১৯");
  });
});

describe("Dhaka time inputs", () => {
  it("round-trips", () => {
    expect(fromDhakaInput("2026-12-01T10:30")).toBe("2026-12-01T10:30:00+06:00");
    expect(toDhakaInput("2026-12-01T04:30:00Z")).toBe("2026-12-01T10:30");
  });
});

describe("admin config", () => {
  it("has unique resource keys and a project status translation for every option", () => {
    const keys = contentResources.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
    const statuses = contentResources
      .find((r) => r.key === "projects")!
      .fields.find((f) => f.name === "status")!.options!;
    for (const s of statuses) expect(en.projects).toHaveProperty(`status_${s.value}`);
  });
});
