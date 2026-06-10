import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const MAINTENANCE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Halal Vote — back soon</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center;
    background: #0a0a0a; color: #fff; font-family: Georgia, "Times New Roman", serif;
    text-align: center; padding: 2rem; }
  h1 { font-size: 2rem; font-weight: 600; margin: 0 0 0.75rem; }
  p { color: #a3a3a3; font-size: 1rem; margin: 0; line-height: 1.6; }
</style>
</head>
<body>
<div>
  <h1>Halal Vote is coming back soon</h1>
  <p>We&rsquo;re doing a bit of maintenance. Check back shortly.</p>
</div>
</body>
</html>`;

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fail soft when Supabase env vars are missing (e.g. a deploy without
  // configured secrets): createServerClient throws on undefined values,
  // which would otherwise 500 every route the middleware matches.
  if (!supabaseUrl || !supabaseAnonKey) {
    return new NextResponse(MAINTENANCE_HTML, {
      status: 503,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "retry-after": "3600",
      },
    });
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users from protected routes
  const protectedRoutes = ["/submit", "/auth/onboarding"];
  const isProtected = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users without profile to onboarding
  if (user && !request.nextUrl.pathname.startsWith("/auth/")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile && !request.nextUrl.pathname.startsWith("/auth/onboarding")) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
  } catch {
    // Defined-but-invalid env (placeholder URL, dead project, network failure
    // inside auth.getUser) must degrade the same way as missing env: the
    // maintenance page, never an edge 500.
    return new NextResponse(MAINTENANCE_HTML, {
      status: 503,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "retry-after": "3600",
      },
    });
  }
}
