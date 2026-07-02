const { version } = require("./package.json");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Single source of truth for the displayed build version: package.json.
    NEXT_PUBLIC_APP_VERSION: version,
  },
};

module.exports = nextConfig;
