import { abrirPdf, api, ApiError, fotoEquipoUrl, imagenProtegidaUrl, invalidarFoto, Usuario } from "../api";
import { Equipo, HistorialItem, TipoEquipo } from "../types";
import { BTN, BTN_PELIGRO, BTN_PRIMARIO, BTN_SECUNDARIO, encabezado, ESTADO_ACTA, ESTADO_EQUIPO, icono, INPUT, LABEL, modal, toast } from "../ui";
import { esc, fechaLarga } from "../utils";

const MAX_FOTO = 8 * 1024 * 1024;

export async function renderEquipos(main: HTMLElement, user: Usuario) {
  if (user.rol !== "ADMIN") {
    main.innerHTML = `<div class="bg-white rounded-2xl shadow p-8 text-center text-slate-600">Solo los administradores pueden gestionar equipos. <a href="#/" class="text-blue-700 underline">Volver</a></div>`;
    return;
  }

  let equipos: Equipo[] = [];
  let tipos: TipoEquipo[] = [];
  let filtroEstado = "";
  let busqueda = "";
  let animar = true;

  main.innerHTML = `
    <div class="space-y-6">
      ${encabezado("Administración", "Equipos", "Holter y MAPA: foto, estado e historial de préstamos.",
        `<button id="nuevo" class="${BTN_PRIMARIO} inline-flex items-center gap-2 !rounded-xl !px-5 !py-2.5">${icono.mas}Nuevo equipo</button>`)}
      <section class="bg-white rounded-2xl shadow p-5 space-y-4">
        <div class="flex gap-3 flex-wrap items-center justify-between">
          <div id="conteo" class="flex gap-2 flex-wrap text-xs"></div>
          <div class="flex gap-2 flex-wrap">
            <input id="buscar" placeholder="Buscar por serie, marca o modelo..." class="${INPUT} !w-64" />
            <select id="filtro" class="${INPUT} !w-auto">
              <option value="">Todos los estados</option>
              ${Object.entries(ESTADO_EQUIPO).map(([k, v]) => `<option value="${k}">${v.nombre}</option>`).join("")}
            </select>
          </div>
        </div>
        <p id="msg" class="text-sm"></p>
        <div id="lista" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4"></div>
      </section>
    </div>`;

  const $ = <T extends HTMLElement>(id: string) => main.querySelector<T>(`#${id}`)!;
  const mensaje = (t: string, error = false) => {
    if (t) toast(t, error ? "error" : "ok");
    $("msg").textContent = t;
    $("msg").className = `text-sm ${error ? "text-red-600" : "text-green-700 font-medium"}`;
  };

  const cargar = async () => {
    [equipos, tipos] = await Promise.all([api<Equipo[]>("/equipos"), api<TipoEquipo[]>("/equipos/tipos")]);
    pintar();
  };

  const pintar = () => {
    const cuenta = (e: string) => equipos.filter((x) => x.estado === e).length;
    $("conteo").innerHTML = Object.entries(ESTADO_EQUIPO)
      .map(([k, v]) => `<span class="px-2.5 py-1 rounded-full font-medium ${v.clase}">${v.nombre}: ${cuenta(k)}</span>`)
      .join("");

    const q = busqueda.trim().toLowerCase();
    const lista = equipos.filter(
      (e) =>
        (!filtroEstado || e.estado === filtroEstado) &&
        (!q || `${e.serie} ${e.marca ?? ""} ${e.modelo ?? ""} ${e.tipo.nombre}`.toLowerCase().includes(q)),
    );

    if (!lista.length) {
      $("lista").innerHTML = `<p class="col-span-full py-10 text-center text-slate-400">${
        equipos.length ? "No hay equipos que coincidan." : "Aún no hay equipos. Crea el primero con «+ Nuevo equipo»."
      }</p>`;
      return;
    }

    $("lista").classList.toggle("escalonado", animar);
    animar = false;
    $("lista").innerHTML = lista
      .map((e) => {
        const est = ESTADO_EQUIPO[e.estado] ?? { nombre: e.estado, clase: "bg-slate-100" };
        return `
        <article class="elevar rounded-xl border border-slate-200 overflow-hidden bg-white flex flex-col" data-id="${e.id}">
          <div class="relative aspect-[4/3] bg-blue-50/60 flex items-center justify-center text-blue-300">
            ${e.tiene_foto ? `<img data-foto class="w-full h-full object-cover" alt="Foto del equipo" />` : `<div class="scale-[2.5]">${icono.equipos}</div>`}
            <span class="absolute top-2 left-2 text-xs px-2.5 py-1 rounded-full font-medium shadow-sm ${est.clase}">${est.nombre}</span>
          </div>
          <div class="p-4 flex-1 flex flex-col gap-1">
            <p class="text-xs uppercase tracking-wide text-slate-400">${esc(e.tipo.nombre)}${e.marca ? " · " + esc(e.marca) : ""}</p>
            <a href="#/equipo/${e.id}" class="font-semibold text-slate-900 text-lg leading-tight hover:underline">Serie ${esc(e.serie)}</a>
            <p class="text-sm text-slate-500">${e.modelo ? "Modelo " + esc(e.modelo) : "&nbsp;"}</p>
            ${e.notas ? `<p class="text-xs text-slate-500 line-clamp-2">${esc(e.notas)}</p>` : ""}
            <div class="mt-auto pt-3 flex gap-2 flex-wrap">
              <button data-historial class="${BTN} !px-3 !py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800">Historial</button>
              <button data-qr class="${BTN} !px-3 !py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800">QR</button>
              <button data-editar class="${BTN} !px-3 !py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700">Editar</button>
              <button data-eliminar class="${BTN} !px-3 !py-1.5 bg-red-50 hover:bg-red-100 text-red-700">Eliminar</button>
            </div>
          </div>
        </article>`;
      })
      .join("");

    // Las fotos se piden con el token y se colocan al llegar.
    $("lista").querySelectorAll<HTMLElement>("article").forEach(async (card) => {
      const img = card.querySelector<HTMLImageElement>("[data-foto]");
      if (!img) return;
      const url = await fotoEquipoUrl(card.dataset.id!);
      if (url) img.src = url;
    });
  };

  // ---------- Crear / editar ----------
  const formulario = (equipo?: Equipo) => {
    const prestado = equipo?.estado === "PRESTADO";
    let nuevaFoto: File | null = null;
    let quitarFoto = false;

    const m = modal(
      `<form class="p-6 space-y-4">
        <h3 class="text-lg font-semibold text-slate-900">${equipo ? "Editar equipo" : "Nuevo equipo"}</h3>
        <div class="flex gap-4 items-start">
          <div id="e-preview" class="w-32 h-32 shrink-0 rounded-xl bg-slate-100 border border-dashed border-slate-300 overflow-hidden flex items-center justify-center text-slate-300"></div>
          <div class="space-y-2 text-sm">
            <label class="${BTN_SECUNDARIO} inline-flex items-center gap-2 cursor-pointer">${icono.camara}<span id="e-foto-texto">${equipo?.tiene_foto ? "Cambiar foto" : "Subir foto"}</span>
              <input id="e-foto" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" /></label>
            <button type="button" id="e-quitar" class="block text-red-600 hover:underline text-xs ${equipo?.tiene_foto ? "" : "hidden"}">Quitar foto</button>
            <p class="text-xs text-slate-400">JPG, PNG o WEBP. Máximo 8 MB.</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2"><label class="${LABEL}">Tipo *</label>
            <select id="e-tipo" required class="${INPUT}">${tipos.map((t) => `<option value="${t.id}" ${equipo?.tipo.id === t.id ? "selected" : ""}>${esc(t.nombre)}</option>`).join("")}</select></div>
          <div class="col-span-2"><label class="${LABEL}">Serie *</label>
            <input id="e-serie" required maxlength="80" class="${INPUT}" value="${esc(equipo?.serie)}" placeholder="Ej: EVO-2231" /></div>
          <div><label class="${LABEL}">Marca</label><input id="e-marca" maxlength="100" class="${INPUT}" value="${esc(equipo?.marca)}" /></div>
          <div><label class="${LABEL}">Modelo</label><input id="e-modelo" maxlength="100" class="${INPUT}" value="${esc(equipo?.modelo)}" /></div>
          ${
            equipo
              ? `<div class="col-span-2"><label class="${LABEL}">Estado</label>
                  <select id="e-estado" class="${INPUT}" ${prestado ? "disabled" : ""}>
                    ${(prestado ? ["PRESTADO"] : ["DISPONIBLE", "MANTENIMIENTO", "BAJA"])
                      .map((s) => `<option value="${s}" ${equipo.estado === s ? "selected" : ""}>${ESTADO_EQUIPO[s].nombre}</option>`).join("")}
                  </select>
                  ${prestado ? `<p class="text-xs text-slate-500 mt-1">Está prestado: se libera al registrar la devolución del acta en el inicio.</p>` : ""}
                </div>`
              : ""
          }
          <div class="col-span-2"><label class="${LABEL}">Notas</label><textarea id="e-notas" rows="2" class="${INPUT}">${esc(equipo?.notas)}</textarea></div>
        </div>
        <p id="e-error" class="text-sm text-red-600 hidden"></p>
        <div class="flex justify-end gap-2">
          <button type="button" id="e-cancelar" class="${BTN_SECUNDARIO}">Cancelar</button>
          <button id="e-guardar" class="${BTN_PRIMARIO}">Guardar</button>
        </div>
      </form>`,
      "max-w-xl",
    );

    const preview = m.q<HTMLElement>("#e-preview");
    const ponerPlaceholder = () => (preview.innerHTML = `<div class="scale-[2]">${icono.camara}</div>`);
    const mostrarImagen = (url: string) => (preview.innerHTML = `<img src="${url}" class="w-full h-full object-cover" alt="" />`);
    if (equipo?.tiene_foto) {
      ponerPlaceholder();
      fotoEquipoUrl(equipo.id).then((u) => u && !nuevaFoto && !quitarFoto && mostrarImagen(u));
    } else ponerPlaceholder();

    const error = (t: string) => {
      m.q("#e-error").textContent = t;
      m.q("#e-error").classList.remove("hidden");
    };

    m.q<HTMLInputElement>("#e-foto").addEventListener("change", (ev) => {
      const f = (ev.target as HTMLInputElement).files?.[0];
      if (!f) return;
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return error("La foto debe ser JPG, PNG o WEBP.");
      if (f.size > MAX_FOTO) return error("La foto pesa más de 8 MB.");
      m.q("#e-error").classList.add("hidden");
      nuevaFoto = f;
      quitarFoto = false;
      mostrarImagen(URL.createObjectURL(f));
      m.q("#e-quitar").classList.remove("hidden");
    });
    m.q("#e-quitar").addEventListener("click", () => {
      nuevaFoto = null;
      quitarFoto = !!equipo?.tiene_foto;
      m.q<HTMLInputElement>("#e-foto").value = "";
      ponerPlaceholder();
      m.q("#e-quitar").classList.add("hidden");
    });
    m.q("#e-cancelar").addEventListener("click", m.cerrar);

    m.q<HTMLFormElement>("form").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const v = (id: string) => m.q<HTMLInputElement>(id).value.trim();
      if (!v("#e-serie")) return error("La serie es obligatoria.");
      const body: Record<string, unknown> = {
        tipo_equipo_id: Number(v("#e-tipo")),
        serie: v("#e-serie"),
        marca: v("#e-marca") || null,
        modelo: v("#e-modelo") || null,
        notas: v("#e-notas") || null,
      };
      const btn = m.q<HTMLButtonElement>("#e-guardar");
      btn.disabled = true;
      btn.textContent = "Guardando...";
      try {
        let guardado: Equipo;
        if (equipo) {
          body.estado = prestado ? "PRESTADO" : v("#e-estado");
          guardado = await api<Equipo>(`/equipos/${equipo.id}`, { method: "PUT", body: JSON.stringify(body) });
        } else {
          guardado = await api<Equipo>("/equipos", { method: "POST", body: JSON.stringify(body) });
        }
        if (nuevaFoto) {
          const datos = new FormData();
          datos.append("archivo", nuevaFoto);
          await api(`/equipos/${guardado.id}/foto`, { method: "POST", body: datos });
          invalidarFoto(guardado.id);
        } else if (quitarFoto) {
          await api(`/equipos/${guardado.id}/foto`, { method: "DELETE" });
          invalidarFoto(guardado.id);
        }
        m.cerrar();
        await cargar();
        mensaje(equipo ? "Equipo actualizado." : "Equipo creado.");
      } catch (e) {
        error(e instanceof ApiError ? e.message : "No se pudo guardar");
        btn.disabled = false;
        btn.textContent = "Guardar";
      }
    });
  };

  // ---------- Eliminar ----------
  const eliminar = (equipo: Equipo) => {
    const m = modal(
      `<div class="p-6 space-y-4">
        <h3 class="text-lg font-semibold text-red-700">Eliminar equipo</h3>
        <p class="text-sm text-slate-600">¿Seguro que quieres eliminar el ${esc(equipo.tipo.nombre)} serie <b>${esc(equipo.serie)}</b>? Esta acción no se puede deshacer.</p>
        <p id="x-error" class="text-sm text-red-600 hidden"></p>
        <div class="flex justify-end gap-2 flex-wrap">
          <button id="x-no" class="${BTN_SECUNDARIO}">Cancelar</button>
          <button id="x-baja" class="${BTN} bg-amber-100 hover:bg-amber-200 text-amber-900 hidden">Dar de baja en su lugar</button>
          <button id="x-si" class="${BTN_PELIGRO}">Sí, eliminar</button>
        </div>
      </div>`,
    );
    m.q("#x-no").addEventListener("click", m.cerrar);
    m.q("#x-si").addEventListener("click", async () => {
      try {
        await api(`/equipos/${equipo.id}`, { method: "DELETE" });
        invalidarFoto(equipo.id);
        m.cerrar();
        await cargar();
        mensaje(`Equipo ${equipo.serie} eliminado.`);
      } catch (e) {
        m.q("#x-error").textContent = e instanceof ApiError ? e.message : "No se pudo eliminar";
        m.q("#x-error").classList.remove("hidden");
        if (e instanceof ApiError && e.status === 409 && equipo.estado !== "PRESTADO") m.q("#x-baja").classList.remove("hidden");
        m.q("#x-si").classList.add("hidden");
      }
    });
    m.q("#x-baja").addEventListener("click", async () => {
      try {
        await api(`/equipos/${equipo.id}`, {
          method: "PUT",
          body: JSON.stringify({
            tipo_equipo_id: equipo.tipo.id, serie: equipo.serie, marca: equipo.marca, modelo: equipo.modelo,
            notas: equipo.notas ?? null, estado: "BAJA",
          }),
        });
        m.cerrar();
        await cargar();
        mensaje(`Equipo ${equipo.serie} dado de baja.`);
      } catch (e) {
        m.q("#x-error").textContent = e instanceof ApiError ? e.message : "No se pudo dar de baja";
      }
    });
  };

  // ---------- QR / etiqueta ----------
  const etiqueta = async (equipo: Equipo) => {
    const m = modal(
      `<div class="p-6 space-y-4 text-center">
        <div class="flex items-start justify-between"><h3 class="text-lg font-semibold text-slate-900">Código QR del equipo</h3>
          <button id="q-x" class="text-slate-400 hover:text-slate-700 text-xl leading-none">✕</button></div>
        <div id="q-img" class="w-56 h-56 mx-auto flex items-center justify-center text-slate-400 text-sm">Generando...</div>
        <p class="font-semibold text-slate-900">${esc(equipo.tipo.nombre)} · serie ${esc(equipo.serie)}</p>
        <p class="text-xs text-slate-500">Pega esta etiqueta en el equipo. Al escanearla se abre su ficha con el historial y se puede iniciar un acta.</p>
        <div class="flex justify-center gap-2"><button id="q-print" class="${BTN_PRIMARIO}" disabled>Imprimir etiqueta</button>
          <a href="#/equipo/${equipo.id}" id="q-ficha" class="${BTN_SECUNDARIO}">Abrir ficha</a></div>
      </div>`,
      "max-w-sm",
    );
    m.q("#q-x").addEventListener("click", m.cerrar);
    m.q("#q-ficha").addEventListener("click", m.cerrar);
    try {
      const url = await imagenProtegidaUrl(`/equipos/${equipo.id}/qr.png`);
      m.q("#q-img").innerHTML = `<img src="${url}" alt="QR" class="w-56 h-56" />`;
      const imprimir = m.q<HTMLButtonElement>("#q-print");
      imprimir.disabled = false;
      imprimir.addEventListener("click", () => {
        const w = window.open("", "_blank", "width=420,height=520");
        if (!w) return;
        w.document.write(`<html><head><title>Etiqueta ${esc(equipo.serie)}</title><style>
          body{font-family:Segoe UI,Arial,sans-serif;text-align:center;margin:0;padding:18px}
          .e{display:inline-block;border:2px solid #132b5f;border-radius:12px;padding:14px 18px}
          img{width:230px;height:230px}h2{margin:6px 0 0;color:#132b5f;font-size:20px}p{margin:2px 0;color:#475569;font-size:13px}
          </style></head><body><div class="e"><p style="font-weight:700;color:#132b5f">IPS NUEVA POPAYÁN · REHABILITAR</p>
          <img src="${url}"/><h2>${esc(equipo.tipo.nombre)}</h2><p>Serie ${esc(equipo.serie)}</p><p>Escanea para ver el historial</p></div>
          <script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`);
        w.document.close();
      });
    } catch {
      m.q("#q-img").textContent = "No se pudo generar el QR.";
    }
  };

  // ---------- Historial ----------
  const historial = async (equipo: Equipo) => {
    const m = modal(
      `<div class="p-6 space-y-4">
        <div class="flex items-start justify-between gap-3">
          <div><h3 class="text-lg font-semibold text-slate-900">Historial de préstamos</h3>
            <p class="text-sm text-slate-500">${esc(equipo.tipo.nombre)} serie ${esc(equipo.serie)}</p></div>
          <button id="h-x" class="text-slate-400 hover:text-slate-700 text-xl leading-none">✕</button>
        </div>
        <div id="h-cuerpo" class="text-sm text-slate-500">Cargando...</div>
      </div>`,
      "max-w-3xl",
    );
    m.q("#h-x").addEventListener("click", m.cerrar);
    try {
      const items = await api<HistorialItem[]>(`/equipos/${equipo.id}/historial`);
      m.q("#h-cuerpo").innerHTML = items.length
        ? `<div class="overflow-auto"><table class="w-full text-left">
            <thead class="text-xs uppercase text-slate-400 border-b"><tr>
              <th class="py-2 pr-3">Acta</th><th class="pr-3">Paciente</th><th class="pr-3">Entrega</th><th class="pr-3">Devolución</th><th class="pr-3">Estado</th><th></th></tr></thead>
            <tbody class="divide-y text-slate-700">${items
              .map((i) => {
                const est = ESTADO_ACTA[i.estado] ?? { nombre: i.estado, clase: "bg-slate-100" };
                const dev = i.fecha_devolucion_real
                  ? fechaLarga(new Date(i.fecha_devolucion_real))
                  : i.fecha_devolucion_prevista ? `<span class="text-slate-400">prevista ${fechaLarga(new Date(i.fecha_devolucion_prevista))}</span>` : "—";
                const conPdf = ["FIRMADA", "ENVIADA", "DEVUELTA"].includes(i.estado);
                return `<tr data-acta="${i.acta_id}"><td class="py-2 pr-3 font-medium">#${i.numero}</td>
                  <td class="pr-3">${esc(i.paciente_nombre)}<br /><span class="text-xs text-slate-400">${esc(i.paciente_documento)}</span></td>
                  <td class="pr-3 whitespace-nowrap">${fechaLarga(new Date(i.fecha_entrega))}</td>
                  <td class="pr-3 whitespace-nowrap">${dev}</td>
                  <td class="pr-3"><span class="text-xs px-2 py-0.5 rounded-full ${est.clase}">${est.nombre}</span></td>
                  <td>${conPdf ? `<button data-pdf class="text-blue-700 hover:underline">PDF</button>` : ""}</td></tr>`;
              })
              .join("")}</tbody></table></div>`
        : `<p class="py-6 text-center text-slate-400">Este equipo todavía no se ha prestado.</p>`;
      m.q("#h-cuerpo").addEventListener("click", (ev) => {
        const b = (ev.target as HTMLElement).closest("[data-pdf]");
        const id = b?.closest<HTMLElement>("[data-acta]")?.dataset.acta;
        if (id) abrirPdf(id).catch(() => {});
      });
    } catch {
      m.q("#h-cuerpo").textContent = "No se pudo cargar el historial.";
    }
  };

  // ---------- Eventos ----------
  $("nuevo").addEventListener("click", () => formulario());
  $<HTMLInputElement>("buscar").addEventListener("input", (e) => {
    busqueda = (e.target as HTMLInputElement).value;
    pintar();
  });
  $<HTMLSelectElement>("filtro").addEventListener("change", (e) => {
    filtroEstado = (e.target as HTMLSelectElement).value;
    pintar();
  });
  $("lista").addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const card = t.closest<HTMLElement>("[data-id]");
    const equipo = equipos.find((x) => x.id === card?.dataset.id);
    if (!equipo) return;
    if (t.closest("[data-editar]")) formulario(equipo);
    else if (t.closest("[data-eliminar]")) eliminar(equipo);
    else if (t.closest("[data-historial]")) historial(equipo);
    else if (t.closest("[data-qr]")) etiqueta(equipo);
  });

  await cargar().catch(() => mensaje("No se pudo cargar los equipos.", true));
}
