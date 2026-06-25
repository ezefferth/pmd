import { NextRequest, NextResponse } from 'next/server'

const COOKIE_SESSAO = 'cud_token'
const PUBLICAS = ['/login', '/cadastro', '/recuperar-senha']

export function middleware(req: NextRequest) {
  const temSessao = Boolean(req.cookies.get(COOKIE_SESSAO)?.value)
  const ehPublica = PUBLICAS.some((p) => req.nextUrl.pathname.startsWith(p))

  if (!temSessao && !ehPublica) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (temSessao && ehPublica) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico).*)'],
}
