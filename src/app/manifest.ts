import type { MetadataRoute } from "next";
import { withBasePath } from "@/lib/basePath";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FurinaKit - Furina's Toolbox",
    short_name: "FurinaKit",
    description:
      "An elegant online toolbox with 62+ practical tools",
    start_url: withBasePath(""),
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3b82f6",
    icons: [
      {
        src: withBasePath("/furina.jpg"),
        sizes: "192x192",
        type: "image/jpeg",
      },
      {
        src: withBasePath("/furina.jpg"),
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
  };
}
