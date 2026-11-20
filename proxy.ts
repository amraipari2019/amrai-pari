import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/forgot-password"];

/**
 * Public pages: language routing.
 * /admin and /auth: refresh the Supabase session cookie, and send signed-out
 * visitors to the login page. (Each admin page and the database check
 * permissions again — this is only the first gate.)
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/auth")) {
    return intl(request);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  let response = NextResponse.next({ request });
  if (!url || !key || url.includes("your-project-ref")) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getClaims();
  const signedIn = !!data?.claims?.sub;

  if (pathname.startsWith("/admin") && !signedIn && !PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    const login = request.nextUrl.clone();
    login.pathname = "/admin/login";
    login.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  // Skip API routes, Next internals and files with an extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
