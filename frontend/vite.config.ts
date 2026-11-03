import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    port: 5173,
    host: true, // permite abrirlo desde el celular en la misma red Wi-Fi
    // Las llamadas a /api se reenvían al backend: no hay problemas de CORS.
    proxy: { "/api": "http://localhost:8000" },
  },
});