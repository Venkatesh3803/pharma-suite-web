import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "PharmaSuite — Pharmacy Management",
    short_name: "PharmaSuite",
    description:
      "Retail pharmacy POS, inventory, purchasing and finance management for modern pharmacies.",
    start_url: "/dashboard/purchase-dashboard",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f7f4ec",
    theme_color: "#0e3b36",
    categories: ["business", "medical", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        url: "/dashboard/purchase-dashboard",
      },
      {
        name: "Sales & POS",
        short_name: "Sales",
        url: "/sales",
      },
      {
        name: "Inventory",
        short_name: "Inventory",
        url: "/inventory",
      },
      {
        name: "Offline Sync",
        short_name: "Sync",
        url: "/sync",
      },
    ],
  };
}
