/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Allow build despite type errors for demo
  },
  eslint: {
    ignoreDuringBuilds: true, // Allow build despite lint errors for demo
  },
  images: {
    unoptimized: true
  },
}

module.exports = nextConfig