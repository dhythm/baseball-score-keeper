import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "スコアブック",
    short_name: "スコアブック",
    description: "草野球の試合をスマホで記録できるスコアリングアプリ",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8fbf8",
    theme_color: "#397047",
    orientation: "portrait",
    categories: ["sports", "utilities"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
