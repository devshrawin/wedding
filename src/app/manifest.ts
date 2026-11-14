import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Giftr: Wedding Registry & Shagun",
    short_name: "Giftr",
    description: "Wedding gift registry and shagun, made for India.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#FBF6EE",
    theme_color: "#9B1C31",
    lang: "en-IN",
    categories: ["lifestyle", "shopping"],
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
