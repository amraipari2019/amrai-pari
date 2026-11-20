import Image, { type ImageProps } from "next/image";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? (() => {
      try {
        return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
      } catch {
        return "";
      }
    })()
  : "";

/**
 * Images entered in the admin panel. Supabase Storage images are optimised by
 * Next.js; any other URL is shown as-is (unoptimized) so it can't break the build.
 */
export function RemoteImage(props: ImageProps & { src: string }) {
  let optimise = false;
  try {
    optimise = !!supabaseHost && new URL(props.src).hostname === supabaseHost;
  } catch {
    optimise = props.src.startsWith("/");
  }
  return <Image {...props} unoptimized={!optimise} alt={props.alt} />;
}
