/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/eoir-autofill.user.js',
        destination: '/api/userscript',
      },
    ]
  },
}

module.exports = nextConfig
