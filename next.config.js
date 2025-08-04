// Debug check voor DATABASE_URL in production
if (process.env.NODE_ENV === "production") {
  console.log("✅ DATABASE_URL in production:", process.env.DATABASE_URL ?? "⛔ NIET GEDEFINIEERD");
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable standalone output for local development (Windows symlink issues)
  // Standalone output is only needed for Vercel deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
