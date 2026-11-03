/**
 * Página de equipos vencidos.
 * Muestra la lista de actas cuya fecha de devolución ya pasó,
 * con el teléfono del paciente para contactarlo directamente.
 */
import { api, ApiError, abrirPdf } from "../api";
import { esc, fechaLarga } from "../utils";
import { toast, modal, BTN_PRIMARIO, BTN_SECUNDARIO, BTN_PELIGRO, encabezado, icono } from "../ui";

interface ActaVencida {
  acta_id: string;
  numero: number;
  estado: string;
  paciente_nombre: string;
  paciente_documento: string;
  paciente_correo: string | null;
  paciente_telefono: string | null;
  equipo_tipo: string;
  equipo_serie: string;
  fecha_entrega: string | null;
  fecha_devolucion_prevista: string | null;
  dias_vencida: number | null;
}

const BTN = "rounded-lg px-3 py-1.5 text-sm font-medium transition";

export async function renderVencidas(main: HTMLElement) {
  let lista: ActaVencida[] = [];
  let filtro = "";

  main.innerHTML = `
    <div class="space-y-5">
      ${encabezado("Atención", "Equipos vencidos", "Actas cuya fecha de devolución ya pasó y el equipo no ha sido devuelto.",
        `<a href="#/" class="${BTN_SECUNDARIO} inline-flex items-center gap-2 !rounded-xl">${icono.atras}Volver al inicio</a>`, "text-red-600")}

      <section class="bg-white rounded-2xl shadow p-5 space-y-4">
        <div class="flex items-center gap-3 flex-wrap">
          <input id="buscar" placeholder="Buscar por nombre, documento, serie..."
            class="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-red-500" />
          <button id="recargar" class="bg-slate-100 hover:bg-slate-200 text-slate-700 ${BTN}">↺ Actualizar</button>
        </div>
        <p id="conteo" class="text-sm text-slate-500"></p>
        <div id="lista" class="divide-y"></div>
      </section>
    </div>`;

  const $ = <T extends HTMLElement>(id: string) => main.querySelector<T>(`#${id}`)!;

  const cargar = async () => {
    $("lista").innerHTML = `
      ${'<div class="py-4 flex gap-3"><div class="skeleton w-5 h-5"></div><div class="flex-1 space-y-2"><div class="skeleton h-4 w-2/3"></div><div class="skeleton h-3 w-1/2"></div></div></div>'.repeat(4)}`;
    try {
      lista = await api<ActaVencida[]>("/dashboard/vencidas?limit=200");
      pintar();
    } catch (err) {
      $("lista").innerHTML = `<p class="py-8 text-center text-red-600">No se pudieron cargar las actas vencidas.</p>`;
      toast(err instanceof ApiError ? err.message : "Error al cargar vencidas", "error");
    }
  };

  const visibles = () => {
    if (!filtro.trim()) return lista;
    const q = filtro.toLowerCase();
    return lista.filter(
      (a) =>
        a.paciente_nombre.toLowerCase().includes(q) ||
        a.paciente_documento.includes(q) ||
        a.equipo_serie.toLowerCase().includes(q),
    );
  };

  const badgeDias = (dias: number | null) => {
    if (dias === null) return "";
    const color = dias === 0 ? "bg-amber-100 text-amber-800" : dias <= 1 ? "bg-orange-100 text-orange-800" : "bg-red-100 text-red-800";
    return `<span class="text-xs px-2 py-0.5 rounded-full font-semibold ${color}">${dias === 0 ? "Hoy" : dias === 1 ? "1 día" : `${dias} días`}</span>`;
  };

  const pintar = () => {
    const items = visibles();
    $("conteo").textContent = lista.length
      ? `${items.length} de ${lista.length} equipo(s) vencido(s)${filtro ? " (filtrado)" : ""}`
      : "No hay equipos vencidos. ✔";

    if (!items.length) {
      $("lista").innerHTML = `<p class="py-10 text-center text-slate-400">${filtro ? "Sin resultados para esa búsqueda." : "🎉 No hay equipos vencidos."}</p>`;
      return;
    }

    $("lista").innerHTML = items
      .map(
        (a) => `
      <div class="py-4 flex items-start gap-3 flex-wrap" data-id="${a.acta_id}">
        <span class="text-red-500 text-xl leading-none pt-0.5">⏰</span>
        <div class="flex-1 min-w-0 space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="font-semibold">#${a.numero} · ${esc(a.paciente_nombre)}</p>
            ${badgeDias(a.dias_vencida)}
            <span class="text-xs px-2 py-0.5 rounded-full ${a.estado === "ENVIADA" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}">${a.estado === "ENVIADA" ? "Enviada" : "Sin enviar"}</span>
          </div>
          <p class="text-sm text-slate-600">
            ${esc(a.equipo_tipo)} · serie <b>${esc(a.equipo_serie)}</b>
            · Doc: ${esc(a.paciente_documento)}
          </p>
          <div class="flex gap-4 flex-wrap text-sm">
            ${a.paciente_telefono
              ? `<a href="tel:${esc(a.paciente_telefono)}" class="text-blue-700 hover:underline font-medium">📞 ${esc(a.paciente_telefono)}</a>`
              : `<span class="text-slate-400">Sin teléfono</span>`}
            ${a.paciente_correo
              ? `<a href="mailto:${esc(a.paciente_correo)}" class="text-blue-700 hover:underline text-xs truncate max-w-xs">${esc(a.paciente_correo)}</a>`
              : `<span class="text-slate-400 text-xs">Sin correo</span>`}
          </div>
          <p class="text-xs text-red-600">
            Debía devolver: ${a.fecha_devolucion_prevista ? fechaLarga(new Date(a.fecha_devolucion_prevista)) : "—"}
          </p>
        </div>
        <div class="flex gap-2 shrink-0 flex-wrap justify-end">
          <button data-pdf class="${BTN} bg-slate-100 hover:bg-slate-200">Ver PDF</button>
          <button data-devolver class="${BTN} bg-blue-700 hover:bg-blue-800 text-white">Marcar devuelta</button>
        </div>
      </div>`,
      )
      .join("");
  };

  // ── Devolución ──────────────────────────────────────────────────────────────
  const pedirDevolucion = (a: ActaVencida): Promise<{ estado_equipo: string; observaciones: string } | null> =>
    new Promise((resolve) => {
      const { overlay, cerrar, q } = modal(`
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-semibold">Registrar devolución tardía</h3>
          <p class="text-sm text-slate-600">
            <b>${esc(a.paciente_nombre)}</b> devuelve el ${esc(a.equipo_tipo)}
            serie <b>${esc(a.equipo_serie)}</b>.
            ${a.dias_vencida ? `<span class="text-red-600 font-medium">Lleva ${a.dias_vencida} día(s) de retraso.</span>` : ""}
          </p>
          <div>
            <label class="block text-sm font-medium mb-1">¿En qué estado queda el equipo?</label>
            <select id="d-estado" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              <option value="DISPONIBLE">Disponible (listo para prestar)</option>
              <option value="MANTENIMIENTO">En mantenimiento (tiene algún daño)</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Observaciones (opcional)</label>
            <textarea id="d-obs" rows="2" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Ej: El paciente lo trajo con el cable doblado"></textarea>
          </div>
          <div class="flex justify-end gap-2">
            <button id="d-cancelar" class="${BTN_SECUNDARIO}">Cancelar</button>
            <button id="d-ok" class="${BTN_PRIMARIO}">Confirmar devolución</button>
          </div>
        </div>`);

      q("#d-cancelar").addEventListener("click", () => { cerrar(); resolve(null); });
      q("#d-ok").addEventListener("click", () => {
        const estado_equipo = q<HTMLSelectElement>("#d-estado").value;
        const observaciones = q<HTMLTextAreaElement>("#d-obs").value.trim();
        cerrar();
        resolve({ estado_equipo, observaciones });
      });
    });

  const devolver = async (a: ActaVencida) => {
    const r = await pedirDevolucion(a);
    if (!r) return;
    try {
      await api(`/actas/${a.acta_id}/devolver`, {
        method: "POST",
        body: JSON.stringify({ estado_equipo: r.estado_equipo, observaciones: r.observaciones || null }),
      });
      toast(
        r.estado_equipo === "DISPONIBLE"
          ? `Devolución registrada. El equipo ${a.equipo_serie} quedó disponible.`
          : `Devolución registrada. El equipo ${a.equipo_serie} quedó en mantenimiento.`,
        "ok",
      );
      await cargar();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "No se pudo registrar la devolución", "error");
    }
  };

  // ── Eventos ─────────────────────────────────────────────────────────────────
  main.addEventListener("click", async (e) => {
    const t = e.target as HTMLElement;
    const filaEl = t.closest<HTMLElement>("[data-id]");
    const btn = t.closest("button");

    if (t.id === "recargar" || t.closest("#recargar")) {
      await cargar();
      return;
    }
    if (!filaEl || !btn) return;

    const acta = lista.find((a) => a.acta_id === filaEl.dataset.id);
    if (!acta) return;

    if (btn.hasAttribute("data-pdf")) {
      try { await abrirPdf(acta.acta_id); }
      catch (err) { toast(err instanceof ApiError ? err.message : "No se pudo abrir el PDF", "error"); }
    } else if (btn.hasAttribute("data-devolver")) {
      await devolver(acta);
    }
  });

  $<HTMLInputElement>("buscar").addEventListener("input", (e) => {
    filtro = (e.target as HTMLInputElement).value;
    pintar();
  });

  await cargar();
}
