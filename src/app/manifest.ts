import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Estudos do Amor ❤️",
    short_name: "Estudos ❤️",
    description:
      "Plataforma de estudos para o ENEM: simulados, revisão de erros e desempenho.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0f1e",
    theme_color: "#4f46e5",
    lang: "pt-BR",
    orientation: "portrait",
    categories: ["education"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
