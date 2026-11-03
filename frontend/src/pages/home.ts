import { abrirPdf, api, ApiError } from "../api";
import { Acta, Dashboard, Envio } from "../types";
import { esc, fechaLarga } from "../utils";
import { animarNumeros, circulo, encabezado, estadoVacio, icono, tituloPanel, toast } from "../ui";
import { ejecutarLote } from "./progreso-envio";
import { revisarYEnviar } from "./revision-envio";

type Pestana = "pendientes" | "prestamo" | "enviadas" | "historial";

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const BTN = "rounded-lg px-3 py-1.5 text-sm font-medium transition";
const BTN_SEC = "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300";
const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function renderHome(main: HTMLElement) {
  let pestana: Pestana = "pendientes";
  let pendientes: Acta[] = []; // firmadas, sin enviar
  let enviadas: Acta[] = [];
  let devueltas: Acta[] = [];
  let anuladas: Acta[] = [];
  let stats: Dashboard | null = null;
  let animado = false; // los números y barras se animan solo al entrar
  let animarLista = true; // la lista entra escalonada al entrar o cambiar de pestaña
  let filtro = "";
  const seleccion = new Set<string>();
  let enviando = false;

  const enPrestamo = () => [...pendientes, ...enviadas].sort((a, b) => b.numero - a.numero);
  const historial = () => [...devueltas, ...anuladas].sort((a, b) => b.numero - a.numero);
  const vencida = (a: Acta) => !!a.fecha_devolucion_prevista && new Date(a.fecha_devolucion_prevista) < new Date();

  main.innerHTML = `
    <div class="space-y-6">
      ${encabezado("Bienvenido", "Panel de control", "Gestiona el préstamo de equipos de cardiología de forma rápida y segura.",
        `<a href="#/nueva" class="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white font-medium rounded-xl px-5 py-2.5 text-sm shadow-xs">${icono.mas}Nueva acta</a>`)}

      <div id="resumen" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"></div>
      <div id="panel" class="grid lg:grid-cols-3 gap-4"></div>

      <section class="bg-white rounded-2xl shadow p-5 md:p-6 space-y-4">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div id="tabs" class="inline-flex bg-slate-100/80 rounded-full p-1 text-sm font-medium flex-wrap gap-0.5"></div>
          <div class="relative w-full sm:w-72">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 [&>svg]:w-[18px] [&>svg]:h-[18px]">${icono.buscar}</span>
            <input id="buscar" placeholder="Buscar por nombre o documento…" aria-label="Buscar por nombre o documento"
              class="w-full border border-slate-200 rounded-full pl-10 pr-4 py-2 text-sm bg-white" />
          </div>
        </div>
        <div id="barra" class="flex items-center justify-between gap-3 flex-wrap"></div>
        <p id="msg" class="text-sm"></p>
        <div id="lista" class="divide-y">${'<div class="py-4 flex gap-3"><div class="skeleton w-9 h-9 rounded-full"></div><div class="flex-1 space-y-2"><div class="skeleton h-4 w-2/3"></div><div class="skeleton h-3 w-1/2"></div></div></div>'.repeat(3)}</div>
      </section>
    </div>`;

  const $ = <T extends HTMLElement>(id: string) => main.querySelector<T>(`#${id}`)!;

  // ---------- Datos ----------
  // ── Mejora: error individual por pestaña, no borra todo si una falla ────────
  const cargar = async () => {
    const [r0, r1, r2, r3] = await Promise.allSettled([
      api<Acta[]>("/actas?estado=firmada&limit=200"),
      api<Acta[]>("/actas?estado=enviada&limit=200"),
      api<Acta[]>("/actas?estado=devuelta&limit=200"),
      api<Acta[]>("/actas?estado=anulada&limit=200"),
    ]);
    pendientes = r0.status === "fulfilled" ? r0.value : pendientes;
    enviadas   = r1.status === "fulfilled" ? r1.value : enviadas;
    devueltas  = r2.status === "fulfilled" ? r2.value : devueltas;
    anuladas   = r3.status === "fulfilled" ? r3.value : anuladas;

    if ([r0, r1, r2, r3].some((r) => r.status === "rejected")) {
      toast("Algunas pestañas no pudieron cargar. Revisa la conexión con el servidor.", "error");
    }

    stats = await api<Dashboard>("/dashboard").catch(() => null);
    const vigentes = new Set(pendientes.map((a) => a.id));
    for (const id of [...seleccion]) if (!vigentes.has(id)) seleccion.delete(id);
    pintar();
  };

  const base = (): Acta[] =>
    ({ pendientes, enviadas, historial: historial(), prestamo: enPrestamo() })[pestana];

  const visibles = () => {
    const q = filtro.trim().toLowerCase();
    if (!q) return base();
    return base().filter(
      (a) => a.paciente.nombre_completo.toLowerCase().includes(q) || a.paciente.numero_documento.includes(q),
    );
  };

  const problema = (a: Acta): string | null => {
    if (!a.paciente.correo) return "Sin correo";
    if (!EMAIL_OK.test(a.paciente.correo)) return "Correo inválido";
    return null;
  };

  // ---------- Pintado ----------
  const pintar = () => {
    const nVencidas = enPrestamo().filter(vencida).length;
    const tarjeta = (tab: Pestana, n: number, titulo: string, desc: string, svg: string, tono: "blue" | "green" | "violet" | "amber", extra = "") => `
      <button data-tab="${tab}" class="metrica bg-white rounded-2xl shadow p-5 flex flex-col gap-3 w-full">
        <div class="flex items-start justify-between w-full">${circulo(svg, tono, "w-12 h-12")}<span class="flecha text-slate-400 [&>svg]:w-[18px] [&>svg]:h-[18px] mt-1">${icono.chevron}</span></div>
        <p class="text-[15px] text-slate-600 font-medium">${titulo}</p>
        <p class="text-3xl font-bold text-slate-900 leading-none" ${animado ? "" : `data-contar="${n}"`}>${animado ? n : 0}</p>
        <p class="text-xs text-slate-500">${desc}${extra}</p>
      </button>`;
    $("resumen").innerHTML =
      tarjeta("pendientes", pendientes.length, "Por enviar", "Actas pendientes de envío", icono.documento, "blue") +
      tarjeta("enviadas", enviadas.length, "Enviadas", "Actas enviadas al paciente", icono.sobre, "green") +
      tarjeta("prestamo", enPrestamo().length, "En préstamo", "Equipos en uso actualmente", icono.reloj, "violet",
        nVencidas ? ` · <b class="text-red-600">${nVencidas} vencida${nVencidas > 1 ? "s" : ""}</b>` : "") +
      tarjeta("historial", devueltas.length, "Devueltas", "Equipos retornados", icono.retorno, "amber");
    if (!animado) animarNumeros($("resumen"));

    pintarPanel();

    const tab = (id: Pestana, texto: string, n: number) =>
      `<button data-tab="${id}" class="px-4 py-2 rounded-full transition ${pestana === id ? "bg-blue-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-white/70"}" aria-pressed="${pestana === id}">${texto} (${n})</button>`;
    $("tabs").innerHTML =
      tab("pendientes", "Por enviar", pendientes.length) +
      tab("enviadas", "Enviadas", enviadas.length) +
      tab("prestamo", "En préstamo", enPrestamo().length) +
      tab("historial", "Historial", devueltas.length + anuladas.length);

    const lista = visibles();
    const enviables = lista.filter((a) => !problema(a));

    if (pestana === "pendientes") {
      const todosMarcados = enviables.length > 0 && enviables.every((a) => seleccion.has(a.id));
      $("barra").innerHTML = `
        <label class="flex items-center gap-2.5 text-sm text-slate-600 ${enviables.length ? "" : "opacity-40"}">
          <input id="sel-todas" type="checkbox" class="login-check" ${todosMarcados ? "checked" : ""} ${enviables.length ? "" : "disabled"} />
          Seleccionar todas
        </label>
        <button id="enviar-sel" class="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white rounded-full px-5 py-2 text-sm font-medium disabled:bg-blue-200 disabled:text-white disabled:cursor-not-allowed" ${seleccion.size && !enviando ? "" : "disabled"}>
          ${icono.enviar.replace("w-5 h-5", "w-4 h-4")}Enviar seleccionadas (${seleccion.size})
        </button>`;
    } else {
      $("barra").innerHTML = `<p class="text-sm text-slate-500">${{
        enviadas: "Actas ya enviadas al correo del paciente.",
        prestamo: "Equipos que siguen con el paciente. Marca la devolución cuando lo entreguen.",
        historial: "Equipos ya devueltos y actas anuladas.",
        pendientes: "",
      }[pestana]}</p>`;
    }

    if (!lista.length) {
      const vacio = {
        pendientes: [icono.documento, "No hay documentos pendientes de envío.", "Cuando generes una nueva acta, aparecerá aquí para que la envíes."],
        enviadas: [icono.sobre, "Todavía no se ha enviado ningún acta.", "Las actas enviadas al correo del paciente aparecerán aquí."],
        prestamo: [icono.reloj, "No hay equipos en préstamo.", "Cuando entregues un equipo, podrás seguir su devolución desde aquí."],
        historial: [icono.retorno, "Aún no hay devoluciones ni anulaciones.", "Los equipos devueltos y las actas anuladas se guardan aquí."],
      }[pestana];
      $("lista").className = "";
      $("lista").innerHTML = filtro
        ? estadoVacio(icono.buscar, "Sin resultados para esa búsqueda.", "Prueba con otro nombre o número de documento.", "slate")
        : estadoVacio(vacio[0], vacio[1], vacio[2]);
      return;
    }

    $("lista").className = `divide-y ${animarLista ? "escalonado" : ""}`;
    $("lista").innerHTML = lista.map((a) => fila(a)).join("");
    animarLista = false;
    animado = true;
  };

  const pintarPanel = () => {
    if (!stats) {
      $("panel").innerHTML = "";
      return;
    }
    const e = stats.equipos;
    const total = Object.values(e).reduce((a, b) => a + b, 0);
    const datos = stats.prestamos_14_dias;
    const maxReal = Math.max(1, ...datos.map((d) => d.total));
    const paso = maxReal <= 5 ? 1 : Math.ceil(maxReal / 4 / 5) * 5; // marcas "bonitas" en el eje
    const tope = Math.max(paso * (maxReal <= 5 ? 5 : 3), Math.ceil(maxReal / paso) * paso);
    const W = 700, H = 230, L = 34, R = 12, T = 12, B = 30;
    const x = (i: number) => L + (i * (W - L - R)) / Math.max(1, datos.length - 1);
    const y = (v: number) => T + (H - T - B) * (1 - v / tope);
    const marcas: number[] = [];
    for (let v = 0; v <= tope; v += paso) marcas.push(v);
    const rejilla = marcas
      .map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#eef1f7" /><text x="${L - 10}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#98a2b3">${v}</text>`)
      .join("");
    const fecha = (d: { fecha: string }) => new Date(d.fecha + "T12:00:00");
    const dias = datos.map((d, i) => `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#667085">${fecha(d).getDate()}</text>`).join("");
    const ruta = datos.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(d.total).toFixed(1)}`).join(" ");
    const area = `${ruta} L${x(datos.length - 1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z`;
    const puntos = datos
      .map((d, i) => `<circle class="${animado ? "" : "linea-punto"}" cx="${x(i).toFixed(1)}" cy="${y(d.total).toFixed(1)}" r="3.6" fill="#fff" stroke="#1746c8" stroke-width="2"><title>${d.total} préstamo(s) el ${fecha(d).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}</title></circle>`)
      .join("");
    const rango = datos.length
      ? `${fecha(datos[0]).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })} – ${fecha(datos[datos.length - 1]).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}`
      : "";
    const grafico = `<svg viewBox="0 0 ${W} ${H}" class="w-full h-auto mt-3" role="img" aria-label="Préstamos por día en los últimos 14 días">
      <defs><linearGradient id="g-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#285ff4" stop-opacity=".16"/><stop offset="1" stop-color="#285ff4" stop-opacity="0"/></linearGradient></defs>
      ${rejilla}${dias}
      <path class="${animado ? "" : "linea-area"}" d="${area}" fill="url(#g-area)" />
      <path class="${animado ? "" : "linea-trazo"}" pathLength="1" d="${ruta}" fill="none" stroke="#1746c8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      ${puntos}</svg>`;

    const top = stats.top_equipos.length
      ? `<ul class="mt-1 text-sm text-slate-700 space-y-1.5">${stats.top_equipos.map((t, i) => `<li class="flex justify-between gap-3"><span class="truncate">${i + 1}. ${esc(t.nombre)}</span><b class="text-blue-800">${t.total}</b></li>`).join("")}</ul>`
      : `<p class="mt-0.5 font-semibold text-slate-900">Sin préstamos recientes</p>`;
    $("panel").innerHTML = `
      <div class="bg-white rounded-2xl shadow p-5 md:p-6 lg:col-span-2">
        ${tituloPanel(icono.reportes, "Préstamos de los últimos 14 días", `<span class="inline-flex items-center gap-2 text-xs text-slate-500 [&>svg]:w-4 [&>svg]:h-4">${icono.calendario}${rango}</span>`)}
        ${grafico}
      </div>
      <div class="bg-white rounded-2xl shadow p-5 md:p-6 space-y-5">
        ${tituloPanel(icono.reportes, "Resumen")}
        <div class="flex items-center gap-4">${circulo(icono.equipos, "green", "w-12 h-12")}
          <div><p class="text-xs text-slate-500">Equipos disponibles</p>
            <p class="text-2xl font-bold text-slate-900 leading-tight">${e.DISPONIBLE ?? 0}</p>
            <p class="text-xs text-slate-500">de ${total} equipos${e.MANTENIMIENTO ? ` · <span class="text-amber-600">${e.MANTENIMIENTO} en mantenimiento</span>` : ""}</p></div></div>
        <div class="flex items-start gap-4">${circulo(icono.reloj, "blue", "w-12 h-12")}
          <div class="min-w-0 flex-1"><p class="text-xs text-slate-500">Más prestados (90 días)</p>${top}</div></div>
        ${stats.por_vencer_24h ? `<p class="text-sm bg-amber-50 text-amber-800 rounded-xl px-3 py-2">${stats.por_vencer_24h} por vencer en las próximas 24 h</p>` : ""}
      </div>`;
  };

  const fila = (a: Acta) => {
    const prob = problema(a);
    const titulo = `#${a.numero} · ${esc(a.paciente.nombre_completo)}`;
    const detalle = `${esc(a.equipo.tipo.nombre)} serie ${esc(a.equipo.serie)} · ${fechaLarga(new Date(a.fecha_entrega))}`;
    const pdf = `<button data-pdf class="${BTN_SEC} ${BTN}">Ver PDF</button>`;
    const deshab = "disabled:opacity-40 disabled:cursor-not-allowed";

    let marca = "";
    let linea3 = "";
    let acciones = pdf;

    if (pestana === "pendientes") {
      marca = `<input type="checkbox" data-sel class="login-check mt-2" ${seleccion.has(a.id) ? "checked" : ""} ${prob ? "disabled" : ""} />`;
      linea3 = `<p class="text-sm ${prob ? "text-red-600 font-medium" : "text-slate-500"}">${prob ? "Aviso: " + prob : esc(a.paciente.correo)}</p>`;
      acciones += `<button data-enviar class="bg-blue-700 hover:bg-blue-600 text-white ${BTN} ${deshab}" ${prob || enviando ? "disabled" : ""}>Revisar y enviar</button>
        <button data-anular class="bg-red-50 hover:bg-red-100 text-red-700 ${BTN}">Anular</button>`;
    } else if (pestana === "enviadas") {
      marca = circulo(icono.check, "green", "w-9 h-9");
      linea3 = `<p class="text-sm text-slate-500">${esc(a.paciente.correo)}</p>`;
      acciones += `<button data-enviar class="bg-blue-50 hover:bg-blue-100 text-blue-800 ${BTN} ${deshab}" ${prob || enviando ? "disabled" : ""}>Reenviar</button>
        <button data-anular class="bg-red-50 hover:bg-red-100 text-red-700 ${BTN}">Anular</button>`;
    } else if (pestana === "prestamo") {
      const v = vencida(a);
      marca = circulo(icono.reloj, v ? "red" : "violet", "w-9 h-9");
      linea3 = `<p class="text-sm ${v ? "text-red-600 font-medium" : "text-slate-500"}">
        Devolución prevista: ${a.fecha_devolucion_prevista ? fechaLarga(new Date(a.fecha_devolucion_prevista)) : "—"}${v ? " · VENCIDA" : ""}
        <span class="ml-2 text-xs px-2 py-0.5 rounded-full ${a.estado === "ENVIADA" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}">${a.estado === "ENVIADA" ? "Enviada" : "Sin enviar"}</span></p>`;
      acciones += `<button data-devolver class="bg-blue-700 hover:bg-blue-600 text-white ${BTN}">Marcar devuelta</button>
        <button data-anular class="bg-red-50 hover:bg-red-100 text-red-700 ${BTN}">Anular</button>`;
    } else if (a.estado === "ANULADA") {
      marca = circulo(icono.ban, "red", "w-9 h-9");
      linea3 = `<p class="text-sm text-red-600">Anulada. ${esc((a.observaciones ?? "").split("ANULADA:").pop()?.trim())}</p>`;
    } else {
      marca = circulo(icono.retorno, "slate", "w-9 h-9");
      linea3 = `<p class="text-sm text-slate-500">Devuelto: ${a.fecha_devolucion_real ? fechaLarga(new Date(a.fecha_devolucion_real)) : "—"}</p>`;
    }

    return `
      <div class="py-3.5 flex items-start gap-3.5" data-id="${a.id}">
        ${marca}
        <div class="flex-1 min-w-0">
          <p class="font-medium truncate">${titulo}</p>
          <p class="text-sm text-slate-500">${detalle}</p>
          ${linea3}
        </div>
        <div class="flex gap-2 shrink-0 flex-wrap justify-end">${acciones}</div>
      </div>`;
  };

  const mensaje = (texto: string, tipo: "ok" | "error" | "info" = "info") => {
    if (texto && tipo !== "info") toast(texto, tipo);
    $("msg").textContent = texto;
    $("msg").className = `text-sm ${tipo === "error" ? "text-red-600" : tipo === "ok" ? "text-green-700 font-medium" : "text-slate-500"}`;
  };

  // ---------- Anular ----------
  const anular = async (acta: Acta) => {
    const motivo = await new Promise<string | null>((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50";
      overlay.innerHTML = `
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
          <h3 class="text-lg font-semibold text-red-700">Anular acta #${acta.numero}</h3>
          <p class="text-sm text-slate-600">${esc(acta.paciente.nombre_completo)} · ${esc(acta.equipo.tipo.nombre)} serie ${esc(acta.equipo.serie)}.
            El equipo quedará disponible. Esta acción no se puede deshacer.</p>
          <div>
            <label class="block text-sm font-medium mb-1">Motivo de la anulación *</label>
            <textarea id="a-motivo" rows="3" class="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder="Ej: Se registró al paciente equivocado"></textarea>
            <p id="a-error" class="text-xs text-red-600 hidden mt-1">Escribe un motivo de al menos 5 letras.</p>
          </div>
          <div class="flex justify-end gap-2">
            <button id="a-no" class="bg-slate-200 hover:bg-slate-300 rounded-lg px-4 py-2">Cancelar</button>
            <button id="a-si" class="bg-red-600 hover:bg-red-700 text-white rounded-lg px-5 py-2">Anular acta</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      const cerrar = (v: string | null) => {
        overlay.remove();
        resolve(v);
      };
      overlay.querySelector("#a-no")!.addEventListener("click", () => cerrar(null));
      overlay.querySelector("#a-si")!.addEventListener("click", () => {
        const m = overlay.querySelector<HTMLTextAreaElement>("#a-motivo")!.value.trim();
        if (m.length < 5) return overlay.querySelector("#a-error")!.classList.remove("hidden");
        cerrar(m);
      });
    });
    if (!motivo) return;
    try {
      await api(`/actas/${acta.id}/anular`, { method: "POST", body: JSON.stringify({ motivo }) });
      await cargar();
      mensaje(`Acta #${acta.numero} anulada. El equipo ${acta.equipo.serie} quedó disponible.`, "ok");
    } catch (err) {
      mensaje(err instanceof ApiError ? err.message : "No se pudo anular el acta", "error");
    }
  };

  // ---------- Confirmar envío de varias ----------
  const confirmarLote = (actas: Acta[]) =>
    new Promise<boolean>((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50";
      overlay.innerHTML = `
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
          <h3 class="text-lg font-semibold">¿Está seguro de enviar ${actas.length} actas?</h3>
          <p class="text-sm text-slate-600">Revisa cada documento antes de enviarlo. Cada acta va al correo de su paciente.</p>
          <div class="max-h-64 overflow-auto divide-y border rounded-lg">
            ${actas
              .map(
                (a) => `<div class="p-3 flex items-center justify-between gap-2 text-sm" data-id="${a.id}">
                  <div class="min-w-0"><p class="font-medium truncate">#${a.numero} · ${esc(a.paciente.nombre_completo)}</p>
                  <p class="text-slate-500 truncate">${esc(a.paciente.correo)}</p></div>
                  <button data-ver class="bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-1 shrink-0">Ver PDF</button></div>`,
              )
              .join("")}
          </div>
          <div class="flex justify-end gap-2">
            <button id="l-no" class="bg-slate-200 hover:bg-slate-300 rounded-lg px-4 py-2">Cancelar</button>
            <button id="l-si" class="bg-blue-700 hover:bg-blue-600 text-white rounded-lg px-5 py-2">Sí, enviar ${actas.length}</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      const cerrar = (v: boolean) => {
        overlay.remove();
        resolve(v);
      };
      overlay.querySelector("#l-no")!.addEventListener("click", () => cerrar(false));
      overlay.querySelector("#l-si")!.addEventListener("click", () => cerrar(true));
      overlay.addEventListener("click", (e) => {
        const b = (e.target as HTMLElement).closest("[data-ver]");
        const id = b?.closest<HTMLElement>("[data-id]")?.dataset.id;
        if (id) abrirPdf(id).catch(() => {});
      });
    });

  // ---------- Devolución ----------
  const pedirDevolucion = (acta: Acta): Promise<{ estado_equipo: string; observaciones: string; comprobante: boolean } | null> =>
    new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50";
      overlay.innerHTML = `
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
          <h3 class="text-lg font-semibold">Registrar devolución</h3>
          <p class="text-sm text-slate-600">
            ${esc(acta.paciente.nombre_completo)} devuelve el ${esc(acta.equipo.tipo.nombre)} serie <b>${esc(acta.equipo.serie)}</b>.
          </p>
          <div>
            <label class="block text-sm font-medium mb-1">¿En qué estado queda el equipo?</label>
            <select id="d-estado" class="w-full border border-slate-300 rounded-lg px-3 py-2">
              <option value="DISPONIBLE">Disponible (listo para prestar)</option>
              <option value="MANTENIMIENTO">En mantenimiento (tiene algún daño)</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Observaciones (opcional)</label>
            <textarea id="d-obs" rows="2" class="w-full border border-slate-300 rounded-lg px-3 py-2"></textarea>
          </div>
          <label class="flex items-start gap-2 text-sm text-slate-700 ${problema(acta) ? "opacity-50" : ""}">
            <input id="d-comprobante" type="checkbox" class="w-4 h-4 mt-0.5" ${problema(acta) ? "disabled" : "checked"} />
            <span>Enviar comprobante de devolución al correo del paciente${problema(acta) ? " (no tiene correo válido)" : ""}</span></label>
          <div class="flex justify-end gap-2">
            <button id="d-cancelar" class="bg-slate-200 hover:bg-slate-300 rounded-lg px-4 py-2">Cancelar</button>
            <button id="d-ok" class="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-5 py-2">Confirmar devolución</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      const cerrar = (r: { estado_equipo: string; observaciones: string; comprobante: boolean } | null) => {
        overlay.remove();
        resolve(r);
      };
      overlay.querySelector("#d-cancelar")!.addEventListener("click", () => cerrar(null));
      overlay.querySelector("#d-ok")!.addEventListener("click", () =>
        cerrar({
          estado_equipo: overlay.querySelector<HTMLSelectElement>("#d-estado")!.value,
          observaciones: overlay.querySelector<HTMLTextAreaElement>("#d-obs")!.value.trim(),
          comprobante: overlay.querySelector<HTMLInputElement>("#d-comprobante")!.checked,
        }),
      );
    });

  const devolver = async (acta: Acta) => {
    const r = await pedirDevolucion(acta);
    if (!r) return;
    try {
      await api(`/actas/${acta.id}/devolver`, {
        method: "POST",
        body: JSON.stringify({ estado_equipo: r.estado_equipo, observaciones: r.observaciones || null }),
      });
      let extra = "";
      let extraError = false;
      if (r.comprobante) {
        try {
          await api(`/actas/${acta.id}/comprobante`, { method: "POST" });
          extra = " Se envió el comprobante al paciente.";
        } catch (err) {
          extra = ` No se pudo enviar el comprobante: ${err instanceof ApiError ? err.message : "error de conexión"}.`;
          extraError = true;
        }
      }
      await cargar();
      mensaje(
        (r.estado_equipo === "DISPONIBLE"
          ? `Devolución registrada: el equipo ${acta.equipo.serie} quedó disponible.`
          : `Devolución registrada: el equipo ${acta.equipo.serie} quedó en mantenimiento.`) + extra,
        extraError ? "error" : "ok",
      );
    } catch (err) {
      mensaje(err instanceof ApiError ? err.message : "No se pudo registrar la devolución", "error");
    }
  };

  // ---------- Envío con progreso ----------
  const enviarLote = async (actas: Acta[]) => {
    if (enviando || !actas.length) return;
    enviando = true;
    pintar();
    const r = await ejecutarLote({
      titulo: actas.length === 1 ? "Enviando acta por Gmail" : `Enviando ${actas.length} actas por Gmail`,
      items: actas,
      nombre: (a) => `#${a.numero} ${a.paciente.nombre_completo}`,
      tarea: (a) => api<Envio>(`/actas/${a.id}/enviar`, { method: "POST", body: JSON.stringify({}) }),
    });
    enviando = false;
    seleccion.clear();
    await cargar().catch(() => mensaje("No se pudo actualizar la lista.", "error"));
    if (r.ok) toast(r.ok === 1 ? "Acta enviada correctamente." : `${r.ok} actas enviadas correctamente.`, "ok");
  };

  // Un acta: vista previa + confirmación (con opción de corregir) en un solo modal.
  const revisarUno = async (acta: Acta) => {
    if (enviando) return;
    const r = await revisarYEnviar(acta);
    await cargar().catch(() => {});
    if (r.enviada) mensaje(`Acta #${acta.numero} enviada correctamente a ${r.acta.paciente.correo}.`, "ok");
  };

  // ---------- Eventos ----------
  main.addEventListener("click", async (e) => {
    const t = e.target as HTMLElement;
    const tabBtn = t.closest<HTMLElement>("[data-tab]");
    if (tabBtn) {
      pestana = tabBtn.dataset.tab as Pestana;
      animarLista = true;
      seleccion.clear();
      mensaje("");
      return pintar();
    }
    if (t.closest("#enviar-sel")) {
      const lote = pendientes.filter((a) => seleccion.has(a.id) && !problema(a));
      if (lote.length === 1) return void revisarUno(lote[0]);
      if (!(await confirmarLote(lote))) return;
      return void enviarLote(lote);
    }
    const filaEl = t.closest<HTMLElement>("[data-id]");
    const btn = t.closest("button");
    if (!filaEl || !btn) return;
    const acta = [...pendientes, ...enviadas, ...devueltas, ...anuladas].find((a) => a.id === filaEl.dataset.id)!;
    if (btn.hasAttribute("data-pdf")) {
      try {
        await abrirPdf(acta.id);
      } catch (err) {
        mensaje(err instanceof ApiError ? err.message : "No se pudo abrir el PDF", "error");
      }
    } else if (btn.hasAttribute("data-enviar")) {
      void revisarUno(acta);
    } else if (btn.hasAttribute("data-devolver")) {
      void devolver(acta);
    } else if (btn.hasAttribute("data-anular")) {
      void anular(acta);
    }
  });

  main.addEventListener("change", (e) => {
    const t = e.target as HTMLInputElement;
    if (t.id === "sel-todas") {
      const enviables = visibles().filter((a) => !problema(a));
      enviables.forEach((a) => (t.checked ? seleccion.add(a.id) : seleccion.delete(a.id)));
      return pintar();
    }
    if (t.hasAttribute("data-sel")) {
      const id = t.closest<HTMLElement>("[data-id]")!.dataset.id!;
      t.checked ? seleccion.add(id) : seleccion.delete(id);
      pintar();
    }
  });

  $<HTMLInputElement>("buscar").addEventListener("input", (e) => {
    filtro = (e.target as HTMLInputElement).value;
    pintar();
  });

  await cargar().catch(() => mensaje("No se pudo cargar la lista. Revisa que el backend esté encendido.", "error"));
}
