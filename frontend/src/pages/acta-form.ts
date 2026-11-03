import { abrirPdf, api, ApiError, me, Usuario } from "../api";
import { Acta, Catalogo, Equipo, FirmaResumen, FirmasEstado, Paciente } from "../types";
import { esc, fechaLarga } from "../utils";
import { pedirFirma } from "./firma-modal";
import { pedirFirmaPaciente } from "./firma-paciente-modal";
import { revisarYEnviar } from "./revision-envio";
import { mostrarPrestamoActivo } from "./prestamo-activo";
import { BTN_SECUNDARIO, encabezado, icono, modal, toast } from "../ui";

const INPUT =
  "w-full border border-slate-300 rounded-lg px-3 py-2";
const LABEL = "block text-sm font-medium mb-1";

const opciones = (items: Catalogo[]) =>
  `<option value="">— Seleccionar —</option>` +
  items.map((i) => `<option value="${i.id}">${esc(i.nombre)}</option>`).join("");

// Fecha/hora local en el formato que pide <input type="datetime-local">.
function ahoraLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export async function renderActaForm(main: HTMLElement) {
  main.innerHTML = `<p class="text-slate-500">Cargando...</p>`;

  const [equipos, aseguradoras, regimenes] = await Promise.all([
    api<Equipo[]>("/equipos?estado=disponible"),
    api<Catalogo[]>("/catalogos/aseguradoras"),
    api<Catalogo[]>("/catalogos/regimenes"),
  ]);
  const preEquipo = new URLSearchParams(location.hash.split("?")[1] ?? "").get("equipo");

  main.innerHTML = `
    <form id="form" class="space-y-6">
      ${encabezado("Préstamos", "Nueva acta de préstamo", "Registra la entrega del equipo, la firma y el envío del acta.",
        `<a href="#/" class="${BTN_SECUNDARIO} inline-flex items-center gap-2 !rounded-xl">${icono.atras}Volver</a>`)}

      <section class="bg-white rounded-xl shadow p-6 space-y-4">
        <h3 class="font-semibold text-blue-800">1. Paciente</h3>
        <div class="grid md:grid-cols-3 gap-4">
          <div>
            <label class="${LABEL}" for="tipo_documento">Tipo de documento</label>
            <select id="tipo_documento" class="${INPUT}">
              <option>CC</option><option>TI</option><option>CE</option><option>PA</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="${LABEL}" for="numero_documento">Número de documento *</label>
            <div class="flex gap-2">
              <input id="numero_documento" required class="${INPUT}" placeholder="Ej: 1061234567" />
              <button type="button" id="buscar" class="bg-slate-200 hover:bg-slate-300 rounded-lg px-4 whitespace-nowrap">Buscar</button>
            </div>
            <p id="estado-paciente" class="text-xs mt-1 text-slate-500">Escribe la cédula para autocompletar los datos si ya prestó antes.</p>
          </div>
          <div class="md:col-span-3">
            <label class="${LABEL}" for="nombre_completo">Nombre completo *</label>
            <input id="nombre_completo" required class="${INPUT}" />
          </div>
          <div>
            <label class="${LABEL}" for="ciudad_expedicion">Cédula expedida en</label>
            <input id="ciudad_expedicion" class="${INPUT}" />
          </div>
          <div>
            <label class="${LABEL}" for="vecino_de">Vecino de</label>
            <input id="vecino_de" class="${INPUT}" />
          </div>
          <div>
            <label class="${LABEL}" for="telefono">Teléfono</label>
            <input id="telefono" class="${INPUT}" />
          </div>
          <div class="md:col-span-3">
            <label class="${LABEL}" for="correo">Correo electrónico * <span class="text-slate-400 font-normal">(aquí se enviará el acta)</span></label>
            <input id="correo" type="email" required class="${INPUT}" />
          </div>
        </div>
      </section>

      <section class="bg-white rounded-xl shadow p-6 space-y-4">
        <h3 class="font-semibold text-blue-800">2. Equipo y préstamo</h3>
        <div class="grid md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="${LABEL}" for="equipo_id">Equipo disponible *</label>
            <select id="equipo_id" required class="${INPUT}">
              <option value="">— Seleccionar —</option>
              ${equipos
                .map(
                  (e) =>
                    `<option value="${e.id}" ${e.id === preEquipo ? "selected" : ""}>${esc(e.tipo.nombre)}${e.marca ? " " + esc(e.marca) : ""} — serie ${esc(e.serie)}</option>`,
                )
                .join("")}
            </select>
            ${equipos.length === 0 ? `<p class="text-xs mt-1 text-red-600">No hay equipos disponibles. Un administrador debe registrarlos en el menú «Equipos».</p>` : ""}
          </div>
          <div>
            <label class="${LABEL}" for="fecha_entrega">Fecha y hora de entrega *</label>
            <input id="fecha_entrega" type="datetime-local" required value="${ahoraLocal()}" class="${INPUT}" />
          </div>
          <div>
            <label class="${LABEL}" for="duracion_horas">Duración *</label>
            <select id="duracion_horas" class="${INPUT}">
              <option value="24">24 horas</option><option value="48">48 horas</option>
            </select>
          </div>
          <p class="md:col-span-2 text-sm text-slate-600">
            Devolución prevista: <strong id="devolucion">—</strong>
          </p>
          <div>
            <label class="${LABEL}" for="aseguradora_id">Aseguradora</label>
            <select id="aseguradora_id" class="${INPUT}">${opciones(aseguradoras)}</select>
          </div>
          <div>
            <label class="${LABEL}" for="regimen_id">Régimen</label>
            <select id="regimen_id" class="${INPUT}">${opciones(regimenes)}</select>
          </div>
          <div class="md:col-span-2">
            <label class="${LABEL}" for="observaciones">Observaciones</label>
            <textarea id="observaciones" rows="2" class="${INPUT}"></textarea>
          </div>
        </div>
      </section>

      <p id="error" class="text-sm text-red-600 hidden"></p>
      <div class="flex justify-end">
        <button id="guardar" class="bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-lg px-6 py-2">
          Guardar acta
        </button>
      </div>
    </form>`;

  const $ = <T extends HTMLElement>(id: string) => main.querySelector<T>(`#${id}`)!;
  const val = (id: string) => $<HTMLInputElement>(id).value.trim();
  const opt = (id: string) => val(id) || null;

  let pacienteId: string | null = null;

  // --- Devolución prevista (se recalcula al cambiar fecha o duración) ---
  const calcDevolucion = () => {
    const f = new Date(val("fecha_entrega"));
    if (isNaN(f.getTime())) return ($("devolucion").textContent = "—");
    f.setHours(f.getHours() + Number(val("duracion_horas")));
    $("devolucion").textContent = fechaLarga(f);
  };
  $("fecha_entrega").addEventListener("input", calcDevolucion);
  $("duracion_horas").addEventListener("change", calcDevolucion);
  calcDevolucion();

  // --- Buscar paciente por documento y autocompletar ---
  const estadoPac = $("estado-paciente");
  const buscar = async () => {
    const doc = val("numero_documento");
    if (!doc) return;
    const lista = await api<Paciente[]>(`/pacientes?q=${encodeURIComponent(doc)}`);
    const p = lista.find((x) => x.numero_documento === doc);
    if (p) {
      pacienteId = p.id;
      $<HTMLSelectElement>("tipo_documento").value = p.tipo_documento;
      $<HTMLInputElement>("nombre_completo").value = p.nombre_completo;
      $<HTMLInputElement>("ciudad_expedicion").value = p.ciudad_expedicion ?? "";
      $<HTMLInputElement>("vecino_de").value = p.vecino_de ?? "";
      $<HTMLInputElement>("telefono").value = p.telefono ?? "";
      $<HTMLInputElement>("correo").value = p.correo ?? "";

      // Préstamo abierto de ESTE paciente (no de otros).
      let abierta: Acta | null = null;
      try {
        abierta = await api<Acta | null>(`/actas/paciente/${p.id}/abierta`);
      } catch {
        abierta = null;
      }
      if (abierta) {
        estadoPac.innerHTML =
          `⚠ <b>Paciente con préstamo activo</b> (acta #${abierta.numero} · ${esc(abierta.equipo.tipo.nombre)} serie ${esc(abierta.equipo.serie)} · estado: ${abierta.estado}). ` +
          `Puedes registrar la devolución o cancelar esa acta para liberar el equipo.`;
        estadoPac.className = "text-xs mt-1 text-amber-700 bg-amber-50 rounded p-2";
        mostrarPrestamoActivo(estadoPac, abierta, () => recargar());
      } else {
        estadoPac.textContent = "Paciente encontrado: revisa y actualiza los datos si cambiaron.";
        estadoPac.className = "text-xs mt-1 text-green-700";
        mostrarPrestamoActivo(estadoPac, null, () => {});
      }
    } else {
      pacienteId = null;
      mostrarPrestamoActivo(estadoPac, null, () => {});
      estadoPac.textContent = "Paciente nuevo: se registrará al guardar el acta.";
      estadoPac.className = "text-xs mt-1 text-amber-700";
    }
  };
  // Tras devolver o cancelar: refresca el selector de equipos disponibles y vuelve a revisar al paciente.
  const recargar = async () => {
    const lista = await api<Equipo[]>("/equipos?estado=disponible").catch(() => null);
    if (lista) {
      const sel = $<HTMLSelectElement>("equipo_id");
      const elegido = sel.value;
      sel.innerHTML =
        `<option value="">— Seleccionar —</option>` +
        lista
          .map((e) => `<option value="${e.id}" ${e.id === elegido ? "selected" : ""}>${esc(e.tipo.nombre)}${e.marca ? " " + esc(e.marca) : ""} — serie ${esc(e.serie)}</option>`)
          .join("");
    }
    await buscar().catch(() => {});
  };
  $("buscar").addEventListener("click", () => buscar().catch(() => {}));
  $("numero_documento").addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Enter") {
      e.preventDefault();
      buscar().catch(() => {});
    }
  });
  // Si cambia el documento, ya no es el paciente encontrado antes; se busca solo al dejar de escribir.
  let temporizador: number | undefined;
  $("numero_documento").addEventListener("input", () => {
    pacienteId = null;
    estadoPac.textContent = "Buscando...";
    estadoPac.className = "text-xs mt-1 text-slate-500";
    clearTimeout(temporizador);
    if (val("numero_documento").length >= 5) {
      temporizador = window.setTimeout(() => buscar().catch(() => {}), 600);
    } else {
      estadoPac.textContent = "Escribe la cédula para autocompletar los datos si ya prestó antes.";
    }
  });
  $("numero_documento").addEventListener("blur", () => {
    clearTimeout(temporizador);
    if (!pacienteId && val("numero_documento").length >= 3) buscar().catch(() => {});
  });

  // --- Guardar ---
  const error = $("error");
  const btn = $<HTMLButtonElement>("guardar");
  $<HTMLFormElement>("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    error.classList.add("hidden");
    btn.disabled = true;
    btn.textContent = "Guardando...";
    try {
      const pacienteBody = JSON.stringify({
        tipo_documento: val("tipo_documento"),
        numero_documento: val("numero_documento"),
        nombre_completo: val("nombre_completo"),
        ciudad_expedicion: opt("ciudad_expedicion"),
        vecino_de: opt("vecino_de"),
        telefono: opt("telefono"),
        correo: val("correo"),
      });
      const paciente = pacienteId
        ? await api<Paciente>(`/pacientes/${pacienteId}`, { method: "PUT", body: pacienteBody })
        : await api<Paciente>("/pacientes", { method: "POST", body: pacienteBody });

      const acta = await api<Acta>("/actas", {
        method: "POST",
        body: JSON.stringify({
          paciente_id: paciente.id,
          equipo_id: val("equipo_id"),
          aseguradora_id: val("aseguradora_id") ? Number(val("aseguradora_id")) : null,
          regimen_id: val("regimen_id") ? Number(val("regimen_id")) : null,
          fecha_entrega: val("fecha_entrega") + ":00",
          duracion_horas: Number(val("duracion_horas")),
          observaciones: opt("observaciones"),
        }),
      });
      mostrarExito(main, acta);
    } catch (err) {
      error.textContent = err instanceof ApiError ? err.message : "No se pudo conectar con el servidor";
      error.classList.remove("hidden");
      btn.disabled = false;
      btn.textContent = "Guardar acta";
    }
  });
}

