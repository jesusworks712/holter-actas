import { api, ApiError, pdfBlobUrl } from "../api";
import { Acta, Catalogo, Envio } from "../types";
import { esc } from "../utils";
import { ejecutarConProgreso } from "./progreso-envio";

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INPUT = "w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm";
const LABEL = "block text-xs font-medium mb-0.5 text-slate-600";

export interface ResultadoRevision {
  enviada: boolean;
  acta: Acta; // versión más reciente (por si se corrigió)
}

const aLocal = (iso: string) => {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

// Modal: vista previa del acta + confirmación, con opción de corregir antes de enviar.
export function revisarYEnviar(actaInicial: Acta): Promise<ResultadoRevision> {
  return new Promise((resolve) => {
    let acta = actaInicial;
    let pdfUrl: string | null = null;
    let enviada = false;
    let catalogos: { aseguradoras: Catalogo[]; regimenes: Catalogo[] } | null = null;
    let modo: "revisar" | "corregir" | "enviando" | "listo" = "revisar";
    let aviso = "";
    let avisoError = false;

    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 bg-black/60 flex items-center justify-center p-3 z-50";
    document.body.appendChild(overlay);

    const puedeCorregir = () => acta.estado !== "ENVIADA" && acta.estado !== "DEVUELTA" && acta.estado !== "ANULADA";
    const correo = () => acta.paciente.correo ?? "";
    const correoValido = () => EMAIL_OK.test(correo());

    const cerrar = () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      overlay.remove();
      resolve({ enviada, acta });
    };

    const cargarPdf = async () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      pdfUrl = null;
      pintar();
      try {
        pdfUrl = await pdfBlobUrl(acta.id);
      } catch (e) {
        aviso = e instanceof ApiError ? e.message : "No se pudo generar la vista previa";
        avisoError = true;
      }
      pintar();
    };

    const panelDatos = () => `
      <div class="space-y-3 text-sm">
        <div class="bg-slate-50 rounded-lg p-3 space-y-1">
          <p><span class="text-slate-500">Paciente:</span> <b>${esc(acta.paciente.nombre_completo)}</b></p>
          <p><span class="text-slate-500">Documento:</span> ${esc(acta.paciente.tipo_documento)} ${esc(acta.paciente.numero_documento)}</p>
          <p><span class="text-slate-500">Equipo:</span> ${esc(acta.equipo.tipo.nombre)} serie ${esc(acta.equipo.serie)}</p>
          <p><span class="text-slate-500">Se enviará a:</span>
            <b class="${correoValido() ? "text-blue-800" : "text-red-600"}">${esc(correo()) || "sin correo"}</b></p>
        </div>
        ${correoValido() ? "" : `<p class="text-red-600 text-xs">El correo no es válido. Usa «Corregir datos» para arreglarlo.</p>`}
        <p class="text-slate-600 text-xs">Revisa el documento de la izquierda: nombre, cédula, equipo, fechas y firmas. Si hay un error, corrígelo antes de enviar.</p>
        ${puedeCorregir() ? `<button id="r-corregir" class="w-full bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg px-3 py-2 font-medium">✏️ Corregir datos</button>` : `<p class="text-xs text-slate-500">Esta acta ya fue enviada, por eso no se puede corregir.</p>`}
      </div>`;

    const panelCorreccion = () => {
      const a = acta.paciente;
      const sel = (items: Catalogo[], actual: number | null) =>
        `<option value="">—</option>` + items.map((i) => `<option value="${i.id}" ${i.id === actual ? "selected" : ""}>${esc(i.nombre)}</option>`).join("");
      return `
      <div class="space-y-2">
        <div class="grid grid-cols-3 gap-2">
          <div><label class="${LABEL}">Tipo</label>
            <select id="c-tipo" class="${INPUT}">${["CC", "TI", "CE", "PA"].map((t) => `<option ${t === a.tipo_documento ? "selected" : ""}>${t}</option>`).join("")}</select></div>
          <div class="col-span-2"><label class="${LABEL}">Documento</label><input id="c-doc" class="${INPUT}" value="${esc(a.numero_documento)}" /></div>
        </div>
        <div><label class="${LABEL}">Nombre completo</label><input id="c-nombre" class="${INPUT}" value="${esc(a.nombre_completo)}" /></div>
        <div class="grid grid-cols-2 gap-2">
          <div><label class="${LABEL}">Expedida en</label><input id="c-exp" class="${INPUT}" value="${esc(a.ciudad_expedicion)}" /></div>
          <div><label class="${LABEL}">Vecino de</label><input id="c-vecino" class="${INPUT}" value="${esc(a.vecino_de)}" /></div>
        </div>
        <div><label class="${LABEL}">Correo</label><input id="c-correo" type="email" class="${INPUT}" value="${esc(a.correo)}" /></div>
        <div class="grid grid-cols-2 gap-2">
          <div><label class="${LABEL}">Entrega</label><input id="c-fecha" type="datetime-local" class="${INPUT}" value="${aLocal(acta.fecha_entrega)}" /></div>
          <div><label class="${LABEL}">Duración</label>
            <select id="c-horas" class="${INPUT}"><option value="24" ${acta.duracion_horas === 24 ? "selected" : ""}>24 h</option><option value="48" ${acta.duracion_horas === 48 ? "selected" : ""}>48 h</option></select></div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div><label class="${LABEL}">Aseguradora</label><select id="c-aseg" class="${INPUT}">${sel(catalogos!.aseguradoras, acta.aseguradora_id ?? null)}</select></div>
          <div><label class="${LABEL}">Régimen</label><select id="c-reg" class="${INPUT}">${sel(catalogos!.regimenes, acta.regimen_id ?? null)}</select></div>
        </div>
        <div><label class="${LABEL}">Observaciones</label><textarea id="c-obs" rows="2" class="${INPUT}">${esc(acta.observaciones)}</textarea></div>
        <div class="flex gap-2 pt-1">
          <button id="c-cancelar" class="flex-1 bg-slate-200 hover:bg-slate-300 rounded-lg px-3 py-2">Descartar</button>
          <button id="c-guardar" class="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-3 py-2 font-medium">Guardar cambios</button>
        </div>
      </div>`;
    };

    const pintar = () => {
      if (modo === "listo") {
        overlay.innerHTML = `
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center space-y-4">
            <div class="text-5xl">✅</div>
            <h3 class="text-lg font-semibold">¡Acta enviada correctamente!</h3>
            <p class="text-sm text-slate-600">Se envió a <b>${esc(correo())}</b>.</p>
            <button id="r-cerrar" class="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-6 py-2">Cerrar</button>
          </div>`;
        overlay.querySelector("#r-cerrar")!.addEventListener("click", cerrar);
        return;
      }

      const enviando = modo === "enviando";
      const bloqueado = !pdfUrl || !correoValido() || modo === "corregir" || enviando;
      overlay.innerHTML = `
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[92vh] flex flex-col">
          <div class="px-5 py-3 border-b flex items-center justify-between">
            <h3 class="font-semibold">Revisa el acta N° ${String(acta.numero).padStart(6, "0")} antes de enviarla</h3>
            <button id="r-x" class="text-slate-400 hover:text-slate-700 text-xl leading-none" ${enviando ? "disabled" : ""}>✕</button>
          </div>
          <div class="flex-1 min-h-0 grid md:grid-cols-[1fr_330px]">
            <div class="bg-slate-100 min-h-0 relative">
              ${pdfUrl
                ? `<iframe src="${pdfUrl}" class="w-full h-full" title="Vista previa del acta"></iframe>`
                : `<div class="h-full flex items-center justify-center text-slate-500 text-sm p-6 text-center">${avisoError ? "" : "Generando vista previa..."}</div>`}
            </div>
            <div class="p-4 overflow-auto border-t md:border-t-0 md:border-l">
              ${modo === "corregir" ? panelCorreccion() : panelDatos()}
            </div>
          </div>
          <div class="px-5 py-3 border-t space-y-2">
            ${aviso ? `<p class="text-sm ${avisoError ? "text-red-600" : "text-green-700"}">${esc(aviso)}</p>` : ""}
            <div class="flex items-center justify-between gap-3 flex-wrap">
              <p class="text-sm font-medium text-slate-700">¿Está seguro de enviar el acta a <span class="text-blue-800">${esc(correo()) || "—"}</span>?</p>
              <div class="flex gap-2">
                <button id="r-cancelar" class="bg-slate-200 hover:bg-slate-300 rounded-lg px-4 py-2" ${enviando ? "disabled" : ""}>Cancelar</button>
                <button id="r-enviar" class="bg-blue-700 hover:bg-blue-600 text-white rounded-lg px-5 py-2 font-medium disabled:opacity-40 disabled:cursor-not-allowed" ${bloqueado ? "disabled" : ""}>
                  ${enviando ? "Enviando..." : "Sí, enviar acta"}
                </button>
              </div>
            </div>
          </div>
        </div>`;

      const q = <T extends HTMLElement>(id: string) => overlay.querySelector<T>(`#${id}`);
      q("r-x")?.addEventListener("click", cerrar);
      q("r-cancelar")?.addEventListener("click", cerrar);

      q("r-corregir")?.addEventListener("click", async () => {
        if (!catalogos) {
          try {
            const [aseguradoras, regimenes] = await Promise.all([
              api<Catalogo[]>("/catalogos/aseguradoras"),
              api<Catalogo[]>("/catalogos/regimenes"),
            ]);
            catalogos = { aseguradoras, regimenes };
          } catch {
            aviso = "No se pudieron cargar los catálogos";
            avisoError = true;
            return pintar();
          }
        }
        aviso = "";
        modo = "corregir";
        pintar();
      });
      q("c-cancelar")?.addEventListener("click", () => {
        modo = "revisar";
        aviso = "";
        pintar();
      });
      q("c-guardar")?.addEventListener("click", async () => {
        const v = (id: string) => q<HTMLInputElement>(id)!.value.trim();
        const n = (id: string) => (v(id) ? Number(v(id)) : null);
        if (!v("c-nombre") || !v("c-doc")) {
          aviso = "El nombre y el documento son obligatorios.";
          avisoError = true;
          return pintar();
        }
        if (v("c-correo") && !EMAIL_OK.test(v("c-correo"))) {
          aviso = "El correo no es válido.";
          avisoError = true;
          return pintar();
        }
        q<HTMLButtonElement>("c-guardar")!.disabled = true;
        try {
          acta = await api<Acta>(`/actas/${acta.id}/corregir`, {
            method: "PUT",
            body: JSON.stringify({
              tipo_documento: v("c-tipo"), numero_documento: v("c-doc"), nombre_completo: v("c-nombre"),
              ciudad_expedicion: v("c-exp") || null, vecino_de: v("c-vecino") || null, correo: v("c-correo") || null,
              fecha_entrega: v("c-fecha"), duracion_horas: Number(v("c-horas")),
              aseguradora_id: n("c-aseg"), regimen_id: n("c-reg"), observaciones: v("c-obs") || null,
            }),
          });
          modo = "revisar";
          aviso = "Cambios guardados. Revisa la nueva vista previa.";
          avisoError = false;
          await cargarPdf();
        } catch (e) {
          aviso = e instanceof ApiError ? e.message : "No se pudieron guardar los cambios";
          avisoError = true;
          pintar();
        }
      });

      q("r-enviar")?.addEventListener("click", async () => {
        // Ventana de progreso (0 % → 100 %) mientras se envía por Gmail.
        const res = await ejecutarConProgreso({
          titulo: "Enviando acta por Gmail",
          detalle: `${acta.paciente.nombre_completo} · ${correo()}`,
          textoOk: "¡Acta enviada correctamente!",
          tarea: () => api<Envio>(`/actas/${acta.id}/enviar`, { method: "POST", body: JSON.stringify({}) }),
        });
        if (res.ok) {
          enviada = true;
          acta = { ...acta, estado: "ENVIADA" };
          cerrar();
        } else {
          aviso = res.error;
          avisoError = true;
          pintar();
        }
      });
    };

    pintar();
    cargarPdf();
  });
}
