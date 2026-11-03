// Página pública para el celular del paciente: se abre con el enlace/QR que genera la enfermera. No requiere sesión.
import { esc, fechaLarga } from "../utils";
import { crearLienzo } from "./lienzo";

interface Info {
  numero: number;
  paciente_nombre: string;
  paciente_documento: string;
  equipo: string;
  serie: string;
  fecha_entrega: string;
  fecha_devolucion_prevista: string | null;
  duracion_horas: number;
}

const marco = (contenido: string) => `
  <div class="min-h-screen bg-slate-50 p-4 flex items-start justify-center">
    <div class="w-full max-w-md space-y-4 py-4">
      <div class="bg-white rounded-xl p-3 w-48 mx-auto shadow-lg"><img src="/favicon.png" alt="IPS Nueva Popayán" /></div>
      ${contenido}
    </div>
  </div>`;

const mensajeFinal = (icono: string, titulo: string, texto: string) =>
  marco(`<div class="bg-white rounded-2xl shadow-xl p-8 text-center space-y-3">
    <div class="text-5xl">${icono}</div><h2 class="text-xl font-semibold text-slate-900">${titulo}</h2><p class="text-slate-600">${texto}</p></div>`);

export async function renderFirmaPublica(root: HTMLElement, token: string) {
  root.innerHTML = marco(`<p class="text-center text-blue-100">Cargando...</p>`);
  let info: Info;
  try {
    const r = await fetch(`/api/publico/firma/${encodeURIComponent(token)}`);
    if (!r.ok) {
      const msg = (await r.json().catch(() => ({}))).detail ?? "Este enlace no es válido";
      root.innerHTML = mensajeFinal("⚠️", "No se puede firmar", esc(msg));
      return;
    }
    info = await r.json();
  } catch {
    root.innerHTML = mensajeFinal("📶", "Sin conexión", "No se pudo conectar. Revisa que estés en el Wi‑Fi de la IPS e inténtalo de nuevo.");
    return;
  }

  root.innerHTML = marco(`
    <form id="form" class="bg-white rounded-2xl shadow-xl p-6 space-y-4">
      <div><p class="text-xs uppercase tracking-widest text-slate-400">Acta de préstamo N° ${String(info.numero).padStart(6, "0")}</p>
        <h2 class="text-xl font-semibold text-slate-900">Hola, ${esc(info.paciente_nombre.split(" ")[0])}</h2>
        <p class="text-sm text-slate-600">Revisa los datos y firma para recibir el equipo.</p></div>
      <div class="bg-blue-50 rounded-xl p-4 text-sm space-y-1">
        <p><span class="text-slate-500">Nombre:</span> <b>${esc(info.paciente_nombre)}</b></p>
        <p><span class="text-slate-500">Documento:</span> ${esc(info.paciente_documento)}</p>
        <p><span class="text-slate-500">Equipo:</span> ${esc(info.equipo)} · serie ${esc(info.serie)}</p>
        <p><span class="text-slate-500">Entrega:</span> ${fechaLarga(new Date(info.fecha_entrega))}</p>
        <p><span class="text-slate-500">Devolver antes de:</span> <b>${info.fecha_devolucion_prevista ? fechaLarga(new Date(info.fecha_devolucion_prevista)) : "—"}</b></p>
      </div>
      <a href="/api/publico/firma/${encodeURIComponent(token)}/pdf" target="_blank" rel="noopener"
        class="block text-center bg-slate-100 hover:bg-slate-200 text-blue-800 font-medium rounded-lg py-2.5">📄 Leer el documento completo</a>
      <label class="flex items-start gap-2 text-sm text-slate-700"><input id="acepto" type="checkbox" class="w-5 h-5 mt-0.5" />
        <span>Leí el documento, los datos son correctos y acepto las condiciones del préstamo.</span></label>
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Firma con el dedo</p>
        <canvas id="lienzo" class="w-full h-44 border-2 border-dashed border-slate-300 rounded-xl bg-white touch-none"></canvas>
        <button type="button" id="borrar" class="text-sm text-slate-500 underline mt-1">Borrar firma</button>
      </div>
      <p id="error" class="text-sm text-red-600 hidden"></p>
      <button id="enviar" class="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl py-3 text-lg disabled:opacity-50">Firmar acta</button>
    </form>`);

  const q = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!;
  const lienzo = crearLienzo(q<HTMLCanvasElement>("lienzo"));
  q("borrar").addEventListener("click", () => lienzo.limpiar());

  q<HTMLFormElement>("form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const error = q("error");
    error.classList.add("hidden");
    const falla = (t: string) => {
      error.textContent = t;
      error.classList.remove("hidden");
    };
    if (!q<HTMLInputElement>("acepto").checked) return falla("Marca la casilla para confirmar que leíste el documento.");
    if (lienzo.vacio()) return falla("Dibuja tu firma en el recuadro.");
    const imagen = lienzo.aPng();

    const btn = q<HTMLButtonElement>("enviar");
    btn.disabled = true;
    btn.textContent = "Enviando...";
    try {
      const r = await fetch(`/api/publico/firma/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagen }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail ?? "No se pudo registrar la firma");
      root.innerHTML = mensajeFinal("✅", "¡Listo!", "Tu firma quedó registrada. Devuelve el celular a la enfermera, que continuará con el proceso.");
    } catch (e) {
      falla(e instanceof Error ? e.message : "No se pudo registrar la firma");
      btn.disabled = false;
      btn.textContent = "Firmar acta";
    }
  });
}