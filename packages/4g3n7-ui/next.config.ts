import type { NextConfig } from "next";
import dotenv from "dotenv";

dotenv.config();

const nextConfig: NextConfig = {
  transpilePackages: ["@4g3n7/shared"],
  output: "standalone",
};

export default nextConfig;
