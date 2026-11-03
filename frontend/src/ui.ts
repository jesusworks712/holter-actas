// Piezas comunes de la interfaz: ventanas modales, iconos y estilos de campos.
export const INPUT =
  "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 shadow-[0_1px_2px_rgb(16_24_40/0.04)]";
export const LABEL = "block text-xs font-medium text-slate-600 mb-1.5";
export const BTN = "rounded-lg px-4 py-2 text-sm font-medium";
export const BTN_PRIMARIO = `${BTN} bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white shadow-xs disabled:opacity-50 disabled:hover:bg-blue-700`;
export const BTN_SECUNDARIO = `${BTN} bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs disabled:opacity-50`;
export const BTN_PELIGRO = `${BTN} bg-red-600 hover:bg-red-700 text-white shadow-xs disabled:opacity-50`;

export function modal(html: string, ancho = "max-w-lg") {
  const overlay = document.createElement("div");
  overlay.className = "modal-fondo fixed inset-0 bg-slate-900/45 backdrop-blur-[2px] flex items-center justify-center p-4 z-50";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.innerHTML = `<div class="modal-caja bg-white rounded-2xl shadow-2xl border border-slate-200 w-full ${ancho} max-h-[92vh] overflow-auto">${html}</div>`;
  document.body.appendChild(overlay);
  const cerrar = () => {
    document.removeEventListener("keydown", alTeclear);
    overlay.remove();
  };
  // Esc cierra la ventana (solo la que está encima)
  const alTeclear = (e: KeyboardEvent) => {
    if (e.key === "Escape" && overlay.isConnected && [...document.querySelectorAll(".modal-fondo")].pop() === overlay) cerrar();
  };
  document.addEventListener("keydown", alTeclear);
  return { overlay, cerrar, q: <T extends HTMLElement>(sel: string) => overlay.querySelector<T>(sel)! };
}

// Aviso flotante arriba a la derecha (desaparece solo).
export function toast(texto: string, tipo: "ok" | "error" | "info" = "ok", ms = 3800) {
  let cont = document.getElementById("toasts");
  if (!cont) {
    cont = document.createElement("div");
    cont.id = "toasts";
    cont.className = "fixed top-4 right-4 z-[70] space-y-2 w-[min(92vw,22rem)]";
    cont.setAttribute("role", "status");
    cont.setAttribute("aria-live", "polite");
    document.body.appendChild(cont);
  }
  const colores = { ok: "border-green-500", error: "border-red-500", info: "border-blue-600" };
  const iconos = { ok: "✔", error: "✖", info: "ℹ" };
  const t = document.createElement("div");
  t.className = `toast bg-white border border-slate-200 border-l-4 ${colores[tipo]} shadow-xl rounded-xl px-4 py-3 text-sm flex gap-2 items-start`;
  t.innerHTML = `<span class="font-bold">${iconos[tipo]}</span><span class="text-slate-700">${texto.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)}</span>`;
  cont.appendChild(t);
  setTimeout(() => {
    t.classList.add("saliendo");
    setTimeout(() => t.remove(), 260);
  }, ms);
}

