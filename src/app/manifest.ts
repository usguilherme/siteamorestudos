import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Estudos do Amor ❤️",
    short_name: "Estudos ❤️",
    description:
      "Plataforma de estudos para o ENEM: simulados, revisão de erros e desempenho.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f0d15",
    theme_color: "#7c3aed",
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
