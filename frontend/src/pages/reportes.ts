import { api, ApiError, descargarArchivo, Usuario } from "../api";
import { Respaldo } from "../types";
import { BTN_PRIMARIO, BTN_SECUNDARIO, encabezado, icono, INPUT, LABEL } from "../ui";
import { esc, fechaLarga } from "../utils";

const aISO = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export async function renderReportes(main: HTMLElement, user: Usuario) {
  if (user.rol !== "ADMIN") {
    main.innerHTML = `<div class="bg-white rounded-2xl shadow p-8 text-center text-slate-600">Solo los administradores pueden generar reportes.</div>`;
    return;
  }
  const hoy = new Date();
  main.innerHTML = `
    <div class="space-y-6 max-w-2xl">
      ${encabezado("Administración", "Reportes", "Descarga en Excel los préstamos de un periodo, con vencidos y uso de cada equipo.")}
      <section class="bg-white rounded-2xl shadow p-6 space-y-5">
        <div class="flex gap-2 flex-wrap text-sm">
          <button data-rango="mes" class="${BTN_SECUNDARIO}">Este mes</button>
          <button data-rango="30" class="${BTN_SECUNDARIO}">Últimos 30 días</button>
          <button data-rango="anio" class="${BTN_SECUNDARIO}">Este año</button>
          <button data-rango="todo" class="${BTN_SECUNDARIO}">Todo</button>
        </div>
        <div class="grid sm:grid-cols-3 gap-4">
          <div><label class="${LABEL}">Desde</label><input id="desde" type="date" class="${INPUT}" value="${aISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1))}" /></div>
          <div><label class="${LABEL}">Hasta</label><input id="hasta" type="date" class="${INPUT}" value="${aISO(hoy)}" /></div>
          <div><label class="${LABEL}">Estado</label><select id="estado" class="${INPUT}">
            <option value="">Todos</option><option value="firmada">Firmadas (sin enviar)</option><option value="enviada">Enviadas</option>
            <option value="devuelta">Devueltas</option><option value="anulada">Anuladas</option></select></div>
        </div>
        <p id="msg" class="text-sm hidden"></p>
        <button id="descargar" class="${BTN_PRIMARIO} inline-flex items-center gap-2">${icono.reportes}<span>Descargar Excel</span></button>
        <p class="text-xs text-slate-400">Incluye tres hojas: Préstamos (detalle), Resumen (por estado y equipos más usados) y Equipos.</p>
      </section>
      <section class="bg-white rounded-2xl shadow p-6 space-y-4">
        <div><h3 class="font-semibold text-slate-900">Copias de seguridad</h3>
          <p class="text-sm text-slate-500">Guardan la base de datos, los PDF y las fotos en un .zip. El sistema hace una copia automática cada día; aquí puedes crear una ahora y descargarla.</p></div>
        <button id="respaldar" class="${BTN_PRIMARIO}">Crear copia ahora</button>
        <p id="r-msg" class="text-sm hidden"></p>
        <div id="r-lista" class="divide-y text-sm"></div>
        <p class="text-xs text-slate-400">Guarda una copia reciente en otro lugar (USB o nube): si el computador falla, las copias que están en él se pierden.</p>
      </section>
    </div>`;

  const $ = <T extends HTMLElement>(id: string) => main.querySelector<T>(`#${id}`)!;
  const fijar = (d: string, h: string) => {
    $<HTMLInputElement>("desde").value = d;
    $<HTMLInputElement>("hasta").value = h;
  };
  main.querySelectorAll<HTMLElement>("[data-rango]").forEach((b) =>
    b.addEventListener("click", () => {
      const r = b.dataset.rango;
      const fin = aISO(hoy);
      if (r === "mes") fijar(aISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), fin);
      else if (r === "30") fijar(aISO(new Date(hoy.getTime() - 30 * 86400000)), fin);
      else if (r === "anio") fijar(`${hoy.getFullYear()}-01-01`, fin);
      else fijar("", "");
    }),
  );

  $("descargar").addEventListener("click", async () => {
    const desde = $<HTMLInputElement>("desde").value;
    const hasta = $<HTMLInputElement>("hasta").value;
    const msg = $("msg");
    if (desde && hasta && desde > hasta) {
      msg.textContent = "La fecha «Desde» no puede ser posterior a «Hasta».";
      msg.className = "text-sm text-red-600";
      return;
    }
    const p = new URLSearchParams();
    if (desde) p.set("desde", desde);
    if (hasta) p.set("hasta", hasta);
    if ($<HTMLSelectElement>("estado").value) p.set("estado", $<HTMLSelectElement>("estado").value);
    const btn = $<HTMLButtonElement>("descargar");
    btn.disabled = true;
    try {
      await descargarArchivo(`/reportes/prestamos.xlsx?${p}`, `prestamos-${aISO(hoy)}.xlsx`);
      msg.textContent = "Reporte generado. Revisa tu carpeta de descargas.";
      msg.className = "text-sm text-green-700";
    } catch (e) {
      msg.textContent = e instanceof ApiError ? e.message : "No se pudo generar el reporte";
      msg.className = "text-sm text-red-600";
    }
    btn.disabled = false;
  });

  // ---------- Copias de seguridad ----------
  const mb = (n: number) => (n / 1048576).toFixed(n > 1048576 * 10 ? 0 : 1) + " MB";
  const cargarRespaldos = async () => {
    try {
      const r = await api<Respaldo[]>("/respaldos");
      $("r-lista").innerHTML = r.length
        ? r.map((x) => `<div class="py-2 flex items-center justify-between gap-3" data-n="${esc(x.nombre)}">
            <div><p class="font-medium text-slate-700">${esc(x.nombre)}</p><p class="text-xs text-slate-400">${fechaLarga(new Date(x.fecha))} · ${mb(x.tamano)}</p></div>
            <button data-bajar class="${BTN_SECUNDARIO} !py-1.5">Descargar</button></div>`).join("")
        : `<p class="py-3 text-slate-400">Todavía no hay copias.</p>`;
    } catch {
      $("r-lista").textContent = "No se pudo cargar la lista de copias.";
    }
  };
  const avisoR = (t: string, ok: boolean) => {
    $("r-msg").textContent = t;
    $("r-msg").className = `text-sm ${ok ? "text-green-700" : "text-red-600"}`;
  };
  $("respaldar").addEventListener("click", async () => {
    const b = $<HTMLButtonElement>("respaldar");
    b.disabled = true;
    b.textContent = "Creando copia...";
    try {
      const r = await api<{ nombre: string; metodo: string }>("/respaldos", { method: "POST" });
      avisoR(`Copia creada: ${r.nombre}.`, true);
      await cargarRespaldos();
    } catch (e) {
      avisoR(e instanceof ApiError ? e.message : "No se pudo crear la copia", false);
    }
    b.disabled = false;
    b.textContent = "Crear copia ahora";
  });
  $("r-lista").addEventListener("click", (e) => {
    const n = (e.target as HTMLElement).closest("[data-bajar]")?.closest<HTMLElement>("[data-n]")?.dataset.n;
    if (n) descargarArchivo(`/respaldos/${n}`, n).catch(() => avisoR("No se pudo descargar la copia", false));
  });
  await cargarRespaldos();
}
