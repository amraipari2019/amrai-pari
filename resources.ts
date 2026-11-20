/**
 * Admin panel configuration. Each content type and each form inbox is
 * described here once; the generic list / edit pages and server actions
 * read this file. To add a field: add the column in SQL, then add it here.
 */

export type Module =
  | "content"
  | "events"
  | "gallery"
  | "impact"
  | "volunteers"
  | "assistance"
  | "messages"
  | "partnerships"
  | "registrations"
  | "settings"
  | "users"
  | "audit";

export type FieldType =
  | "text"
  | "textarea"
  | "longtext"
  | "number"
  | "date"
  | "datetime"
  | "checkbox"
  | "select"
  | "image"
  | "slug"
  | "icon"
  | "relation";

export type Field = {
  name: string; // column name (without _en/_bn when bilingual)
  label: string;
  type: FieldType;
  bilingual?: boolean;
  required?: boolean;
  help?: string;
  options?: { value: string; label: string }[];
  relation?: { table: string; labelColumn: string };
  slugFrom?: string; // for slug fields: which field to suggest the slug from
  half?: boolean; // place two half fields side by side
};

export type ContentResource = {
  key: string;
  table: string;
  module: Module;
  tag: string; // public cache tag to refresh after edits
  singular: string;
  plural: string;
  titleColumn: string;
  listColumns: { name: string; label: string; type?: "date" | "datetime" | "boolean" | "text" }[];
  order: { column: string; ascending: boolean }[];
  fields: Field[];
  publicPath?: (row: Record<string, unknown>) => string;
};

const publish: Field = { name: "is_published", label: "Show on the website", type: "checkbox", half: true };
const sort: Field = { name: "sort_order", label: "Order (lower shows first)", type: "number", half: true };

