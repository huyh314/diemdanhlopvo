import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - manifest.webmanifest, manifest.json (PWA manifests)
         * - sw.js (Service Worker)
         * - icon (Dynamic icons for PWA)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|manifest.json|sw.js|icon/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|ts)$).*)',
    ],
}
