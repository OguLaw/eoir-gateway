import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Get user's IP from Vercel headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const userIp = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown'

  // Allowed VPN IPs from environment variable (comma-separated)
  const allowedIps = (process.env.ALLOWED_VPN_IPS || '').split(',').map(ip => ip.trim()).filter(Boolean)

  const isAllowed = allowedIps.includes(userIp)

  if (isAllowed) {
    return NextResponse.json({
      allowed: true,
      ip: userIp,
      credentials: {
        email: process.env.EOIR_EMAIL || '',
        password: process.env.EOIR_PASSWORD || '',
      },
      eoir_url: process.env.EOIR_URL || 'https://portal.eoir.justice.gov/',
    })
  }

  return NextResponse.json({
    allowed: false,
    ip: userIp,
    message: 'VPN bağlantınız aktif değil. Lütfen VPN\'i açıp tekrar deneyin.',
  })
}
