import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "スコアブック",
    short_name: "スコアブック",
    description: "草野球の試合をスマホで記録できるスコアリングアプリ",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fbf8",
    theme_color: "#397047",
    orientation: "portrait",
    icons: [
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
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