export const contentResources: ContentResource[] = [
  {
    key: "programs",
    table: "programs",
    module: "content",
    tag: "programs",
    singular: "Program",
    plural: "Programs",
    titleColumn: "title_en",
    listColumns: [
      { name: "title_en", label: "Title" },
      { name: "slug", label: "Address" },
      { name: "is_published", label: "Published", type: "boolean" },
    ],
    order: [{ column: "sort_order", ascending: true }],
    publicPath: (r) => `/programs/${r.slug}`,
    fields: [
      { name: "title", label: "Title", type: "text", bilingual: true, required: true },
      {
        name: "slug",
        label: "Web address",
        type: "slug",
        slugFrom: "title_en",
        required: true,
        help: "Lowercase letters, numbers and dashes. Appears as /programs/your-address.",
      },
      { name: "summary", label: "Short summary", type: "textarea", bilingual: true },
      {
        name: "body",
        label: "Full description",
        type: "longtext",
        bilingual: true,
        help: "Leave an empty line between paragraphs.",
      },
      { name: "icon", label: "Icon", type: "icon", half: true },
      { name: "cover_image_url", label: "Cover photo", type: "image" },
      sort,
      publish,
    ],
  },
  {
    key: "projects",
    table: "projects",
    module: "content",
    tag: "projects",
    singular: "Project",
    plural: "Projects",
    titleColumn: "title_en",
    listColumns: [
      { name: "title_en", label: "Title" },
      { name: "status", label: "Status" },
      { name: "start_date", label: "Start", type: "date" },
      { name: "is_published", label: "Published", type: "boolean" },
    ],
    order: [
      { column: "sort_order", ascending: true },
      { column: "start_date", ascending: false },
    ],
    publicPath: (r) => `/projects/${r.slug}`,
    fields: [
      { name: "title", label: "Title", type: "text", bilingual: true, required: true },
      { name: "slug", label: "Web address", type: "slug", slugFrom: "title_en", required: true },
      {
        name: "program_id",
        label: "Program",
        type: "relation",
        relation: { table: "programs", labelColumn: "title_en" },
        half: true,
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        half: true,
        options: [
          { value: "planned", label: "Planned" },
          { value: "ongoing", label: "Ongoing" },
          { value: "completed", label: "Completed" },
        ],
      },
      { name: "summary", label: "Short summary", type: "textarea", bilingual: true },
      { name: "body", label: "Full description", type: "longtext", bilingual: true },
      { name: "location", label: "Location", type: "text", bilingual: true },
      { name: "start_date", label: "Start date", type: "date", half: true },
      { name: "end_date", label: "End date", type: "date", half: true },
      { name: "cover_image_url", label: "Cover photo", type: "image" },
      sort,
      publish,
    ],
  },
  {
    key: "events",
    table: "events",
    module: "events",
    tag: "events",
    singular: "Event",
    plural: "Events",
    titleColumn: "title_en",
    listColumns: [
      { name: "title_en", label: "Title" },
      { name: "starts_at", label: "Starts", type: "datetime" },
      { name: "registration_open", label: "Registration", type: "boolean" },
      { name: "is_published", label: "Published", type: "boolean" },
    ],
    order: [{ column: "starts_at", ascending: false }],
    publicPath: (r) => `/events/${r.slug}`,
    fields: [
      { name: "title", label: "Title", type: "text", bilingual: true, required: true },
      { name: "slug", label: "Web address", type: "slug", slugFrom: "title_en", required: true },
      { name: "starts_at", label: "Starts (Dhaka time)", type: "datetime", required: true, half: true },
      { name: "ends_at", label: "Ends (Dhaka time)", type: "datetime", half: true },
      { name: "location", label: "Location", type: "text", bilingual: true },
      { name: "summary", label: "Short summary", type: "textarea", bilingual: true },
      { name: "body", label: "Full description", type: "longtext", bilingual: true },
      { name: "cover_image_url", label: "Cover photo", type: "image" },
      {
        name: "registration_open",
        label: "Accept registrations on the website",
        type: "checkbox",
        half: true,
      },
      { name: "capacity", label: "Capacity (optional)", type: "number", half: true },
      publish,
    ],
  },
  {
    key: "gallery",
    table: "gallery_albums",
    module: "gallery",
    tag: "gallery",
    singular: "Album",
    plural: "Gallery albums",
    titleColumn: "title_en",
    listColumns: [
      { name: "title_en", label: "Title" },
      { name: "album_date", label: "Date", type: "date" },
      { name: "is_published", label: "Published", type: "boolean" },
    ],
    order: [{ column: "album_date", ascending: false }],
    publicPath: (r) => `/gallery/${r.slug}`,
    fields: [
      { name: "title", label: "Title", type: "text", bilingual: true, required: true },
      { name: "slug", label: "Web address", type: "slug", slugFrom: "title_en", required: true },
      { name: "description", label: "Description", type: "textarea", bilingual: true },
      { name: "album_date", label: "Date", type: "date", half: true },
      { name: "cover_image_url", label: "Cover photo", type: "image" },
      sort,
      publish,
    ],
  },
  {
    key: "team",
    table: "team_members",
    module: "content",
    tag: "team",
    singular: "Team member",
    plural: "Team",
    titleColumn: "name_en",
    listColumns: [
      { name: "name_en", label: "Name" },
      { name: "role_en", label: "Role" },
      { name: "team_group", label: "Group" },
      { name: "is_published", label: "Published", type: "boolean" },
    ],
    order: [{ column: "sort_order", ascending: true }],
    fields: [
      { name: "name", label: "Name", type: "text", bilingual: true, required: true },
      { name: "role", label: "Role / designation", type: "text", bilingual: true },
      {
        name: "team_group",
        label: "Group",
        type: "select",
        required: true,
        half: true,
        options: [
          { value: "founder", label: "Founder" },
          { value: "executive", label: "Executive committee" },
          { value: "advisor", label: "Advisor" },
          { value: "volunteer", label: "Volunteer" },
        ],
      },
      { name: "bio", label: "Short bio", type: "textarea", bilingual: true },
      { name: "photo_url", label: "Photo", type: "image", help: "Only publish with the person's consent." },
      sort,
      publish,
    ],
  },
  {
    key: "faqs",
    table: "faqs",
    module: "content",
    tag: "faqs",
    singular: "Question",
    plural: "FAQ",
    titleColumn: "question_en",
    listColumns: [
      { name: "question_en", label: "Question" },
      { name: "is_published", label: "Published", type: "boolean" },
    ],
    order: [{ column: "sort_order", ascending: true }],
    fields: [
      { name: "question", label: "Question", type: "text", bilingual: true, required: true },
      { name: "answer", label: "Answer", type: "textarea", bilingual: true, required: true },
      sort,
      publish,
    ],
  },
  {
    key: "impact",
    table: "impact_stats",
    module: "impact",
    tag: "impact",
    singular: "Impact figure",
    plural: "Impact figures",
    titleColumn: "label_en",
    listColumns: [
      { name: "value", label: "Figure" },
      { name: "label_en", label: "Label" },
      { name: "as_of", label: "As of", type: "date" },
      { name: "is_verified", label: "Verified", type: "boolean" },
    ],
    order: [{ column: "sort_order", ascending: true }],
    fields: [
      {
        name: "value",
        label: "Figure",
        type: "text",
        required: true,
        half: true,
        help: "As it should appear, e.g. 1,200 or ১,২০০+.",
      },
      { name: "label", label: "What it counts", type: "text", bilingual: true, required: true },
      {
        name: "source",
        label: "Source",
        type: "text",
        half: true,
        help: "Where the number comes from (register, report…).",
      },
      { name: "as_of", label: "As of date", type: "date", half: true },
      sort,
      { name: "is_verified", label: "Verified — show on the website", type: "checkbox", half: true },
    ],
  },
  {
    key: "partners",
    table: "partners",
    module: "content",
    tag: "partners",
    singular: "Partner",
    plural: "Partners",
    titleColumn: "name",
    listColumns: [
      { name: "name", label: "Name" },
      { name: "is_published", label: "Published", type: "boolean" },
    ],
    order: [{ column: "sort_order", ascending: true }],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "website_url", label: "Website", type: "text", help: "Full address starting with https://" },
      { name: "description", label: "Description", type: "textarea", bilingual: true },
      { name: "logo_url", label: "Logo", type: "image", help: "Publish only with the partner's permission." },
      sort,
      publish,
    ],
  },
];

