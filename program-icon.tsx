import {
  BookOpen,
  HandHeart,
  HeartHandshake,
  HeartPulse,
  Home,
  Leaf,
  Stethoscope,
  Users,
  type LucideProps,
} from "lucide-react";

const icons = {
  "book-open": BookOpen,
  stethoscope: Stethoscope,
  users: Users,
  "heart-handshake": HeartHandshake,
  "heart-pulse": HeartPulse,
  "hand-heart": HandHeart,
  home: Home,
  leaf: Leaf,
};

export const programIconNames = Object.keys(icons);

export function ProgramIcon({ icon, ...props }: { icon: string | null } & Omit<LucideProps, "name">) {
  const Icon = icons[(icon ?? "") as keyof typeof icons] ?? HeartHandshake;
  return <Icon aria-hidden {...props} />;
}
