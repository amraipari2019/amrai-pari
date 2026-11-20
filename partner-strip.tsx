import { RemoteImage } from "@/components/ui/remote-image";
import type { Partner } from "@/lib/types";

export function PartnerStrip({ partners }: { partners: Partner[] }) {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
      {partners.map((p) => {
        const inner = p.logo_url ? (
          <RemoteImage
            src={p.logo_url}
            alt={p.name}
            width={160}
            height={64}
            className="h-14 w-auto object-contain"
          />
        ) : (
          <span className="text-xl font-bold text-primary">{p.name}</span>
        );
        return (
          <li key={p.id}>
            {p.website_url ? (
              <a
                href={p.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block opacity-90 hover:opacity-100"
              >
                {inner}
              </a>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ul>
  );
}
