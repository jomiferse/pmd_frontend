/** @type {import('next').NextConfig} */
const marketingUrl = (process.env.NEXT_PUBLIC_MARKETING_URL || "https://pmdalerts.com").replace(/\/$/, "");

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/",
        destination: "/app/alerts",
        permanent: false
      },
      {
        source: "/pricing",
        destination: `${marketingUrl}/pricing`,
        permanent: true
      },
      {
        source: "/faq",
        destination: `${marketingUrl}/faq`,
        permanent: true
      },
      {
        source: "/learn",
        destination: `${marketingUrl}/faq`,
        permanent: true
      },
      {
        source: "/docs",
        destination: `${marketingUrl}/docs`,
        permanent: true
      }
    ];
  }
};

module.exports = nextConfig;