// Los números con data-contar="N" suben desde 0 hasta N.
export function animarNumeros(raiz: HTMLElement) {
  raiz.querySelectorAll<HTMLElement>("[data-contar]").forEach((el) => {
    const meta = Number(el.dataset.contar);
    if (!Number.isFinite(meta) || meta === 0) return void (el.textContent = String(meta || 0));
    const t0 = performance.now();
    const paso = (t: number) => {
      const p = Math.min(1, (t - t0) / 700);
      el.textContent = String(Math.round(meta * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  });
}

const svg = (d: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;

export const icono = {
  inicio: svg("M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"),
  nueva: svg("M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5zM14 3v5h5M12 11v6M9 14h6"),
  equipos: svg("M3 12h4l2-5 4 10 2-5h6"),
  pacientes: svg("M3 5h18v14H3zM7 10h4M7 14h6M15 10h2"),
  usuarios: svg("M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 11a4 4 0 100-8 4 4 0 000 8M21 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"),
  auditoria: svg("M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4"),
  reportes: svg("M4 20V10M10 20V4M16 20v-7M22 20H2"),
  cuenta: svg("M6 11V8a6 6 0 1112 0v3M5 11h14v10H5z"),
  salir: svg("M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"),
  reloj: svg("M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"),
  documento: svg("M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5zM14 3v5h5M9 13h6M9 17h6"),
  sobre: svg("M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zM3 7l9 6 9-6"),
  retorno: svg("M9 14l-5-5 5-5M4 9h10a6 6 0 010 12h-3"),
  chevron: svg("M9 6l6 6-6 6"),
  buscar: svg("M21 21l-4.3-4.3M17 11a6 6 0 11-12 0 6 6 0 0112 0z"),
  enviar: svg("M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"),
  calendario: svg("M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z"),
  check: svg("M20 6L9 17l-5-5"),
  ban: svg("M12 21a9 9 0 100-18 9 9 0 000 18zM5.6 5.6l12.8 12.8"),
  mas: svg("M12 5v14M5 12h14"),
  alerta: svg("M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"),
  atras: svg("M19 12H5M12 19l-7-7 7-7"),
  firma: svg("M3 17c3-6 5-9 7-9s1 7 4 7 3-4 7-6M3 21h18"),
  camara: svg("M3 8h4l2-3h6l2 3h4v12H3zM12 17a4 4 0 100-8 4 4 0 000 8"),
};

export const ESTADO_EQUIPO: Record<string, { nombre: string; clase: string }> = {
  DISPONIBLE: { nombre: "Disponible", clase: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20" },
  PRESTADO: { nombre: "Prestado", clase: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/20" },
  MANTENIMIENTO: { nombre: "En mantenimiento", clase: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20" },
  BAJA: { nombre: "De baja", clase: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-400/25" },
};

export const ESTADO_ACTA: Record<string, { nombre: string; clase: string }> = {
  BORRADOR: { nombre: "Borrador", clase: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-400/25" },
  FIRMADA: { nombre: "Firmada", clase: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20" },
  ENVIADA: { nombre: "Enviada", clase: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20" },
  DEVUELTA: { nombre: "Devuelta", clase: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20" },
  ANULADA: { nombre: "Anulada", clase: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20" },
};

// ---------- Piezas del estilo "panel" (encabezados, círculos de icono, estados vacíos) ----------
export type Tono = "blue" | "green" | "violet" | "amber" | "red" | "slate";
const TONOS: Record<Tono, string> = {
  blue: "bg-blue-50 text-blue-700",
  green: "bg-emerald-50 text-emerald-600",
  violet: "bg-indigo-50 text-indigo-600",
  amber: "bg-amber-50 text-amber-500",
  red: "bg-red-50 text-red-600",
  slate: "bg-slate-100 text-slate-500",
};

// Círculo suave con un icono dentro (tarjetas, filas, paneles).
export const circulo = (svgHtml: string, tono: Tono = "blue", tam = "w-11 h-11") =>
  `<span class="${tam} rounded-full ${TONOS[tono]} inline-flex items-center justify-center shrink-0">${svgHtml}</span>`;

// Encabezado de página: etiqueta pequeña, título, subtítulo y acciones a la derecha.
export function encabezado(eyebrow: string, titulo: string, sub: string, acciones = "", tonoEyebrow = "text-slate-500") {
  return `<header class="flex items-end justify-between gap-4 flex-wrap">
    <div class="min-w-0">
      <p class="text-[11px] font-semibold uppercase tracking-[.22em] ${tonoEyebrow}">${eyebrow}</p>
      <h2 class="mt-1 text-[1.75rem] leading-tight font-bold tracking-tight text-slate-900">${titulo}</h2>
      <p class="mt-1 text-sm text-slate-500">${sub}</p>
    </div>
    ${acciones ? `<div class="flex items-center gap-2 flex-wrap">${acciones}</div>` : ""}
  </header>`;
}

// Título de un panel con su círculo de icono y, opcionalmente, un texto a la derecha.
export const tituloPanel = (svgHtml: string, texto: string, derecha = "", tono: Tono = "blue") =>
  `<div class="flex items-center justify-between gap-3 flex-wrap">
    <div class="flex items-center gap-3">${circulo(svgHtml, tono, "w-9 h-9")}<h3 class="font-semibold text-slate-900">${texto}</h3></div>${derecha}
  </div>`;

// Estado vacío: icono grande en círculo, título y explicación.
export const estadoVacio = (svgHtml: string, titulo: string, texto: string, tono: Tono = "blue") =>
  `<div class="py-12 flex flex-col items-center text-center">
    ${circulo(svgHtml, tono, "w-20 h-20 [&>svg]:w-9 [&>svg]:h-9")}
    <p class="mt-5 font-semibold text-slate-900">${titulo}</p>
    <p class="mt-1 text-sm text-slate-500 max-w-sm">${texto}</p>
  </div>`;

// Aísla la página mientras un modal está abierto: el resto de la aplicación queda `inert`
// (no recibe puntero, foco ni scroll). El modal sigue recibiendo todos los toques normalmente,
// incluidos los campos de texto, los botones y el lienzo de firma.
export function aislarFondo(overlay: HTMLElement): () => void {
  const fondo = [...document.body.children].filter((el) => el !== overlay && el.id !== "toasts") as HTMLElement[];
  const previo = document.body.style.overflow;
  fondo.forEach((el) => el.setAttribute("inert", ""));
  document.body.style.overflow = "hidden";
  return () => {
    fondo.forEach((el) => el.removeAttribute("inert"));
    document.body.style.overflow = previo;
  };
}