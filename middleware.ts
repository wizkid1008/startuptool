import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { absoluteUrl } from "@/lib/origin";

const PUBLIC_PATHS = ["/login", "/auth"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Refreshes the Supabase session on every request and gates everything behind
 * a login. Server Components cannot write cookies, so the refreshed session
 * has to be written here or users get signed out unpredictably.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without configuration there is nothing to authenticate against. Let the
  // request through so the page can render its own "not configured" notice
  // rather than redirecting into a login that cannot work.
  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Built from the forwarded origin, not request.nextUrl — behind a proxy that
  // carries the internal bind address and sends the browser to localhost.
  if (!user && !isPublic(pathname)) {
    const target = absoluteUrl("/login", request);
    target.searchParams.set("next", pathname);
    return NextResponse.redirect(target);
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(absoluteUrl("/", request));
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"
  ]
};