async function mostrarExito(main: HTMLElement, acta: Acta) {
  const firmados = new Set<string>();
  let estado = acta.estado;
  let motivoNoFirma: string | null = null;
  let firmaDePerfil = false;
  let yo: Usuario | null = null;

  // Estado real de las firmas: la de la enfermera puede venir cargada de su perfil.
  try {
    yo = await me();
    for (const f of await api<FirmaResumen[]>(`/actas/${acta.id}/firmas`)) {
      firmados.add(f.rol);
      if (f.rol === "PACIENTE" && f.motivo_no_firma) motivoNoFirma = f.motivo_no_firma;
      if (f.rol === "ENFERMERA" && yo.tiene_firma) firmaDePerfil = true;
    }
  } catch {}

  const pintar = (mensaje = "", esError = false) => {
    const completa = firmados.has("PACIENTE") && firmados.has("ENFERMERA");
    const tarjeta = (titulo: string, estadoTxt: string, ok: boolean, botones: string) => `
      <div class="rounded-xl border ${ok ? "border-green-300 bg-green-50" : "border-slate-200 bg-white"} p-4 text-left space-y-3 transition">
        <div class="flex items-center gap-2"><span class="text-xl">${ok ? "✅" : "⬜"}</span><p class="font-semibold text-slate-900">${titulo}</p></div>
        <p class="text-sm ${ok ? "text-green-800" : "text-slate-500"}">${estadoTxt}</p>
        <div class="flex gap-2 flex-wrap">${botones}</div>
      </div>`;
    const BTN_A = "bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-3 py-1.5 text-sm font-medium";
    const BTN_B = "bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg px-3 py-1.5 text-sm font-medium";

    const paciente = tarjeta(
      "Paciente",
      firmados.has("PACIENTE")
        ? motivoNoFirma ? `🚫 No puede firmar: ${esc(motivoNoFirma)}` : "Firmó el acta"
        : "Pendiente de firma",
      firmados.has("PACIENTE"),
      `<button id="firma-paciente" class="${BTN_A}">${firmados.has("PACIENTE") ? "Cambiar" : "Firmar / no puede firmar"}</button>
       ${firmados.has("PACIENTE") ? "" : `<button id="firma-celular" class="${BTN_B}">📱 Que firme en su celular</button>`}`,
    );
    const enfermera = tarjeta(
      "Enfermera",
      firmados.has("ENFERMERA")
        ? firmaDePerfil ? "Firma cargada automáticamente desde tu perfil" : "Firmó el acta"
        : yo?.tiene_firma ? "Pendiente de firma" : `Pendiente. <a href="#/cuenta" class="underline text-blue-700">Guarda tu firma en «Mi cuenta»</a> y se cargará sola en cada acta.`,
      firmados.has("ENFERMERA"),
      `<button id="firma-enfermera" class="${firmados.has("ENFERMERA") ? BTN_B : BTN_A}">${firmados.has("ENFERMERA") ? "Volver a firmar" : "Firmar"}</button>`,
    );

    main.innerHTML = `
      <div class="bg-white rounded-2xl shadow p-8 text-center space-y-5 max-w-3xl mx-auto">
        <div><div class="text-4xl mb-1">📄</div><h2 class="text-xl font-semibold text-slate-900">Acta #${acta.numero} guardada</h2></div>
        <p class="text-slate-600">
          ${esc(acta.paciente.nombre_completo)} — ${esc(acta.equipo.tipo.nombre)} serie ${esc(acta.equipo.serie)}<br />
          Devolución prevista: ${acta.fecha_devolucion_prevista ? fechaLarga(new Date(acta.fecha_devolucion_prevista)) : "—"}<br />
          Correo: ${esc(acta.paciente.correo) || "<span class='text-red-600'>sin correo</span>"}
        </p>
        <div class="grid sm:grid-cols-2 gap-4 escalonado">${paciente}${enfermera}</div>
        ${
          completa
            ? `<div class="flex justify-center gap-3 flex-wrap">
                <button id="ver-pdf" class="bg-slate-200 hover:bg-slate-300 rounded-lg px-4 py-2">Ver PDF</button>
                <button id="enviar" class="bg-blue-700 hover:bg-blue-600 text-white rounded-lg px-5 py-2 font-medium"
                  ${estado === "ENVIADA" ? "disabled" : ""}>${estado === "ENVIADA" ? "Enviada ✔" : "Revisar y enviar por correo"}</button>
              </div>
              <p class="text-xs text-slate-500">Si no la envías ahora, queda en «Por enviar» en el inicio.</p>`
            : `<p class="text-sm text-slate-400">Cuando estén las dos firmas podrás revisar y enviar el acta.</p>`
        }
        <p class="text-sm ${esError ? "text-red-600" : "text-green-700"}">${esc(mensaje)}</p>
        <div class="pt-2 flex justify-center gap-3">
          <button id="otra" class="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2">Nueva acta</button>
          <a href="#/" class="bg-slate-200 hover:bg-slate-300 rounded-lg px-4 py-2">Inicio</a>
        </div>
      </div>`;

    const guardarFirma = async (cuerpo: Record<string, unknown>, rol: "PACIENTE" | "ENFERMERA", aviso: string) => {
      try {
        const e = await api<FirmasEstado>(`/actas/${acta.id}/firmas`, { method: "POST", body: JSON.stringify(cuerpo) });
        firmados.add(rol);
        estado = e.estado;
        motivoNoFirma = rol === "PACIENTE" ? (cuerpo.no_puede_firmar ? String(cuerpo.motivo_no_firma) : null) : motivoNoFirma;
        if (rol === "ENFERMERA") firmaDePerfil = false;
        toast(aviso, "ok");
        pintar();
      } catch (err) {
        pintar(err instanceof ApiError ? err.message : "No se pudo guardar la firma", true);
      }
    };

    main.querySelector("#firma-paciente")!.addEventListener("click", async () => {
      const cuerpo = await pedirFirmaPaciente(acta);
      if (cuerpo) await guardarFirma(cuerpo, "PACIENTE", cuerpo.no_puede_firmar ? "Quedó constancia de que el paciente no puede firmar." : "Firma del paciente guardada.");
    });
    main.querySelector("#firma-enfermera")!.addEventListener("click", async () => {
      const r = await pedirFirma({ titulo: "Firma de la enfermera", nombre: yo?.nombre, documento: yo?.documento ?? "", pedirDatos: true });
      if (r) await guardarFirma({ rol: "ENFERMERA", firmante_nombre: r.nombre, firmante_documento: r.documento, imagen: r.imagen }, "ENFERMERA", "Firma de la enfermera guardada.");
    });
    main.querySelector("#firma-celular")?.addEventListener("click", async () => {
      try {
        const e = await api<{ url: string; expira_en: string; qr_png_base64: string }>(`/actas/${acta.id}/enlace-firma`, { method: "POST" });
        const m = modal(
          `<div class="p-6 space-y-4 text-center">
            <h3 class="text-lg font-semibold text-slate-900">Firma desde el celular del paciente</h3>
            <p class="text-sm text-slate-600">Pídele que escanee este código con la cámara de su celular. <b>Debe estar conectado al mismo Wi‑Fi de la IPS.</b></p>
            <img src="data:image/png;base64,${e.qr_png_base64}" alt="Código QR" class="w-56 h-56 mx-auto border rounded-xl p-2" />
            <p class="text-xs text-slate-400 break-all select-all">${esc(e.url)}</p>
            <p class="text-sm text-blue-800 font-medium animate-pulse">Esperando la firma del paciente...</p>
            <p class="text-xs text-slate-400">El enlace sirve una sola vez y vence en ${Math.round((new Date(e.expira_en).getTime() - Date.now()) / 60000)} minutos.</p>
            <button id="f-cancelar" class="bg-slate-100 hover:bg-slate-200 rounded-lg px-4 py-2 text-sm">Cancelar</button>
          </div>`,
          "max-w-sm",
        );
        const parar = () => {
          clearInterval(t);
          m.cerrar();
        };
        const t = window.setInterval(async () => {
          if (!m.overlay.isConnected) return clearInterval(t);
          try {
            const firmas = await api<FirmaResumen[]>(`/actas/${acta.id}/firmas`);
            if (firmas.some((f) => f.rol === "PACIENTE")) {
              parar();
              firmados.add("PACIENTE");
              estado = (await api<Acta>(`/actas/${acta.id}`)).estado;
              toast("El paciente firmó desde su celular.", "ok");
              pintar();
            }
          } catch {}
        }, 3000);
        m.q("#f-cancelar").addEventListener("click", parar);
      } catch (err) {
        pintar(err instanceof ApiError ? err.message : "No se pudo crear el enlace de firma", true);
      }
    });
    main.querySelector("#ver-pdf")?.addEventListener("click", () => abrirPdf(acta.id).catch((err) => pintar(err.message, true)));
    main.querySelector("#enviar")?.addEventListener("click", async () => {
      const r = await revisarYEnviar({ ...acta, estado });
      acta = r.acta;
      if (r.enviada) estado = "ENVIADA";
      pintar(r.enviada ? "Correo enviado." : "");
    });
    main.querySelector("#otra")!.addEventListener("click", () => renderActaForm(main));
  };
  pintar();
}