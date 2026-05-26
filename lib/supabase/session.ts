import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const url = request.nextUrl.clone()
  
  // Protected routes:
  const protectedRoutes = ['/chat', '/calls', '/contacts', '/ai', '/scheduled', '/settings', '/profile']
  const isProtectedRoute = protectedRoutes.some(route => url.pathname.startsWith(route))
  const isSignInRoute = url.pathname.startsWith('/signin')

  // Prevent hanging by skipping the network request if the route doesn't care about auth
  if (!isProtectedRoute && !isSignInRoute) {
    return supabaseResponse
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isProtectedRoute && !user) {
    url.pathname = '/signin'
    return NextResponse.redirect(url)
  }

  if (user && isSignInRoute) {
    url.pathname = '/chat'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
