import type { MetadataRoute } from "next";

// Lets phones "Add to Home Screen" so Doorstamp opens like an app, without an app store.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Doorstamp",
    short_name: "Doorstamp",
    description: "Move-in and move-out photo records. No app to download.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f3f4f1",
    theme_color: "#18222b",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
