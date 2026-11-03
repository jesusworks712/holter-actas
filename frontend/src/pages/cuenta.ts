import { api, ApiError, imagenProtegidaUrl, Usuario } from "../api";
import { esc } from "../utils";
import { BTN, BTN_PRIMARIO, BTN_SECUNDARIO, icono, INPUT, LABEL, toast } from "../ui";
import { crearLienzo } from "./lienzo";

// Mi cuenta: firma guardada (se carga sola en cada acta) y cambio de contraseña.
// Si el cambio de contraseña es obligatorio (primer ingreso o clave restablecida) solo se muestra ese formulario.
export function renderCuenta(contenedor: HTMLElement, user: Usuario, alTerminar: () => void, obligatorio = false) {
  contenedor.innerHTML = `
    <div class="${obligatorio ? "max-w-md" : "max-w-3xl"} mx-auto space-y-6 escalonado">
      ${obligatorio ? "" : seccionFirma(user)}
      <form id="form" class="bg-white rounded-2xl shadow p-7 space-y-4 ${obligatorio ? "" : "max-w-xl"}">
        <div>
          <h2 class="text-xl font-semibold text-slate-900">${obligatorio ? "Crea tu contraseña" : "Cambiar contraseña"}</h2>
          <p class="text-sm text-slate-500">${
            obligatorio
              ? "Por seguridad debes cambiar la contraseña temporal antes de continuar."
              : `Usuario: <b>${esc(user.username)}</b> · ${esc(user.nombre)}`
          }</p>
        </div>
        <div><label class="${LABEL}">Contraseña actual</label><input id="actual" type="password" required autocomplete="current-password" class="${INPUT}" /></div>
        <div><label class="${LABEL}">Nueva contraseña (mínimo 8 caracteres)</label><input id="nueva" type="password" required minlength="8" autocomplete="new-password" class="${INPUT}" /></div>
        <div><label class="${LABEL}">Repite la nueva contraseña</label><input id="repite" type="password" required autocomplete="new-password" class="${INPUT}" /></div>
        <p id="msg" class="text-sm hidden"></p>
        <button id="guardar" class="${BTN_PRIMARIO} w-full">Cambiar contraseña</button>
      </form>
    </div>`;

  const q = <T extends HTMLElement>(id: string) => contenedor.querySelector<T>(`#${id}`)!;
  const mensaje = (t: string, ok = false) => {
    q("msg").textContent = t;
    q("msg").className = `text-sm ${ok ? "text-green-700" : "text-red-600"}`;
  };

  q<HTMLFormElement>("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const actual = q<HTMLInputElement>("actual").value;
    const nueva = q<HTMLInputElement>("nueva").value;
    if (nueva.length < 8) return mensaje("La nueva contraseña debe tener al menos 8 caracteres.");
    if (nueva !== q<HTMLInputElement>("repite").value) return mensaje("Las contraseñas nuevas no coinciden.");
    if (nueva === actual) return mensaje("La nueva contraseña debe ser distinta de la actual.");
    q<HTMLButtonElement>("guardar").disabled = true;
    try {
      await api("/auth/cambiar-password", { method: "POST", body: JSON.stringify({ password_actual: actual, password_nueva: nueva }) });
      mensaje("Contraseña actualizada.", true);
      toast("Contraseña actualizada.", "ok");
      q<HTMLFormElement>("form").reset();
      setTimeout(alTerminar, obligatorio ? 600 : 1200);
    } catch (err) {
      mensaje(err instanceof ApiError ? err.message : "No se pudo cambiar la contraseña");
    }
    q<HTMLButtonElement>("guardar").disabled = false;
  });

  if (!obligatorio) iniciarFirma(contenedor, user);
}

function seccionFirma(user: Usuario) {
  return `
    <section class="bg-white rounded-2xl shadow p-7 space-y-5">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">${icono.firma}</div>
        <div><h2 class="text-xl font-semibold text-slate-900">Mi firma digital</h2>
          <p class="text-sm text-slate-500">Guárdala una vez y se cargará sola en cada acta que diligencies.</p></div>
      </div>

      <div class="grid md:grid-cols-[1fr_auto] gap-4 items-end">
        <div><label class="${LABEL}">Mi cédula (sale bajo la firma en el acta)</label>
          <input id="f-doc" class="${INPUT}" value="${esc(user.documento)}" placeholder="Ej: 25555111" maxlength="30" /></div>
        <button id="f-doc-guardar" class="${BTN_SECUNDARIO}">Guardar cédula</button>
      </div>

      <div>
        <p class="${LABEL}">Firma guardada</p>
        <div id="f-actual" class="h-28 rounded-xl border border-slate-200 flex items-center justify-center text-sm text-slate-400"
          style="background-image:linear-gradient(45deg,#f1f5f9 25%,transparent 25%,transparent 75%,#f1f5f9 75%),linear-gradient(45deg,#f1f5f9 25%,transparent 25%,transparent 75%,#f1f5f9 75%);background-size:16px 16px;background-position:0 0,8px 8px">
          Cargando...</div>
      </div>

      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-1 bg-slate-100 rounded-xl p-1 text-sm font-medium max-w-sm">
          <button type="button" data-ftab="dibujar" class="rounded-lg py-2">✍️ Dibujarla</button>
          <button type="button" data-ftab="subir" class="rounded-lg py-2">🖼️ Subir imagen</button>
        </div>

        <div id="f-dibujar" class="space-y-2">
          <canvas id="f-lienzo" class="w-full max-w-xl h-40 border-2 border-dashed border-slate-300 rounded-xl bg-white cursor-crosshair"></canvas>
          <button type="button" id="f-borrar" class="text-sm text-slate-500 underline">Borrar</button>
        </div>

        <div id="f-subir" class="hidden space-y-2">
          <label class="block max-w-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 rounded-xl p-6 text-center cursor-pointer transition">
            <input id="f-archivo" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" />
            <span id="f-archivo-texto" class="text-sm text-slate-500">Haz clic para elegir una foto o escaneo de tu firma (PNG, JPG o WEBP, máx. 6 MB)</span>
            <img id="f-vista" class="hidden mx-auto mt-3 max-h-28" alt="Vista previa" />
          </label>
          <p class="text-xs text-slate-400">Consejo: firma con lapicero negro o azul sobre papel blanco y toma la foto con buena luz. El fondo se quita solo.</p>
        </div>

        <p id="f-msg" class="text-sm hidden"></p>
        <div class="flex gap-2 flex-wrap">
          <button id="f-guardar" class="${BTN_PRIMARIO}">Guardar mi firma</button>
          <button id="f-quitar" class="${BTN} bg-red-50 hover:bg-red-100 text-red-700 hidden">Eliminar firma guardada</button>
        </div>
      </div>
    </section>`;
}

