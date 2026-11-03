import { esc } from "../utils";
import { aislarFondo } from "../ui";
import { crearLienzo } from "./lienzo";

export interface FirmaResultado {
  nombre: string;
  documento: string;
  imagen: string; // data:image/png;base64,...
}

// Modal con un lienzo para firmar con el mouse, el dedo o un lápiz. Devuelve null si cancelan.
export function pedirFirma(opts: {
  titulo: string;
  nombre?: string;
  documento?: string;
  pedirDatos?: boolean; // true: el firmante escribe nombre y documento
}): Promise<FirmaResultado | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50";
    overlay.innerHTML = `
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-3">
        <h3 class="font-semibold text-lg">${esc(opts.titulo)}</h3>
        ${
          opts.pedirDatos
            ? `<div class="grid grid-cols-2 gap-2">
                <input id="f-nombre" placeholder="Nombre" value="${esc(opts.nombre)}" class="border border-slate-300 rounded-lg px-3 py-2" />
                <input id="f-doc" placeholder="Documento" value="${esc(opts.documento)}" class="border border-slate-300 rounded-lg px-3 py-2" />
              </div>`
            : ""
        }
        <canvas id="lienzo" style="height:11rem"
          class="w-full border-2 border-dashed border-slate-300 rounded-lg bg-white touch-none cursor-crosshair"></canvas>
        <p id="f-error" class="text-sm text-red-600 hidden"></p>
        <div class="flex justify-between">
          <button id="f-limpiar" class="text-sm text-slate-600 hover:underline">Borrar</button>
          <div class="flex gap-2">
            <button id="f-cancelar" class="bg-slate-200 hover:bg-slate-300 rounded-lg px-4 py-2">Cancelar</button>
            <button id="f-ok" class="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2">Aceptar firma</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const liberar = aislarFondo(overlay);

    const q = <T extends HTMLElement>(id: string) => overlay.querySelector<T>(`#${id}`)!;
    const lienzo = crearLienzo(q<HTMLCanvasElement>("lienzo"));

    const cerrar = (r: FirmaResultado | null) => {
      liberar();
      overlay.remove();
      resolve(r);
    };
    q("f-limpiar").addEventListener("click", () => {
      lienzo.limpiar();
    });
    q("f-cancelar").addEventListener("click", () => cerrar(null));
    q("f-ok").addEventListener("click", () => {
      const err = q("f-error");
      const nombre = opts.pedirDatos ? q<HTMLInputElement>("f-nombre").value.trim() : (opts.nombre ?? "");
      const documento = opts.pedirDatos ? q<HTMLInputElement>("f-doc").value.trim() : (opts.documento ?? "");
      if (lienzo.vacio()) {
        err.textContent = "Dibuja la firma antes de aceptar.";
        err.classList.remove("hidden");
        return;
      }
      if (opts.pedirDatos && (!nombre || !documento)) {
        err.textContent = "Escribe nombre y documento.";
        err.classList.remove("hidden");
        return;
      }
      cerrar({ nombre, documento, imagen: lienzo.aPng() });
    });
  });
}