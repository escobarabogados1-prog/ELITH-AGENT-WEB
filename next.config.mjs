/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 'pg' es opcional (solo se usa si hay DATABASE_URL). Se marca como externo
  // para que no rompa el bundling cuando no está instalado en local.
  serverExternalPackages: ["pg"],
};

export default nextConfig;
