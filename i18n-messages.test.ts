import { describe, expect, it } from "vitest";
import en from "../messages/en.json";
import bn from "../messages/bn.json";

// Guarantees every English string has a Bengali counterpart (and vice versa),
// so no page silently falls back to English.
function keys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe("translation files", () => {
  it("have identical keys in English and Bengali", () => {
    expect(keys(bn).sort()).toEqual(keys(en).sort());
  });

  it("have no empty strings", () => {
    for (const [name, file] of Object.entries({ en, bn })) {
      const empty = keys(file).filter((k) => {
        const v = k.split(".").reduce<unknown>((o, p) => (o as Record<string, unknown>)[p], file);
        return typeof v === "string" && v.trim() === "";
      });
      expect(empty, name).toEqual([]);
    }
  });
});
