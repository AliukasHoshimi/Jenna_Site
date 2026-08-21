import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pins the workspace root to this project so Turbopack doesn't get
  // confused by an unrelated lockfile in a parent folder.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // We manage AGENTS.md/CLAUDE.md ourselves; don't let Next regenerate them.
  agentRules: false,
};

export default nextConfig;
