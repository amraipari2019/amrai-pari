import { CalendarDays, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { RemoteImage } from "@/components/ui/remote-image";
import { ProgramIcon } from "@/components/ui/program-icon";
import { formatDate, pick } from "@/lib/i18n-content";
import type { Album, EventItem, Program, Project } from "@/lib/types";
import { cn } from "@/lib/utils";

const ruleColours = ["border-brand-green", "border-brand-red", "border-brand-green"];

export function ProgramTile({ program, locale, index }: { program: Program; locale: string; index: number }) {
  return (
    <Link
      href={`/programs/${program.slug}`}
      className={cn("group block border-t-4 bg-white pt-6 pb-2", ruleColours[index % ruleColours.length])}
    >
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-sky text-primary ring-4 ring-highlight/60">
        <ProgramIcon icon={program.icon} className="size-7" />
      </span>
      <h3 className="mt-5 text-2xl font-bold text-primary group-hover:underline group-hover:decoration-brand-red group-hover:underline-offset-4">
        {pick(program, "title", locale)}
      </h3>
      <p className="mt-2 text-muted-foreground">{pick(program, "summary", locale)}</p>
    </Link>
  );
}

export function ProjectCard({
  project,
  locale,
  statusLabel,
}: {
  project: Project;
  locale: string;
  statusLabel: string;
}) {
  const location = pick(project, "location", locale);
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-white"
    >
      <div className="relative aspect-[16/10] bg-muted">
        {project.cover_image_url ? (
          <RemoteImage
            src={project.cover_image_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="bands-thin absolute inset-x-0 bottom-0" aria-hidden />
        )}
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold",
            project.status === "ongoing" && "bg-secondary text-white",
            project.status === "completed" && "bg-primary text-white",
            project.status === "planned" && "bg-highlight text-primary",
          )}
        >
          {statusLabel}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-bold text-primary group-hover:underline">
          {pick(project, "title", locale)}
        </h3>
        <p className="mt-2 line-clamp-3 text-muted-foreground">{pick(project, "summary", locale)}</p>
        {location ? (
          <p className="mt-auto flex items-center gap-1.5 pt-4 text-sm text-muted-foreground">
            <MapPin className="size-4" aria-hidden /> {location}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export function EventRow({ event, locale }: { event: EventItem; locale: string }) {
  const d = new Date(event.starts_at);
  const day = new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(d);
  const month = new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
    month: "short",
    timeZone: "Asia/Dhaka",
  }).format(d);
  const location = pick(event, "location", locale);
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex gap-5 border-b border-border py-5 last:border-b-0"
    >
      <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-primary py-2 text-white">
        <span className="text-2xl leading-none font-bold">{day}</span>
        <span className="mt-1 text-xs text-highlight">{month}</span>
      </div>
      <div className="min-w-0">
        <h3 className="text-lg font-bold text-primary group-hover:underline">
          {pick(event, "title", locale)}
        </h3>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4" aria-hidden /> {formatDate(event.starts_at, locale, true)}
          </span>
          {location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden /> {location}
            </span>
          ) : null}
        </p>
        {pick(event, "summary", locale) ? (
          <p className="mt-2 line-clamp-2 text-muted-foreground">{pick(event, "summary", locale)}</p>
        ) : null}
      </div>
    </Link>
  );
}

export function AlbumCard({ album, locale }: { album: Album; locale: string }) {
  return (
    <Link href={`/gallery/${album.slug}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
        {album.cover_image_url ? (
          <RemoteImage
            src={album.cover_image_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
      </div>
      <h3 className="mt-3 text-lg font-bold text-primary group-hover:underline">
        {pick(album, "title", locale)}
      </h3>
      {album.album_date ? (
        <p className="text-sm text-muted-foreground">{formatDate(album.album_date, locale)}</p>
      ) : null}
    </Link>
  );
}
