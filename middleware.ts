import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the path the user is trying to access
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/' || 
                      path === '/login' || 
                      path === '/register' || 
                      path === '/reset-password' || 
                      path.startsWith('/register/verify') ||
                      path.startsWith('/_next') ||
                      path.startsWith('/api');
  
  // В middleware мы не можем получить доступ к localStorage,
  // поэтому используем cookie для аутентификации
  // Проверка аутентификации будет происходить на клиенте в компонентах

  return NextResponse.next();
}

// Configure which paths this middleware will run on
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