export type InboxKind = {
  key: string;
  table: string;
  module: Module;
  singular: string;
  plural: string;
  statuses: string[];
  listColumns: { name: string; label: string }[];
  detail: { name: string; label: string }[];
  select?: string;
};

export const inboxKinds: InboxKind[] = [
  {
    key: "volunteers",
    table: "volunteer_applications",
    module: "volunteers",
    singular: "Volunteer application",
    plural: "Volunteers",
    statuses: ["new", "contacted", "accepted", "declined", "archived"],
    listColumns: [
      { name: "full_name", label: "Name" },
      { name: "phone", label: "Phone" },
      { name: "area", label: "Area" },
    ],
    detail: [
      { name: "full_name", label: "Name" },
      { name: "phone", label: "Phone" },
      { name: "email", label: "Email" },
      { name: "area", label: "Area" },
      { name: "occupation", label: "Occupation" },
      { name: "interests", label: "Interests" },
      { name: "availability", label: "Availability" },
      { name: "skills", label: "Skills" },
      { name: "message", label: "Message" },
      { name: "locale", label: "Form language" },
    ],
  },
  {
    key: "assistance",
    table: "assistance_requests",
    module: "assistance",
    singular: "Assistance request",
    plural: "Assistance requests",
    statuses: ["new", "reviewing", "approved", "referred", "closed"],
    listColumns: [
      { name: "full_name", label: "Name" },
      { name: "assistance_type", label: "Type" },
      { name: "phone", label: "Phone" },
    ],
    detail: [
      { name: "full_name", label: "Name" },
      { name: "phone", label: "Phone" },
      { name: "email", label: "Email" },
      { name: "address", label: "Address" },
      { name: "assistance_type", label: "Type" },
      { name: "household_size", label: "Household size" },
      { name: "description", label: "Situation" },
      { name: "locale", label: "Form language" },
    ],
  },
  {
    key: "messages",
    table: "contact_messages",
    module: "messages",
    singular: "Message",
    plural: "Messages",
    statuses: ["new", "replied", "archived"],
    listColumns: [
      { name: "full_name", label: "Name" },
      { name: "subject", label: "Subject" },
    ],
    detail: [
      { name: "full_name", label: "Name" },
      { name: "email", label: "Email" },
      { name: "phone", label: "Phone" },
      { name: "subject", label: "Subject" },
      { name: "message", label: "Message" },
    ],
  },
  {
    key: "partnerships",
    table: "partnership_inquiries",
    module: "partnerships",
    singular: "Partnership inquiry",
    plural: "Partnerships",
    statuses: ["new", "in_discussion", "agreed", "declined", "archived"],
    listColumns: [
      { name: "organization", label: "Organisation" },
      { name: "contact_person", label: "Contact" },
      { name: "partnership_type", label: "Type" },
    ],
    detail: [
      { name: "organization", label: "Organisation" },
      { name: "contact_person", label: "Contact person" },
      { name: "email", label: "Email" },
      { name: "phone", label: "Phone" },
      { name: "partnership_type", label: "Type" },
      { name: "message", label: "Message" },
    ],
  },
  {
    key: "registrations",
    table: "event_registrations",
    module: "registrations",
    singular: "Event registration",
    plural: "Event registrations",
    statuses: ["registered", "confirmed", "attended", "cancelled"],
    select: "*, event:events(title_en)",
    listColumns: [
      { name: "full_name", label: "Name" },
      { name: "event.title_en", label: "Event" },
      { name: "attendees", label: "People" },
      { name: "phone", label: "Phone" },
    ],
    detail: [
      { name: "event.title_en", label: "Event" },
      { name: "full_name", label: "Name" },
      { name: "phone", label: "Phone" },
      { name: "email", label: "Email" },
      { name: "attendees", label: "People" },
    ],
  },
];

export const getContentResource = (key: string) => contentResources.find((r) => r.key === key);
export const getInboxKind = (key: string) => inboxKinds.find((k) => k.key === key);

/** Column names a field writes to. */
export function columnsFor(field: Field) {
  return field.bilingual ? [`${field.name}_en`, `${field.name}_bn`] : [field.name];
}

export const roleLabels: Record<string, string> = {
  super_admin: "Super admin",
  content_manager: "Content manager",
  program_manager: "Program manager",
  finance_manager: "Finance manager",
  volunteer_coordinator: "Volunteer coordinator",
  viewer: "Viewer",
};

export function humanize(value: string) {
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function getPath(row: Record<string, unknown>, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined),
      row,
    );
}