function iniciarFirma(c: HTMLElement, user: Usuario) {
  const q = <T extends HTMLElement>(id: string) => c.querySelector<T>(`#${id}`)!;
  let modo: "dibujar" | "subir" = "dibujar";
  let archivo: string | null = null; // imagen elegida (data URL)
  const lienzo = crearLienzo(q<HTMLCanvasElement>("f-lienzo"), 2.8);

  const aviso = (t: string, ok = false) => {
    q("f-msg").textContent = t;
    q("f-msg").className = `text-sm ${ok ? "text-green-700" : "text-red-600"}`;
  };

  const pintarTabs = () => {
    c.querySelectorAll<HTMLElement>("[data-ftab]").forEach((b) => {
      b.className = `rounded-lg py-2 ${b.dataset.ftab === modo ? "bg-white shadow text-blue-800" : "text-slate-500"}`;
    });
    q("f-dibujar").classList.toggle("hidden", modo !== "dibujar");
    q("f-subir").classList.toggle("hidden", modo !== "subir");
    if (modo === "dibujar") lienzo.ajustar();
  };
  pintarTabs();
  c.querySelectorAll<HTMLElement>("[data-ftab]").forEach((b) =>
    b.addEventListener("click", () => {
      modo = b.dataset.ftab as typeof modo;
      pintarTabs();
    }),
  );

  const mostrarActual = async () => {
    const caja = q("f-actual");
    try {
      const url = await imagenProtegidaUrl("/perfil/firma.png");
      caja.innerHTML = `<img src="${url}?t=${Date.now()}" class="max-h-24 anillo-exito" alt="Mi firma" />`;
      q("f-quitar").classList.remove("hidden");
    } catch {
      caja.textContent = "Aún no has guardado tu firma.";
      q("f-quitar").classList.add("hidden");
    }
  };
  mostrarActual();

  q("f-borrar").addEventListener("click", () => lienzo.limpiar());

  q<HTMLInputElement>("f-archivo").addEventListener("change", (e) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) return aviso("El archivo debe ser PNG, JPG o WEBP.");
    if (f.size > 6 * 1024 * 1024) return aviso("La imagen pesa más de 6 MB.");
    const lector = new FileReader();
    lector.onload = () => {
      archivo = String(lector.result);
      q<HTMLImageElement>("f-vista").src = archivo;
      q("f-vista").classList.remove("hidden");
      q("f-archivo-texto").textContent = f.name;
      aviso("");
    };
    lector.readAsDataURL(f);
  });

  q("f-doc-guardar").addEventListener("click", async () => {
    const documento = q<HTMLInputElement>("f-doc").value.trim();
    if (documento.length < 3) return aviso("Escribe tu número de cédula.");
    try {
      await api("/perfil/documento", { method: "PUT", body: JSON.stringify({ documento }) });
      user.documento = documento;
      aviso("");
      toast("Cédula guardada.", "ok");
    } catch (e) {
      aviso(e instanceof ApiError ? e.message : "No se pudo guardar la cédula");
    }
  });

  q("f-guardar").addEventListener("click", async () => {
    let imagen: string | null;
    if (modo === "dibujar") {
      if (lienzo.vacio()) return aviso("Dibuja tu firma en el recuadro.");
      imagen = lienzo.aPng();
    } else {
      if (!archivo) return aviso("Elige primero una imagen de tu firma.");
      imagen = archivo;
    }
    const btn = q<HTMLButtonElement>("f-guardar");
    btn.disabled = true;
    btn.textContent = "Guardando...";
    try {
      await api("/perfil/firma", { method: "PUT", body: JSON.stringify({ imagen }) });
      const doc = q<HTMLInputElement>("f-doc").value.trim();
      if (doc.length >= 3 && doc !== user.documento) {
        await api("/perfil/documento", { method: "PUT", body: JSON.stringify({ documento: doc }) });
        user.documento = doc;
      }
      user.tiene_firma = true;
      aviso("");
      toast("Firma guardada. Se cargará sola en tus próximas actas.", "ok");
      lienzo.limpiar();
      await mostrarActual();
    } catch (e) {
      aviso(e instanceof ApiError ? e.message : "No se pudo guardar la firma");
    }
    btn.disabled = false;
    btn.textContent = "Guardar mi firma";
  });

  q("f-quitar").addEventListener("click", async () => {
    if (!confirm("¿Eliminar tu firma guardada? Tendrás que firmar manualmente cada acta.")) return;
    try {
      await api("/perfil/firma", { method: "DELETE" });
      user.tiene_firma = false;
      toast("Firma eliminada.", "info");
      await mostrarActual();
    } catch (e) {
      aviso(e instanceof ApiError ? e.message : "No se pudo eliminar la firma");
    }
  });
}
