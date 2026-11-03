import { api, clearToken, Usuario } from "../api";
import { Dashboard } from "../types";
import { esc } from "../utils";
import { icono } from "../ui";

interface Enlace {
  hash: string;
  texto: string;
  icono: string;
  admin?: boolean;
}

const ENLACES: Enlace[] = [
  { hash: "#/", texto: "Inicio", icono: icono.inicio },
  { hash: "#/nueva", texto: "Nueva acta", icono: icono.nueva },
  { hash: "#/vencidas", texto: "Vencidas", icono: icono.reloj },
  { hash: "#/pacientes", texto: "Pacientes", icono: icono.pacientes },
  { hash: "#/equipos", texto: "Equipos", icono: icono.equipos, admin: true },
  { hash: "#/usuarios", texto: "Usuarios", icono: icono.usuarios, admin: true },
  { hash: "#/reportes", texto: "Reportes", icono: icono.reportes, admin: true },
  { hash: "#/auditoria", texto: "Auditoría", icono: icono.auditoria, admin: true },
];

// Dibuja el menú lateral (claro, minimalista; activo en azul institucional) y devuelve el contenedor donde va cada pantalla.
export function renderShell(root: HTMLElement, user: Usuario, onLogout: () => void): HTMLElement {
  const actual = location.hash || "#/";
  const iniciales = user.nombre.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  const enlaces = ENLACES.filter((e) => !e.admin || user.rol === "ADMIN")
    .map((e) => {
      const activo =
        e.hash === "#/" ? actual === "#/" || actual === "" : e.hash === "#/equipos" ? actual.startsWith("#/equipo") : actual.startsWith(e.hash);
      const base = "nav-item flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium";
      const badge = e.hash === "#/vencidas" ? `<span id="badge-vencidas" class="hidden ml-auto text-[11px] font-semibold bg-red-500 text-white rounded-full px-2 py-0.5"></span>` : "";
      return `<a href="${e.hash}" ${activo ? 'aria-current="page"' : ""} class="${base} ${
        activo ? "nav-activo text-white" : "text-blue-50/90 hover:bg-white/10 hover:text-white"
      }">${e.icono}<span>${e.texto}</span>${badge}</a>`;
    })
    .join("");

  root.innerHTML = `
    <div class="md:hidden lateral text-white flex items-center justify-between px-4 py-3 sticky top-0 z-30">
      <span class="font-semibold tracking-tight">Préstamo de equipos</span>
      <button id="menu" class="p-2 -mr-2 rounded-lg text-white hover:bg-white/10" aria-label="Abrir menú" aria-expanded="false" aria-controls="lateral">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
    </div>
    <div id="fondo" class="hidden fixed inset-0 bg-slate-900/45 backdrop-blur-[2px] z-30 md:hidden"></div>
    <aside id="lateral" class="lateral hidden md:flex fixed inset-y-0 left-0 w-64 z-40 flex-col text-white">
      <div class="px-5 pt-6 pb-4">
        <img src="/logo-blanco.png" alt="IPS Nueva Popayán" class="w-full h-auto max-w-[170px]" />
        <p class="mt-5 text-[11px] font-medium uppercase tracking-[.2em] text-blue-200/90 leading-relaxed">Préstamo de equipos de cardiología</p>
      </div>
      <nav class="flex-1 px-4 pt-3 space-y-1 overflow-auto" aria-label="Principal">${enlaces}</nav>
      <div class="p-4">
        <div class="flex items-center gap-3 px-2 py-2">
          <div class="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold shrink-0">${esc(iniciales)}</div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-white truncate">${esc(user.nombre)}</p>
            <p class="text-xs text-blue-200">${user.rol === "ADMIN" ? "Administrador" : "Operador"}</p>
          </div>
        </div>
        <div class="flex gap-2 mt-2">
          <a href="#/cuenta" class="flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap border border-white/25 hover:bg-white/10 rounded-xl px-2 py-2 text-xs font-medium text-white">${icono.cuenta}Mi cuenta</a>
          <button id="logout" class="flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap border border-white/25 hover:bg-white/10 rounded-xl px-2 py-2 text-xs font-medium text-white">${icono.salir}Salir</button>
        </div>
      </div>
    </aside>
    <main id="main" class="md:pl-64"><div id="contenido" class="max-w-7xl mx-auto p-4 md:p-8"></div></main>`;

  const lateral = root.querySelector<HTMLElement>("#lateral")!;
  const fondo = root.querySelector<HTMLElement>("#fondo")!;
  const alternar = () => {
    lateral.classList.toggle("hidden");
    fondo.classList.toggle("hidden");
    root.querySelector("#menu")!.setAttribute("aria-expanded", String(!lateral.classList.contains("hidden")));
  };
  root.querySelector("#menu")!.addEventListener("click", alternar);
  fondo.addEventListener("click", alternar);
  lateral.querySelectorAll("nav a, a[href='#/cuenta']").forEach((a) =>
    a.addEventListener("click", () => {
      if (!fondo.classList.contains("hidden")) alternar();
    }),
  );
  // Aviso en el menú: cuántos equipos tienen el plazo vencido.
  api<Dashboard>("/dashboard")
    .then((d) => {
      const b = root.querySelector<HTMLElement>("#badge-vencidas");
      if (b && d.vencidas > 0) {
        b.textContent = `${d.vencidas} vencida${d.vencidas > 1 ? "s" : ""}`;
        b.classList.remove("hidden");
      }
    })
    .catch(() => {});
  root.querySelector("#logout")!.addEventListener("click", () => {
    clearToken();
    onLogout();
  });
  return root.querySelector<HTMLElement>("#contenido")!;
}
