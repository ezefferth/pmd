/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // lint ainda não configurado neste scaffold; o build segue validando tipos (tsc)
  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig
