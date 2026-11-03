import { abrirPdf, api, ApiError } from "../api";
import { HistorialPaciente, Paciente, PacienteResumen } from "../types";
import { BTN_PRIMARIO, BTN_SECUNDARIO, encabezado, ESTADO_ACTA, INPUT, LABEL, modal, toast } from "../ui";
import { esc, fechaLarga } from "../utils";

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const POR_PAGINA = 20;

const iniciales = (n: string) => n.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
const COLORES = ["bg-blue-100 text-blue-700", "bg-indigo-100 text-indigo-700", "bg-sky-100 text-sky-700", "bg-cyan-100 text-cyan-700", "bg-violet-100 text-violet-700"];
const colorDe = (s: string) => COLORES[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORES.length];

export async function renderPacientes(main: HTMLElement) {
  let items: PacienteResumen[] = [];
  let total = 0;
  let pagina = 0;
  let q = "";
  let orden: "nombre" | "reciente" | "prestamos" = "nombre";
  let soloPrestamo = false;
  let animar = true;

  main.innerHTML = `
    <div class="space-y-6">
      ${encabezado("Registro", "Pacientes", "Todos los pacientes registrados, con su historial de préstamos.",
        `<p id="total" class="text-sm text-slate-500"></p>`)}
      <section class="bg-white rounded-2xl shadow p-5 space-y-4">
        <div class="flex gap-3 flex-wrap items-center">
          <input id="buscar" placeholder="Buscar por nombre, cédula o correo..." class="${INPUT} md:max-w-sm" />
          <select id="orden" class="${INPUT} !w-auto">
            <option value="nombre">Ordenar: nombre (A-Z)</option>
            <option value="reciente">Ordenar: préstamo más reciente</option>
            <option value="prestamos">Ordenar: más préstamos</option>
          </select>
          <label class="flex items-center gap-2 text-sm text-slate-600 cursor-pointer"><input id="solo" type="checkbox" class="w-4 h-4" /> Solo con equipo en préstamo</label>
        </div>
        <p id="msg" class="text-sm text-red-600"></p>
        <div id="lista" class="divide-y"></div>
        <div id="paginacion" class="flex items-center justify-between gap-3 flex-wrap text-sm text-slate-500"></div>
      </section>
    </div>`;
  const $ = <T extends HTMLElement>(id: string) => main.querySelector<T>(`#${id}`)!;

  const esqueleto = () =>
    ($("lista").innerHTML = '<div class="py-3 flex gap-3 items-center"><div class="skeleton w-10 h-10 !rounded-full"></div><div class="flex-1 space-y-2"><div class="skeleton h-4 w-1/3"></div><div class="skeleton h-3 w-1/2"></div></div></div>'.repeat(5));

  const cargar = async () => {
    $("msg").textContent = "";
    if (!items.length) esqueleto();
    try {
      const p = new URLSearchParams({ limit: String(POR_PAGINA), offset: String(pagina * POR_PAGINA), orden });
      if (q) p.set("q", q);
      if (soloPrestamo) p.set("solo_en_prestamo", "true");
      const r = await api<{ total: number; items: PacienteResumen[] }>(`/pacientes/listado?${p}`);
      items = r.items;
      total = r.total;
      pintar();
    } catch (e) {
      $("msg").textContent = e instanceof ApiError ? e.message : "No se pudo cargar la lista de pacientes.";
    }
  };

  const pintar = () => {
    $("total").textContent = `${total} paciente${total === 1 ? "" : "s"}${q || soloPrestamo ? " con este filtro" : " registrados"}`;
    $("lista").className = `divide-y ${animar ? "escalonado" : ""}`;
    animar = false;
    $("lista").innerHTML = items.length
      ? items
          .map(
            (p) => `<div class="py-3 flex items-center gap-3 cursor-pointer hover:bg-blue-50/50 rounded-lg px-2 -mx-2 transition" data-id="${p.id}">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${colorDe(p.nombre_completo)}">${esc(iniciales(p.nombre_completo))}</div>
              <div class="flex-1 min-w-0">
                <p class="font-medium truncate">${esc(p.nombre_completo)}</p>
                <p class="text-sm text-slate-500 truncate">${esc(p.tipo_documento)} ${esc(p.numero_documento)} · ${esc(p.correo) || "sin correo"}${p.telefono ? " · " + esc(p.telefono) : ""}</p>
              </div>
              <div class="hidden sm:block text-right text-xs text-slate-500 shrink-0">
                <p><b class="text-blue-800 text-sm">${p.total_prestamos}</b> préstamo${p.total_prestamos === 1 ? "" : "s"}</p>
                <p>${p.ultimo_prestamo ? "Último: " + fechaLarga(new Date(p.ultimo_prestamo)) : "Sin préstamos"}</p>
              </div>
              ${p.en_prestamo ? `<span class="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-medium shrink-0">Con equipo</span>` : ""}
              <span class="text-slate-300 shrink-0">›</span>
            </div>`,
          )
          .join("")
      : `<p class="py-10 text-center text-slate-400">${q || soloPrestamo ? "No hay pacientes con ese filtro." : "Aún no hay pacientes registrados."}</p>`;

    const desde = total ? pagina * POR_PAGINA + 1 : 0;
    const hasta = Math.min(total, (pagina + 1) * POR_PAGINA);
    $("paginacion").innerHTML = total
      ? `<span>Mostrando ${desde}–${hasta} de ${total}</span>
         <div class="flex gap-2"><button id="ant" class="${BTN_SECUNDARIO} !py-1.5" ${pagina === 0 ? "disabled" : ""}>← Anterior</button>
         <button id="sig" class="${BTN_SECUNDARIO} !py-1.5" ${hasta >= total ? "disabled" : ""}>Siguiente →</button></div>`
      : "";
  };

  let temporizador: number | undefined;
  $<HTMLInputElement>("buscar").addEventListener("input", (e) => {
    clearTimeout(temporizador);
    temporizador = window.setTimeout(() => {
      q = (e.target as HTMLInputElement).value.trim();
      pagina = 0;
      animar = true;
      cargar();
    }, 300);
  });
  $<HTMLSelectElement>("orden").addEventListener("change", (e) => {
    orden = (e.target as HTMLSelectElement).value as typeof orden;
    pagina = 0;
    animar = true;
    cargar();
  });
  $<HTMLInputElement>("solo").addEventListener("change", (e) => {
    soloPrestamo = (e.target as HTMLInputElement).checked;
    pagina = 0;
    animar = true;
    cargar();
  });
  $("paginacion").addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest("button");
    if (!b || b.disabled) return;
    pagina += b.id === "sig" ? 1 : -1;
    animar = true;
    cargar();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  $("lista").addEventListener("click", (e) => {
    const p = items.find((x) => x.id === (e.target as HTMLElement).closest<HTMLElement>("[data-id]")?.dataset.id);
    if (p) ficha(p);
  });

  // ---------- Ficha del paciente ----------
  const ficha = async (p: PacienteResumen) => {
    const m = modal(
      `<div class="p-6 space-y-5">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-12 h-12 rounded-full flex items-center justify-center font-semibold shrink-0 ${colorDe(p.nombre_completo)}">${esc(iniciales(p.nombre_completo))}</div>
            <div class="min-w-0"><h3 class="text-lg font-semibold text-slate-900 truncate">${esc(p.nombre_completo)}</h3>
              <p class="text-sm text-slate-500">${esc(p.tipo_documento)} ${esc(p.numero_documento)}</p></div>
          </div>
          <button id="p-x" class="text-slate-400 hover:text-slate-700 text-xl leading-none">✕</button>
        </div>
        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="bg-blue-50 rounded-xl p-3"><p class="text-2xl font-bold text-blue-800">${p.total_prestamos}</p><p class="text-xs text-slate-500">Préstamos</p></div>
          <div class="bg-blue-50 rounded-xl p-3"><p class="text-sm font-semibold text-blue-800 mt-1.5">${p.ultimo_prestamo ? fechaLarga(new Date(p.ultimo_prestamo)) : "—"}</p><p class="text-xs text-slate-500">Último préstamo</p></div>
          <div class="${p.en_prestamo ? "bg-amber-50" : "bg-green-50"} rounded-xl p-3"><p class="text-sm font-semibold ${p.en_prestamo ? "text-amber-700" : "text-green-700"} mt-1.5">${p.en_prestamo ? "Tiene un equipo" : "Sin equipos"}</p><p class="text-xs text-slate-500">Estado actual</p></div>
        </div>
        <details class="rounded-xl border border-slate-200 p-4">
          <summary class="cursor-pointer font-medium text-blue-900">✏️ Editar datos del paciente</summary>
          <form id="p-form" class="grid grid-cols-2 gap-3 mt-4">
            <div><label class="${LABEL}">Tipo</label><select id="p-tipo" class="${INPUT}">${["CC", "TI", "CE", "PA"].map((t) => `<option ${t === p.tipo_documento ? "selected" : ""}>${t}</option>`).join("")}</select></div>
            <div><label class="${LABEL}">Documento</label><input id="p-doc" class="${INPUT}" value="${esc(p.numero_documento)}" /></div>
            <div class="col-span-2"><label class="${LABEL}">Nombre completo</label><input id="p-nombre" class="${INPUT}" value="${esc(p.nombre_completo)}" /></div>
            <div><label class="${LABEL}">Expedida en</label><input id="p-exp" class="${INPUT}" value="${esc(p.ciudad_expedicion)}" /></div>
            <div><label class="${LABEL}">Vecino de</label><input id="p-vecino" class="${INPUT}" value="${esc(p.vecino_de)}" /></div>
            <div><label class="${LABEL}">Correo</label><input id="p-correo" type="email" class="${INPUT}" value="${esc(p.correo)}" /></div>
            <div><label class="${LABEL}">Teléfono</label><input id="p-tel" class="${INPUT}" value="${esc(p.telefono)}" /></div>
            <p id="p-msg" class="col-span-2 text-sm hidden"></p>
            <div class="col-span-2 flex justify-end"><button class="${BTN_PRIMARIO}">Guardar cambios</button></div>
          </form>
        </details>
        <div><h4 class="font-semibold text-slate-900 mb-2">Historial de préstamos</h4><div id="p-hist" class="text-sm text-slate-500">Cargando...</div></div>
      </div>`,
      "max-w-2xl",
    );
    m.q("#p-x").addEventListener("click", m.cerrar);
    const msg = (t: string) => {
      m.q("#p-msg").textContent = t;
      m.q("#p-msg").className = "col-span-2 text-sm text-red-600";
    };
    m.q<HTMLFormElement>("#p-form").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const v = (id: string) => m.q<HTMLInputElement>(id).value.trim();
      if (!v("#p-nombre") || !v("#p-doc")) return msg("Nombre y documento son obligatorios.");
      if (v("#p-correo") && !EMAIL_OK.test(v("#p-correo"))) return msg("El correo no es válido.");
      try {
        const nuevo = await api<Paciente>(`/pacientes/${p.id}`, {
          method: "PUT",
          body: JSON.stringify({
            tipo_documento: v("#p-tipo"), numero_documento: v("#p-doc"), nombre_completo: v("#p-nombre"),
            ciudad_expedicion: v("#p-exp") || null, vecino_de: v("#p-vecino") || null, correo: v("#p-correo") || null, telefono: v("#p-tel") || null,
          }),
        });
        items = items.map((x) => (x.id === nuevo.id ? { ...x, ...nuevo } : x));
        pintar();
        m.cerrar();
        toast("Datos del paciente actualizados. Las actas ya firmadas conservan los datos originales.", "ok");
      } catch (e) {
        msg(e instanceof ApiError ? e.message : "No se pudo guardar");
      }
    });
    try {
      const h = await api<HistorialPaciente[]>(`/pacientes/${p.id}/historial`);
      m.q("#p-hist").innerHTML = h.length
        ? `<div class="overflow-auto"><table class="w-full text-left"><tbody class="divide-y escalonado">${h
            .map((i) => {
              const e = ESTADO_ACTA[i.estado] ?? { nombre: i.estado, clase: "bg-slate-100" };
              const dev = i.fecha_devolucion_real ? `Devuelto ${fechaLarga(new Date(i.fecha_devolucion_real))}` : i.fecha_devolucion_prevista ? `Devolver ${fechaLarga(new Date(i.fecha_devolucion_prevista))}` : "";
              return `<tr data-acta="${i.acta_id}"><td class="py-2.5 pr-3 font-medium text-slate-700">#${i.numero}</td>
                <td class="pr-3 text-slate-700">${esc(i.equipo)}<br /><span class="text-xs text-slate-400">${fechaLarga(new Date(i.fecha_entrega))} · ${dev}</span></td>
                <td class="pr-3"><span class="text-xs px-2 py-0.5 rounded-full ${e.clase}">${e.nombre}</span></td>
                <td>${["FIRMADA", "ENVIADA", "DEVUELTA"].includes(i.estado) ? `<button data-pdf class="text-blue-700 hover:underline">PDF</button>` : ""}</td></tr>`;
            })
            .join("")}</tbody></table></div>`
        : "Este paciente no tiene préstamos.";
      m.q("#p-hist").addEventListener("click", (ev) => {
        const id = (ev.target as HTMLElement).closest("[data-pdf]")?.closest<HTMLElement>("[data-acta]")?.dataset.acta;
        if (id) abrirPdf(id).catch(() => {});
      });
    } catch {
      m.q("#p-hist").textContent = "No se pudo cargar el historial.";
    }
  };

  await cargar();
}
