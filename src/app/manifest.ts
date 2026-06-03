import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FurinaKit - Furina's Toolbox",
    short_name: "FurinaKit",
    description:
      "An elegant online toolbox with 48+ practical tools",
    start_url: "/furinakit",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3b82f6",
    icons: [
      {
        src: "/furinakit/furina.jpg",
        sizes: "192x192",
        type: "image/jpeg",
      },
      {
        src: "/furinakit/furina.jpg",
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
  };
}
