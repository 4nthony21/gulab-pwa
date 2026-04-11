import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // 1. Creamos la respuesta inicial
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Configuramos el cliente
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // REASIGNACIÓN: Aquí es donde 'let' cobra sentido
          // Actualizamos la petición para que los Server Components vean el cambio
          request.cookies.set({ name, value, ...options })
          
          // Creamos una nueva respuesta que hereda los headers y añade la cookie
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // IMPORTANTE: getUser() debe ejecutarse DESPUÉS de definir set/get
  const { data: { user } } = await supabase.auth.getUser()

  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith('/registro') || 
    request.nextUrl.pathname.startsWith('/admin')

  // Redirección si no hay sesión
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si ya está logueado y va al login, enviarlo al admin
  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  return response
}