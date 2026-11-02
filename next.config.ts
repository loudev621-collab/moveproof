import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   allowedDevOrigins: ["192.168.12.236"],
  // Photos are compressed on the phone before upload, so server actions stay small.
};

export default nextConfig;
