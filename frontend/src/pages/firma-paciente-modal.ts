import { Acta } from "../types";
import { INPUT, LABEL, aislarFondo, modal } from "../ui";
import { esc } from "../utils";
import { crearLienzo } from "./lienzo";

const MOTIVOS = [
  "Adulto mayor con limitación motriz en las manos",
  "Discapacidad visual",
  "Discapacidad física que le impide firmar",
  "Paciente menor de edad (firma su acudiente)",
  "No sabe firmar",
  "Se encuentra en un estado de salud que se lo impide",
];

// Firma del paciente: dibujarla, o dejar constancia de que no puede firmar (con motivo).
// Devuelve el cuerpo listo para enviar a /actas/{id}/firmas, o null si cancelan.
export function pedirFirmaPaciente(acta: Acta): Promise<Record<string, unknown> | null> {
  return new Promise((resolve) => {
    let modo: "firmar" | "no" = "firmar";
    const m = modal(
      `<div class="p-6 space-y-4">
        <div><h3 class="text-lg font-semibold text-slate-900">Firma del paciente</h3>
          <p class="text-sm text-slate-500">${esc(acta.paciente.nombre_completo)} · ${esc(acta.paciente.tipo_documento)} ${esc(acta.paciente.numero_documento)}</p></div>
        <div class="grid grid-cols-2 gap-1 bg-slate-100 rounded-xl p-1 text-sm font-medium">
          <button type="button" data-tab="firmar" class="rounded-lg py-2">✍️ Firma</button>
          <button type="button" data-tab="no" class="rounded-lg py-2">🚫 No puede firmar</button>
        </div>

        <div id="panel-firmar" class="space-y-2">
          <canvas id="lienzo" class="w-full h-44 border-2 border-dashed border-slate-300 rounded-xl bg-white cursor-crosshair"></canvas>
          <button type="button" id="borrar" class="text-sm text-slate-500 underline">Borrar</button>
        </div>

        <div id="panel-no" class="hidden space-y-3">
          <p class="text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-lg p-3">Se dejará constancia en el acta de que el paciente no puede firmar y el motivo.</p>
          <div><label class="${LABEL}">Motivo frecuente</label>
            <select id="m-tipo" class="${INPUT}"><option value="">— Elegir (opcional) —</option>${MOTIVOS.map((x) => `<option>${esc(x)}</option>`).join("")}</select></div>
          <div><label class="${LABEL}">Motivo por el que no puede firmar *</label>
            <textarea id="m-motivo" rows="2" maxlength="500" class="${INPUT}" placeholder="Escribe el motivo"></textarea></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="${LABEL}">Responsable / acompañante</label><input id="m-resp" class="${INPUT}" placeholder="Nombre (opcional)" /></div>
            <div><label class="${LABEL}">Documento</label><input id="m-resp-doc" class="${INPUT}" placeholder="Cédula (opcional)" /></div>
          </div>
          <details class="text-sm"><summary class="cursor-pointer text-blue-700">El responsable firma a ruego (opcional)</summary>
            <canvas id="lienzo-resp" class="mt-2 w-full h-28 border-2 border-dashed border-slate-300 rounded-xl bg-white cursor-crosshair"></canvas>
            <button type="button" id="borrar-resp" class="text-sm text-slate-500 underline">Borrar</button></details>
        </div>

        <p id="error" class="text-sm text-red-600 hidden"></p>
        <div class="flex justify-end gap-2">
          <button type="button" id="cancelar" class="rounded-lg px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200">Cancelar</button>
          <button type="button" id="guardar" class="rounded-lg px-5 py-2 text-sm font-medium bg-blue-700 hover:bg-blue-800 text-white">Guardar</button>
        </div>
      </div>`,
      "max-w-lg",
    );

    const liberar = aislarFondo(m.overlay);
    const lienzo = crearLienzo(m.q<HTMLCanvasElement>("#lienzo"));
    const lienzoResp = crearLienzo(m.q<HTMLCanvasElement>("#lienzo-resp"));
    m.overlay.querySelector("details")!.addEventListener("toggle", () => lienzoResp.ajustar());

    const pintarTabs = () => {
      m.overlay.querySelectorAll<HTMLElement>("[data-tab]").forEach((b) => {
        const activo = b.dataset.tab === modo;
        b.className = `rounded-lg py-2 ${activo ? "bg-white shadow text-blue-800" : "text-slate-500"}`;
      });
      m.q("#panel-firmar").classList.toggle("hidden", modo !== "firmar");
      m.q("#panel-no").classList.toggle("hidden", modo !== "no");
      if (modo === "firmar") lienzo.ajustar();
    };
    pintarTabs();
    m.overlay.querySelectorAll<HTMLElement>("[data-tab]").forEach((b) =>
      b.addEventListener("click", () => {
        modo = b.dataset.tab as typeof modo;
        pintarTabs();
      }),
    );
    m.q("#borrar").addEventListener("click", () => lienzo.limpiar());
    m.q("#borrar-resp").addEventListener("click", () => lienzoResp.limpiar());
    m.q<HTMLSelectElement>("#m-tipo").addEventListener("change", (e) => {
      const v = (e.target as HTMLSelectElement).value;
      const caja = m.q<HTMLTextAreaElement>("#m-motivo");
      if (v) caja.value = v;
    });

    const cerrar = (r: Record<string, unknown> | null) => {
      liberar();
      m.cerrar();
      resolve(r);
    };
    m.q("#cancelar").addEventListener("click", () => cerrar(null));
    m.overlay.addEventListener("click", (e) => e.target === m.overlay && cerrar(null));

    m.q("#guardar").addEventListener("click", () => {
      const error = m.q("#error");
      const falla = (t: string) => {
        error.textContent = t;
        error.classList.remove("hidden");
      };
      error.classList.add("hidden");
      const base = { rol: "PACIENTE", firmante_nombre: acta.paciente.nombre_completo, firmante_documento: acta.paciente.numero_documento };

      if (modo === "firmar") {
        if (lienzo.vacio()) return falla("Dibuja la firma antes de guardar.");
        return cerrar({ ...base, imagen: lienzo.aPng() });
      }
      const motivo = m.q<HTMLTextAreaElement>("#m-motivo").value.trim();
      if (motivo.length < 5) return falla("Escribe el motivo por el que no puede firmar.");
      const resp = m.q<HTMLInputElement>("#m-resp").value.trim();
      const respDoc = m.q<HTMLInputElement>("#m-resp-doc").value.trim();
      const firmaResp = !lienzoResp.vacio();
      if (firmaResp && !resp) return falla("Escribe el nombre del responsable que firma a ruego.");
      cerrar({
        ...base, no_puede_firmar: true, motivo_no_firma: motivo,
        responsable_nombre: resp || null, responsable_documento: respDoc || null,
        ...(firmaResp ? { imagen: lienzoResp.aPng() } : {}),
      });
    });
  });
}