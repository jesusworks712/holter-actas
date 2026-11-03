import { api, ApiError, Usuario } from "../api";
import { UsuarioAdmin } from "../types";
import { BTN, BTN_PRIMARIO, BTN_SECUNDARIO, encabezado, icono, INPUT, LABEL, modal, toast } from "../ui";
import { esc, fechaLarga } from "../utils";

const clave = () => {
  const c = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(10));
  return Array.from(bytes, (b) => c[b % c.length]).join("");
};

export async function renderUsuarios(main: HTMLElement, user: Usuario) {
  if (user.rol !== "ADMIN") {
    main.innerHTML = `<div class="bg-white rounded-2xl shadow p-8 text-center text-slate-600">Solo los administradores pueden gestionar usuarios.</div>`;
    return;
  }
  let usuarios: UsuarioAdmin[] = [];

  main.innerHTML = `
    <div class="space-y-6">
      ${encabezado("Administración", "Usuarios", "Crea cuentas para el personal y controla quién puede entrar.",
        `<button id="nuevo" class="${BTN_PRIMARIO} inline-flex items-center gap-2 !rounded-xl !px-5 !py-2.5">${icono.mas}Nuevo usuario</button>`)}
      <section class="bg-white rounded-2xl shadow p-5 space-y-3">
        <p id="msg" class="text-sm"></p>
        <div class="overflow-auto"><table class="w-full text-left text-sm">
          <thead class="text-xs uppercase text-slate-400 border-b"><tr>
            <th class="py-2 pr-3">Nombre</th><th class="pr-3">Usuario</th><th class="pr-3">Rol</th><th class="pr-3">Estado</th><th class="pr-3">Último acceso</th><th></th></tr></thead>
          <tbody id="filas" class="divide-y"></tbody></table></div>
      </section>
    </div>`;
  const $ = <T extends HTMLElement>(id: string) => main.querySelector<T>(`#${id}`)!;
  const mensaje = (t: string, error = false) => {
    if (t) toast(t, error ? "error" : "ok");
    $("msg").textContent = t;
    $("msg").className = `text-sm ${error ? "text-red-600" : "text-green-700 font-medium"}`;
  };

  const cargar = async () => {
    usuarios = await api<UsuarioAdmin[]>("/usuarios");
    $("filas").innerHTML = usuarios
      .map(
        (u) => `<tr data-id="${u.id}" class="${u.activo ? "" : "opacity-50"}">
          <td class="py-3 pr-3"><p class="font-medium text-slate-800">${esc(u.nombre)}</p><p class="text-xs text-slate-400">${esc(u.email)}</p></td>
          <td class="pr-3">${esc(u.username)}</td>
          <td class="pr-3"><span class="text-xs px-2 py-0.5 rounded-full ${u.rol === "ADMIN" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}">${u.rol === "ADMIN" ? "Administrador" : "Operador"}</span></td>
          <td class="pr-3"><span class="text-xs px-2 py-0.5 rounded-full ${u.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}">${u.activo ? "Activo" : "Inactivo"}</span>
            ${u.debe_cambiar_password ? `<span class="ml-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Contraseña temporal</span>` : ""}</td>
          <td class="pr-3 text-slate-500 whitespace-nowrap">${u.ultimo_login ? fechaLarga(new Date(u.ultimo_login)) : "Nunca"}</td>
          <td class="text-right whitespace-nowrap">
            <button data-editar class="${BTN} !px-3 !py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700">Editar</button>
            <button data-reset class="${BTN} !px-3 !py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800">Restablecer clave</button></td></tr>`,
      )
      .join("");
  };

  const formulario = (u?: UsuarioAdmin) => {
    const m = modal(
      `<form class="p-6 space-y-4">
        <h3 class="text-lg font-semibold text-slate-900">${u ? "Editar usuario" : "Nuevo usuario"}</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2"><label class="${LABEL}">Nombre completo *</label><input id="u-nombre" required class="${INPUT}" value="${esc(u?.nombre)}" /></div>
          <div><label class="${LABEL}">Usuario *</label><input id="u-user" required ${u ? "disabled" : ""} pattern="[A-Za-z0-9._-]{3,50}" class="${INPUT}" value="${esc(u?.username)}" placeholder="ej: laura.perez" /></div>
          <div><label class="${LABEL}">Rol</label><select id="u-rol" class="${INPUT}">
            <option value="OPERADOR" ${u?.rol === "OPERADOR" ? "selected" : ""}>Operador (enfermería)</option>
            <option value="ADMIN" ${u?.rol === "ADMIN" ? "selected" : ""}>Administrador</option></select></div>
          <div class="col-span-2"><label class="${LABEL}">Correo</label><input id="u-email" type="email" class="${INPUT}" value="${esc(u?.email)}" /></div>
          ${
            u
              ? `<label class="col-span-2 flex items-center gap-2 text-sm"><input id="u-activo" type="checkbox" class="w-4 h-4" ${u.activo ? "checked" : ""} /> Usuario activo (puede iniciar sesión)</label>`
              : `<div class="col-span-2"><label class="${LABEL}">Contraseña inicial *</label>
                  <div class="flex gap-2"><input id="u-pass" required minlength="8" class="${INPUT} font-mono" value="${clave()}" />
                  <button type="button" id="u-gen" class="${BTN_SECUNDARIO} whitespace-nowrap">Generar otra</button></div>
                  <p class="text-xs text-slate-500 mt-1">Anótala y entrégala al usuario: al ingresar deberá crear la suya.</p></div>`
          }
        </div>
        <p id="u-error" class="text-sm text-red-600 hidden"></p>
        <div class="flex justify-end gap-2">
          <button type="button" id="u-cancelar" class="${BTN_SECUNDARIO}">Cancelar</button>
          <button id="u-guardar" class="${BTN_PRIMARIO}">Guardar</button></div>
      </form>`,
    );
    m.q("#u-cancelar").addEventListener("click", m.cerrar);
    m.q("#u-gen")?.addEventListener("click", () => (m.q<HTMLInputElement>("#u-pass").value = clave()));
    m.q<HTMLFormElement>("form").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const v = (id: string) => m.q<HTMLInputElement>(id).value.trim();
      const btn = m.q<HTMLButtonElement>("#u-guardar");
      btn.disabled = true;
      try {
        if (u) {
          await api(`/usuarios/${u.id}`, {
            method: "PUT",
            body: JSON.stringify({ nombre: v("#u-nombre"), email: v("#u-email") || null, rol: v("#u-rol"), activo: m.q<HTMLInputElement>("#u-activo").checked }),
          });
        } else {
          await api("/usuarios", {
            method: "POST",
            body: JSON.stringify({ nombre: v("#u-nombre"), username: v("#u-user"), email: v("#u-email") || null, rol: v("#u-rol"), password: v("#u-pass") }),
          });
        }
        m.cerrar();
        await cargar();
        mensaje(u ? "Usuario actualizado." : "Usuario creado. Entrégale su contraseña inicial.");
      } catch (e) {
        m.q("#u-error").textContent = e instanceof ApiError ? e.message : "No se pudo guardar";
        m.q("#u-error").classList.remove("hidden");
        btn.disabled = false;
      }
    });
  };

  const restablecer = (u: UsuarioAdmin) => {
    const m = modal(
      `<div class="p-6 space-y-4">
        <h3 class="text-lg font-semibold text-slate-900">Restablecer contraseña</h3>
        <p id="r-texto" class="text-sm text-slate-600">Se generará una contraseña temporal para <b>${esc(u.nombre)}</b>. La actual dejará de funcionar y deberá crear una nueva al ingresar.</p>
        <div id="r-clave" class="hidden bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p class="text-xs text-slate-500 mb-1">Contraseña temporal (se muestra una sola vez)</p>
          <p id="r-valor" class="font-mono text-xl font-semibold text-blue-900 select-all"></p>
          <button id="r-copiar" class="mt-2 text-sm text-blue-700 hover:underline">Copiar</button>
        </div>
        <p id="r-error" class="text-sm text-red-600 hidden"></p>
        <div class="flex justify-end gap-2">
          <button id="r-no" class="${BTN_SECUNDARIO}">Cerrar</button>
          <button id="r-si" class="${BTN_PRIMARIO}">Generar contraseña</button>
        </div>
      </div>`,
    );
    m.q("#r-no").addEventListener("click", m.cerrar);
    m.q("#r-si").addEventListener("click", async () => {
      try {
        const r = await api<{ password_temporal: string }>(`/usuarios/${u.id}/reset-password`, { method: "POST" });
        m.q("#r-valor").textContent = r.password_temporal;
        m.q("#r-clave").classList.remove("hidden");
        m.q("#r-si").classList.add("hidden");
        await cargar();
      } catch (e) {
        m.q("#r-error").textContent = e instanceof ApiError ? e.message : "No se pudo restablecer";
        m.q("#r-error").classList.remove("hidden");
      }
    });
    m.q("#r-copiar").addEventListener("click", () => {
      navigator.clipboard?.writeText(m.q("#r-valor").textContent ?? "");
      m.q("#r-copiar").textContent = "Copiada ✔";
    });
  };

  $("nuevo").addEventListener("click", () => formulario());
  $("filas").addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const u = usuarios.find((x) => x.id === t.closest<HTMLElement>("[data-id]")?.dataset.id);
    if (!u) return;
    if (t.closest("[data-editar]")) formulario(u);
    else if (t.closest("[data-reset]")) restablecer(u);
  });

  await cargar().catch(() => mensaje("No se pudo cargar los usuarios.", true));
}
