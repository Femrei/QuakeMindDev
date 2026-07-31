/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["mt1.google.com", "wayback.maptiles.arcgis.com", "openaerialmap.org"],
  },
};

module.exports = nextConfig;
