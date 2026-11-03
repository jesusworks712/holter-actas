// Ficha de un equipo: es lo que abre el código QR pegado en el equipo.
import { abrirPdf, api, ApiError, fotoEquipoUrl } from "../api";
import { Equipo, HistorialItem } from "../types";
import { ESTADO_ACTA, ESTADO_EQUIPO, icono } from "../ui";
import { esc, fechaLarga } from "../utils";

export async function renderEquipoDetalle(main: HTMLElement, equipoId: string) {
  main.innerHTML = `<p class="text-slate-500">Cargando equipo...</p>`;
  let equipo: Equipo;
  let items: HistorialItem[];
  try {
    [equipo, items] = await Promise.all([
      api<Equipo[]>("/equipos").then((l) => {
        const e = l.find((x) => x.id === equipoId);
        if (!e) throw new ApiError(404, "Equipo no encontrado");
        return e;
      }),
      api<HistorialItem[]>(`/equipos/${equipoId}/historial`),
    ]);
  } catch (e) {
    main.innerHTML = `<div class="bg-white rounded-2xl shadow p-8 text-center text-slate-600">${esc(e instanceof ApiError ? e.message : "No se pudo cargar el equipo")}. <a class="text-blue-700 underline" href="#/">Volver</a></div>`;
    return;
  }

  const est = ESTADO_EQUIPO[equipo.estado] ?? { nombre: equipo.estado, clase: "bg-slate-100" };
  const actual = items.find((i) => ["FIRMADA", "ENVIADA", "BORRADOR"].includes(i.estado));

  main.innerHTML = `
    <div class="space-y-6">
      <div class="bg-white rounded-2xl shadow overflow-hidden md:flex">
        <div class="md:w-72 aspect-[4/3] md:aspect-auto bg-blue-50/60 flex items-center justify-center text-blue-300 shrink-0">
          ${equipo.tiene_foto ? `<img id="foto" class="w-full h-full object-cover" alt="" />` : `<div class="scale-[3]">${icono.equipos}</div>`}
        </div>
        <div class="p-6 space-y-2 flex-1">
          <p class="text-xs uppercase tracking-wide text-slate-400">${esc(equipo.tipo.nombre)}${equipo.marca ? " · " + esc(equipo.marca) : ""}</p>
          <h2 class="text-2xl font-semibold text-slate-900">Serie ${esc(equipo.serie)}</h2>
          <p><span class="text-xs px-2.5 py-1 rounded-full font-medium ${est.clase}">${est.nombre}</span></p>
          ${equipo.modelo ? `<p class="text-sm text-slate-600">Modelo ${esc(equipo.modelo)}</p>` : ""}
          ${equipo.notas ? `<p class="text-sm text-slate-500">${esc(equipo.notas)}</p>` : ""}
          ${actual ? `<p class="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">En préstamo: <b>${esc(actual.paciente_nombre)}</b> (acta #${actual.numero}).</p>` : ""}
          <div class="pt-2 flex gap-2 flex-wrap">
            ${equipo.estado === "DISPONIBLE" ? `<a href="#/nueva?equipo=${equipo.id}" class="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-medium">+ Nueva acta con este equipo</a>` : ""}
            <a href="#/" class="bg-slate-100 hover:bg-slate-200 rounded-lg px-4 py-2 text-sm">Inicio</a>
          </div>
        </div>
      </div>
      <section class="bg-white rounded-2xl shadow p-5 space-y-3">
        <h3 class="font-semibold text-slate-900">Historial de préstamos (${items.length})</h3>
        ${
          items.length
            ? `<div class="overflow-auto"><table class="w-full text-left text-sm"><thead class="text-xs uppercase text-slate-400 border-b"><tr>
                <th class="py-2 pr-3">Acta</th><th class="pr-3">Paciente</th><th class="pr-3">Entrega</th><th class="pr-3">Devolución</th><th class="pr-3">Estado</th><th></th></tr></thead>
              <tbody class="divide-y">${items
                .map((i) => {
                  const e = ESTADO_ACTA[i.estado] ?? { nombre: i.estado, clase: "bg-slate-100" };
                  const dev = i.fecha_devolucion_real ? fechaLarga(new Date(i.fecha_devolucion_real)) : i.fecha_devolucion_prevista ? `<span class="text-slate-400">prevista ${fechaLarga(new Date(i.fecha_devolucion_prevista))}</span>` : "—";
                  return `<tr data-acta="${i.acta_id}"><td class="py-2 pr-3 font-medium">#${i.numero}</td><td class="pr-3">${esc(i.paciente_nombre)}</td>
                    <td class="pr-3 whitespace-nowrap">${fechaLarga(new Date(i.fecha_entrega))}</td><td class="pr-3 whitespace-nowrap">${dev}</td>
                    <td class="pr-3"><span class="text-xs px-2 py-0.5 rounded-full ${e.clase}">${e.nombre}</span></td>
                    <td>${["FIRMADA", "ENVIADA", "DEVUELTA"].includes(i.estado) ? `<button data-pdf class="text-blue-700 hover:underline">PDF</button>` : ""}</td></tr>`;
                })
                .join("")}</tbody></table></div>`
            : `<p class="text-slate-400 text-sm py-4 text-center">Este equipo todavía no se ha prestado.</p>`
        }
      </section>
    </div>`;

  if (equipo.tiene_foto) fotoEquipoUrl(equipo.id).then((u) => u && ((main.querySelector("#foto") as HTMLImageElement).src = u));
  main.addEventListener("click", (ev) => {
    const b = (ev.target as HTMLElement).closest("[data-pdf]");
    const id = b?.closest<HTMLElement>("[data-acta]")?.dataset.acta;
    if (id) abrirPdf(id).catch(() => {});
  });
}
