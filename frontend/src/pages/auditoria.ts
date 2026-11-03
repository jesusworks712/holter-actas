import { api, ApiError, Usuario } from "../api";
import { AuditoriaItem } from "../types";
import { BTN_PRIMARIO, BTN_SECUNDARIO, encabezado, INPUT, LABEL } from "../ui";
import { esc, fechaLarga } from "../utils";

const ACCIONES: Record<string, string> = {
  LOGIN: "Inicio de sesión", LOGIN_FALLIDO: "Intento de sesión fallido", CAMBIAR_PASSWORD: "Cambio de contraseña",
  CREAR_ACTA: "Acta creada", FIRMAR_ACTA: "Acta firmada", CORREGIR_ACTA: "Acta corregida", ANULAR_ACTA: "Acta anulada",
  DEVOLVER_ACTA: "Equipo devuelto", ENVIAR_CORREO: "Acta enviada por correo", ENVIAR_CORREO_ERROR: "Error al enviar correo",
  CREAR_PACIENTE: "Paciente creado", EDITAR_PACIENTE: "Paciente editado",
  CREAR_EQUIPO: "Equipo creado", EDITAR_EQUIPO: "Equipo editado", ELIMINAR_EQUIPO: "Equipo eliminado",
  FOTO_EQUIPO: "Foto de equipo cambiada", QUITAR_FOTO_EQUIPO: "Foto de equipo quitada",
  ENLACE_FIRMA: "Enlace de firma creado", FIRMA_REMOTA: "Firma desde el celular", ENVIAR_COMPROBANTE: "Comprobante de devolución enviado",
  RECORDATORIO_DEVOLUCION: "Recordatorio de devolución enviado", ALERTA_VENCIDAS: "Alerta de vencidas enviada", CREAR_RESPALDO: "Copia de seguridad creada",
  CREAR_USUARIO: "Usuario creado", EDITAR_USUARIO: "Usuario editado", RESET_PASSWORD: "Contraseña restablecida",
};
const nombreAccion = (a: string) => ACCIONES[a] ?? a;

const TAMANO = 50;

// Convierte el detalle guardado en una frase corta y legible.
function resumen(d: Record<string, unknown> | null): string {
  if (!d) return "";
  const partes: string[] = [];
  const cambios = d.cambios as Record<string, [unknown, unknown]> | undefined;
  for (const [k, v] of Object.entries(d)) {
    if (k === "cambios") continue;
    partes.push(`${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`);
  }
  if (cambios) {
    for (const [campo, par] of Object.entries(cambios)) partes.push(`${campo}: ${par?.[0] ?? "—"} → ${par?.[1] ?? "—"}`);
  }
  return partes.join(" · ");
}

export async function renderAuditoria(main: HTMLElement, user: Usuario) {
  if (user.rol !== "ADMIN") {
    main.innerHTML = `<div class="bg-white rounded-2xl shadow p-8 text-center text-slate-600">Solo los administradores pueden ver la auditoría.</div>`;
    return;
  }
  let items: AuditoriaItem[] = [];
  let hayMas = false;

  main.innerHTML = `
    <div class="space-y-6">
      ${encabezado("Administración", "Auditoría", "Quién hizo qué y cuándo: actas, envíos, devoluciones, equipos y usuarios.")}
      <section class="bg-white rounded-2xl shadow p-5 space-y-4">
        <form id="filtros" class="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div><label class="${LABEL}">Acción</label><select id="f-accion" class="${INPUT}"><option value="">Todas</option></select></div>
          <div><label class="${LABEL}">Usuario</label><input id="f-usuario" class="${INPUT}" placeholder="Nombre o usuario" /></div>
          <div><label class="${LABEL}">Desde</label><input id="f-desde" type="date" class="${INPUT}" /></div>
          <div><label class="${LABEL}">Hasta</label><input id="f-hasta" type="date" class="${INPUT}" /></div>
          <div class="flex gap-2"><button class="${BTN_PRIMARIO} flex-1">Filtrar</button><button type="button" id="limpiar" class="${BTN_SECUNDARIO}">Limpiar</button></div>
        </form>
        <p id="msg" class="text-sm text-slate-500"></p>
        <div class="overflow-auto"><table class="w-full text-left text-sm">
          <thead class="text-xs uppercase text-slate-400 border-b"><tr><th class="py-2 pr-3">Fecha</th><th class="pr-3">Usuario</th><th class="pr-3">Acción</th><th class="pr-3">Detalle</th><th>IP</th></tr></thead>
          <tbody id="filas" class="divide-y"></tbody></table></div>
        <div class="text-center"><button id="mas" class="${BTN_SECUNDARIO} hidden">Cargar más</button></div>
      </section>
    </div>`;
  const $ = <T extends HTMLElement>(id: string) => main.querySelector<T>(`#${id}`)!;
  const val = (id: string) => $<HTMLInputElement>(id).value.trim();

  const pintar = () => {
    $("filas").innerHTML = items
      .map((i) => {
        const falla = i.accion.includes("FALLIDO") || i.accion.includes("ERROR");
        return `<tr><td class="py-2 pr-3 whitespace-nowrap text-slate-600">${fechaLarga(new Date(i.fecha))}</td>
          <td class="pr-3">${esc(i.usuario ?? "—")}<br /><span class="text-xs text-slate-400">${esc(i.username)}</span></td>
          <td class="pr-3"><span class="text-xs px-2 py-0.5 rounded-full ${falla ? "bg-red-100 text-red-700" : "bg-blue-50 text-blue-800"}">${esc(nombreAccion(i.accion))}</span></td>
          <td class="pr-3 text-slate-600 max-w-md break-words">${esc(resumen(i.detalle))}</td>
          <td class="text-slate-400 whitespace-nowrap">${esc(i.ip)}</td></tr>`;
      })
      .join("");
    $("msg").textContent = items.length ? `${items.length} registro(s) mostrados.` : "No hay registros con esos filtros.";
    $("mas").classList.toggle("hidden", !hayMas);
  };

  const consulta = (offset: number) => {
    const p = new URLSearchParams({ limit: String(TAMANO), offset: String(offset) });
    for (const [clave, id] of [["accion", "f-accion"], ["usuario", "f-usuario"], ["desde", "f-desde"], ["hasta", "f-hasta"]]) {
      if (val(id)) p.set(clave, val(id));
    }
    return api<AuditoriaItem[]>(`/auditoria?${p}`);
  };

  const cargar = async (anexar = false) => {
    try {
      const nuevos = await consulta(anexar ? items.length : 0);
      items = anexar ? [...items, ...nuevos] : nuevos;
      hayMas = nuevos.length === TAMANO;
      pintar();
    } catch (e) {
      $("msg").textContent = e instanceof ApiError ? e.message : "No se pudo cargar la auditoría.";
    }
  };

  $<HTMLFormElement>("filtros").addEventListener("submit", (e) => {
    e.preventDefault();
    cargar();
  });
  $("limpiar").addEventListener("click", () => {
    $<HTMLFormElement>("filtros").reset();
    cargar();
  });
  $("mas").addEventListener("click", () => cargar(true));

  try {
    const acciones = await api<string[]>("/auditoria/acciones");
    $("f-accion").insertAdjacentHTML("beforeend", acciones.map((a) => `<option value="${esc(a)}">${esc(nombreAccion(a))}</option>`).join(""));
  } catch {}
  await cargar();
}
