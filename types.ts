export type FormState =
  | { status: "idle" }
  | { status: "success"; reference: string }
  | {
      status: "error";
      error: "fields" | "generic" | "notReady" | "captcha";
      fieldErrors?: Record<string, string>;
    };

export const initialFormState: FormState = { status: "idle" };
