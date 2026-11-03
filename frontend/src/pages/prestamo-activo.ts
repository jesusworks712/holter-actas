import { api, ApiError } from "../api";
import { Acta } from "../types";
import { esc } from "../utils";
import { BTN_PRIMARIO, BTN_SECUNDARIO, modal, toast } from "../ui";

export function mostrarPrestamoActivo(ancla: HTMLElement, acta: Acta | null, alCambiar: () => void) {
  document.getElementById("prestamo-activo")?.remove();
  if (!acta) return;

  const puedeDevolver = acta.estado === "FIRMADA" || acta.estado === "ENVIADA";
  const box = document.createElement("div");
  box.id = "prestamo-activo";
  box.className = "mt-2 rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3";
  box.innerHTML = `
    <div>
      <p class="font-semibold text-amber-900">Acta #${acta.numero} abierta · ${esc(acta.equipo.tipo.nombre)} serie ${esc(acta.equipo.serie)}</p>
      <p class="text-sm text-amber-800">Estado: ${esc(acta.estado)}. Mientras el acta esté abierta, el paciente no puede tener un nuevo préstamo.</p>
    </div>
    <div class="flex flex-wrap gap-2">
      ${puedeDevolver ? `<button type="button" data-accion="devolver" class="${BTN_PRIMARIO}">Registrar devolución</button>` : ""}
      <button type="button" data-accion="anular" class="${BTN_SECUNDARIO} text-red-700 border-red-200 hover:bg-red-50">Cancelar acta y liberar equipo</button>
    </div>`;
  ancla.insertAdjacentElement("afterend", box);

  box.querySelector<HTMLButtonElement>('[data-accion="devolver"]')?.addEventListener("click", () => devolver(acta, alCambiar));
  box.querySelector<HTMLButtonElement>('[data-accion="anular"]')?.addEventListener("click", () => anular(acta, alCambiar));
}

function devolver(acta: Acta, alCambiar: () => void) {
  const m = modal(`
    <div class="p-6 space-y-4">
      <h3 class="text-lg font-semibold text-slate-900">Registrar devolución · acta #${acta.numero}</h3>
      <p class="text-sm text-slate-600">${esc(acta.equipo.tipo.nombre)} serie ${esc(acta.equipo.serie)}</p>
      <div><label class="block text-sm font-medium mb-1">Estado en que se recibe el equipo</label>
        <select id="pd-estado" class="w-full border border-slate-300 rounded-lg px-3 py-2">
          <option value="DISPONIBLE">Bueno · queda disponible</option>
          <option value="MANTENIMIENTO">Con novedad · pasa a mantenimiento</option>
        </select></div>
      <div><label class="block text-sm font-medium mb-1">Observaciones (opcional)</label>
        <textarea id="pd-obs" rows="2" class="w-full border border-slate-300 rounded-lg px-3 py-2"></textarea></div>
      <p id="pd-error" class="text-sm text-red-600 hidden"></p>
      <div class="flex justify-end gap-2">
        <button type="button" id="pd-no" class="${BTN_SECUNDARIO}">Volver</button>
        <button type="button" id="pd-si" class="${BTN_PRIMARIO}">Registrar devolución</button>
      </div>
    </div>`, "max-w-md");

  m.q("#pd-no").addEventListener("click", () => m.cerrar());
  m.q("#pd-si").addEventListener("click", async () => {
    const estado = m.q<HTMLSelectElement>("#pd-estado").value;
    const obs = m.q<HTMLTextAreaElement>("#pd-obs").value.trim();
    try {
      await api(`/actas/${acta.id}/devolver`, {
        method: "POST",
        body: JSON.stringify({ estado_equipo: estado, observaciones: obs || null }),
      });
      m.cerrar();
      toast(`Devolución registrada. El equipo ${acta.equipo.serie} quedó ${estado === "DISPONIBLE" ? "disponible" : "en mantenimiento"}.`, "ok");
      alCambiar();
    } catch (err) {
      const error = m.q("#pd-error");
      error.textContent = err instanceof ApiError ? err.message : "No se pudo registrar la devolución";
      error.classList.remove("hidden");
    }
  });
}

function anular(acta: Acta, alCambiar: () => void) {
  const m = modal(`
    <div class="p-6 space-y-4">
      <h3 class="text-lg font-semibold text-red-700">Cancelar acta #${acta.numero}</h3>
      <p class="text-sm text-slate-600">El equipo <b>${esc(acta.equipo.serie)}</b> quedará disponible y el paciente podrá tener un nuevo préstamo. Esta acción no se puede deshacer.</p>
      <div><label class="block text-sm font-medium mb-1">Motivo *</label>
        <textarea id="pa-motivo" rows="3" class="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder="Ej: El acta se creó por error"></textarea>
        <p id="pa-error" class="text-xs text-red-600 hidden mt-1">Escribe un motivo de al menos 5 letras.</p></div>
      <div class="flex justify-end gap-2">
        <button type="button" id="pa-no" class="${BTN_SECUNDARIO}">Volver</button>
        <button type="button" id="pa-si" class="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-medium">Cancelar acta</button>
      </div>
    </div>`, "max-w-md");

  m.q("#pa-no").addEventListener("click", () => m.cerrar());
  m.q("#pa-si").addEventListener("click", async () => {
    const motivo = m.q<HTMLTextAreaElement>("#pa-motivo").value.trim();
    if (motivo.length < 5) return m.q("#pa-error").classList.remove("hidden");
    try {
      await api(`/actas/${acta.id}/anular`, { method: "POST", body: JSON.stringify({ motivo }) });
      m.cerrar();
      toast(`Acta #${acta.numero} cancelada. El equipo ${acta.equipo.serie} quedó disponible.`, "ok");
      alCambiar();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "No se pudo cancelar el acta", "error");
    }
  });
}