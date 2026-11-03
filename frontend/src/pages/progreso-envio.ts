// Ventana de progreso 0 % → 100 % para el envío de actas por correo (Gmail), con animación.
import { esc } from "../utils";

const ETAPAS = [
  { hasta: 22, texto: "Preparando el documento…" },
  { hasta: 48, texto: "Conectando con Gmail…" },
  { hasta: 86, texto: "Enviando el correo…" },
  { hasta: 100, texto: "Confirmando la entrega…" },
];
const COLORES = ["#2554bf", "#5b8aee", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export class PanelProgreso {
  private el = document.createElement("div");
  private pct = 0;
  private raf = 0;
  private cerrado!: () => void;
  readonly alCerrar = new Promise<void>((r) => (this.cerrado = r));

  constructor(titulo: string, detalle = "") {
    this.el.className = "modal-fondo fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-[60]";
    this.el.innerHTML = `
      <div class="modal-caja relative overflow-hidden bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center space-y-4">
        <div id="p-confeti" class="absolute inset-x-0 top-0 h-0 pointer-events-none"></div>
        <div id="p-visual" class="relative w-40 h-40 mx-auto">
          <svg viewBox="0 0 120 120" class="w-40 h-40 -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#e3eaf5" stroke-width="9" />
            <circle id="p-aro" cx="60" cy="60" r="52" fill="none" stroke="#2554bf" stroke-width="9" stroke-linecap="round"
              stroke-dasharray="326.7" stroke-dashoffset="326.7" style="transition: stroke .3s" />
          </svg>
          <div id="p-centro" class="absolute inset-0 flex items-center justify-center"><span id="p-num" class="text-4xl font-bold text-blue-900">0%</span></div>
        </div>
        <div><h3 id="p-titulo" class="text-lg font-semibold text-slate-900">${esc(titulo)}</h3>
          <p id="p-etapa" class="text-sm text-blue-700 font-medium mt-1" style="animation:pulseSoft 1.4s infinite">Preparando el documento…</p>
          <p id="p-detalle" class="text-xs text-slate-500 mt-1 truncate">${esc(detalle)}</p></div>
        <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden"><div id="p-barra" class="h-2 rounded-full bg-blue-600" style="width:0%"></div></div>
        <div id="p-res" class="text-left text-sm space-y-1 max-h-36 overflow-auto"></div>
        <button id="p-cerrar" class="hidden bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-6 py-2.5 font-medium">Listo</button>
      </div>`;
    document.body.appendChild(this.el);
    this.q("#p-cerrar").addEventListener("click", () => this.cerrar());
  }

  private q<T extends HTMLElement = HTMLElement>(s: string) {
    return this.el.querySelector<T>(s)!;
  }

  /** Fija el porcentaje (0-100) con transición suave. */
  poner(pct: number, etapa?: string) {
    this.pct = Math.max(0, Math.min(100, pct));
    const redondo = Math.round(this.pct);
    this.q("#p-aro").style.strokeDashoffset = String(326.7 * (1 - this.pct / 100));
    this.q("#p-barra").style.width = `${this.pct}%`;
    const num = this.q("#p-num");
    if (num) num.textContent = `${redondo}%`;
    this.q("#p-etapa").textContent = etapa ?? (ETAPAS.find((e) => this.pct <= e.hasta) ?? ETAPAS[3]).texto;
  }

  /** Avanza despacio hacia `tope` mientras se espera la respuesta (nunca llega a 100 por sí sola). */
  avanzarHacia(desde: number, tope: number, tau = 2600, etapa?: (p: number) => string | undefined) {
    cancelAnimationFrame(this.raf);
    const t0 = performance.now();
    const paso = (t: number) => {
      const p = desde + (tope - desde) * (1 - Math.exp(-(t - t0) / tau));
      this.poner(p, etapa?.(p));
      this.raf = requestAnimationFrame(paso);
    };
    this.raf = requestAnimationFrame(paso);
  }

  /** Completa el tramo restante hasta `meta` rápidamente. */
  completarHasta(meta: number, ms = 450): Promise<void> {
    cancelAnimationFrame(this.raf);
    const desde = this.pct;
    return new Promise((res) => {
      const t0 = performance.now();
      const paso = (t: number) => {
        const k = Math.min(1, (t - t0) / ms);
        this.poner(desde + (meta - desde) * (1 - Math.pow(1 - k, 3)));
        if (k < 1) this.raf = requestAnimationFrame(paso);
        else res();
      };
      this.raf = requestAnimationFrame(paso);
    });
  }

  detalle(t: string) {
    this.q("#p-detalle").textContent = t;
  }

  async exito(titulo: string, detalle = "", parcial = false) {
    cancelAnimationFrame(this.raf);
    await this.completarHasta(100, 350);
    this.q("#p-visual").innerHTML = `
      <div class="anillo-exito w-40 h-40 rounded-full ${parcial ? "bg-amber-100" : "bg-green-100"} flex items-center justify-center">
        <svg viewBox="0 0 52 52" class="w-20 h-20"><path class="check-trazo" fill="none" stroke="${parcial ? "#d97706" : "#16a34a"}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" d="M14 27l8 8 16-17"/></svg>
      </div>`;
    this.q("#p-barra").className = `h-2 rounded-full ${parcial ? "bg-amber-500" : "bg-green-500"}`;
    this.q("#p-titulo").textContent = titulo;
    const etapa = this.q("#p-etapa");
    etapa.style.animation = "none";
    etapa.className = `text-sm font-medium mt-1 ${parcial ? "text-amber-700" : "text-green-700"}`;
    etapa.textContent = parcial ? "Revisa los detalles" : "Entregado a Gmail";
    this.q("#p-detalle").textContent = detalle;
    if (!parcial) this.confeti();
    this.q("#p-cerrar").classList.remove("hidden");
  }

  fallo(titulo: string, detalle: string) {
    cancelAnimationFrame(this.raf);
    this.q("#p-visual").innerHTML = `
      <div class="anillo-exito w-40 h-40 rounded-full bg-red-100 flex items-center justify-center">
        <svg viewBox="0 0 52 52" class="w-20 h-20"><path class="check-trazo" fill="none" stroke="#dc2626" stroke-width="5" stroke-linecap="round" d="M16 16l20 20M36 16L16 36"/></svg>
      </div>`;
    this.q("#p-barra").className = "h-2 rounded-full bg-red-500";
    this.q("#p-titulo").textContent = titulo;
    const etapa = this.q("#p-etapa");
    etapa.style.animation = "none";
    etapa.className = "text-sm text-red-600 font-medium mt-1";
    etapa.textContent = detalle;
    this.q("#p-detalle").textContent = "";
    this.q("#p-cerrar").textContent = "Cerrar";
    this.q("#p-cerrar").classList.remove("hidden");
  }

  lineas(html: string) {
    this.q("#p-res").innerHTML = html;
  }

  private confeti() {
    const c = this.q("#p-confeti");
    c.innerHTML = Array.from({ length: 26 }, () => {
      const x = Math.random() * 100;
      const d = Math.random() * 0.5;
      return `<span class="confeti" style="left:${x}%;background:${COLORES[Math.floor(Math.random() * COLORES.length)]};animation-delay:${d}s;transform:rotate(${Math.random() * 90}deg)"></span>`;
    }).join("");
  }

  cerrar() {
    cancelAnimationFrame(this.raf);
    this.el.remove();
    this.cerrado();
  }
}

/** Ejecuta UNA tarea (por ejemplo enviar un acta) mostrando el progreso. Resuelve cuando la persona cierra la ventana. */
export async function ejecutarConProgreso<T>(opts: {
  titulo: string;
  detalle?: string;
  textoOk: string;
  textoError?: string;
  tarea: () => Promise<T>;
}): Promise<{ ok: true; valor: T } | { ok: false; error: string }> {
  const panel = new PanelProgreso(opts.titulo, opts.detalle);
  panel.poner(0);
  panel.avanzarHacia(0, 92);
  try {
    const valor = await opts.tarea();
    await panel.exito(opts.textoOk, opts.detalle);
    const autoCierre = window.setTimeout(() => panel.cerrar(), 3500);
    await panel.alCerrar;
    clearTimeout(autoCierre);
    return { ok: true, valor };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    panel.fallo(opts.textoError ?? "No se pudo enviar", error);
    await panel.alCerrar;
    return { ok: false, error };
  }
}

/** Envía varias actas seguidas: el porcentaje avanza por cada una. */
export async function ejecutarLote<A>(opts: {
  titulo: string;
  items: A[];
  nombre: (a: A) => string;
  tarea: (a: A) => Promise<unknown>;
}): Promise<{ ok: number; fallos: { item: A; motivo: string }[] }> {
  const n = opts.items.length;
  const panel = new PanelProgreso(opts.titulo, "");
  panel.poner(0);
  const fallos: { item: A; motivo: string }[] = [];
  let ok = 0;
  for (let i = 0; i < n; i++) {
    const a = opts.items[i];
    const ini = (i / n) * 100;
    const fin = ((i + 1) / n) * 100;
    panel.detalle(`${opts.nombre(a)} · ${i + 1} de ${n}`);
    panel.avanzarHacia(ini, ini + (fin - ini) * 0.92, 2200);
    try {
      await opts.tarea(a);
      ok++;
    } catch (e) {
      fallos.push({ item: a, motivo: e instanceof Error ? e.message : "Error de conexión" });
    }
    await panel.completarHasta(fin, 300);
  }
  const todo = fallos.length === 0;
  panel.lineas(fallos.map((f) => `<p class="text-red-600">• ${esc(opts.nombre(f.item))}: ${esc(f.motivo)}</p>`).join(""));
  await panel.exito(
    todo ? (n === 1 ? "¡Enviado correctamente!" : `¡${ok} actas enviadas correctamente!`) : `${ok} enviada(s), ${fallos.length} con error`,
    todo ? "" : "Las que fallaron siguen en «Por enviar»",
    !todo,
  );
  await panel.alCerrar;
  return { ok, fallos };
}
