import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  rewrites: [
    {
      source: "/api/:path*",
      destination: "https://pharma-suite-sever.onrender.com/api/:path*",
    },
  ],
});
