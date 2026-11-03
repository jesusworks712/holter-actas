import { ApiError, login } from "../api";
import { toast } from "../ui";

const ico = (d: string, cls = "w-5 h-5") =>
  `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
const I = {
  usuario: ico("M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8"),
  candado: ico("M7 11V8a5 5 0 0110 0v3M5 11h14v10H5zM12 15v2"),
  ojo: ico("M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6"),
  ojoOff: ico("M3 3l18 18M10.6 5.1A9.7 9.7 0 0112 5c6.4 0 10 7 10 7a17 17 0 01-3.2 4M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1M9.9 9.9a3 3 0 004.2 4.2"),
  escudo: ico("M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4", "w-6 h-6"),
  rayo: ico("M13 2L4 14h7l-1 8 9-12h-7l1-8z", "w-6 h-6"),
  nube: ico("M7 18a4.5 4.5 0 01-.6-8.96A6 6 0 0118 10a4 4 0 010 8H7z", "w-6 h-6"),
  entrar: ico("M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3", "w-[18px] h-[18px]"),
  escudoMini: ico("M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4", "w-3.5 h-3.5"),
};

const RECORDAR = "login-usuario";
const guardado = () => { try { return localStorage.getItem(RECORDAR) ?? ""; } catch { return ""; } };

const caracteristica = (icono: string, titulo: string, texto: string) => `
  <div class="flex items-start gap-3 min-w-0">
    <div class="w-12 h-12 xl:w-14 xl:h-14 rounded-xl bg-white/10 ring-1 ring-inset ring-white/15 text-white flex items-center justify-center shrink-0">${icono}</div>
    <div><p class="font-medium text-white leading-tight">${titulo}</p><p class="text-xs text-blue-100/80 mt-1 leading-snug">${texto}</p></div>
  </div>`;

export function renderLogin(root: HTMLElement, onSuccess: () => void) {
  const usuarioGuardado = guardado();
  root.innerHTML = `
    <div class="login min-h-screen lg:grid lg:grid-cols-[54fr_46fr]">
      <section class="login-izq hidden lg:flex relative overflow-hidden text-white flex-col justify-between px-[8%] py-12">
        <div class="login-foto" aria-hidden="true"></div>
        <img src="/logo-blanco.png" alt="IPS Nueva Popayán · Rehabilitar" class="relative w-60 h-auto" />
        <div class="relative login-entrada">
          <p class="text-xs font-medium tracking-[.28em] uppercase text-blue-300">Bienvenido al sistema</p>
          <h1 class="mt-4 text-[2.6rem] xl:text-5xl font-bold leading-[1.12] tracking-tight">Préstamo de equipos<br />de <span class="text-blue-300">cardiología</span></h1>
          <p class="mt-5 max-w-md text-[15px] leading-relaxed text-blue-50/90">Registro de entrega de Holter y MAPA con firma digital, envío del acta por correo y control de devoluciones.</p>
          <div class="mt-10 flex flex-wrap 2xl:flex-nowrap gap-x-6 gap-y-6 2xl:gap-x-9 max-w-sm 2xl:max-w-none">
            ${caracteristica(I.escudo, "Seguro", "Tu información<br />protegida")}
            ${caracteristica(I.rayo, "Rápido", "Procesos más<br />ágiles")}
            ${caracteristica(I.nube, "Digital", "Sin papeles,<br />sin complicaciones")}
          </div>
        </div>
        <p class="relative flex items-center gap-3 text-xs text-blue-100/90"><span class="h-px w-12 bg-blue-400"></span>IPS Nueva Popayán - Rehabilitar</p>
      </section>

      <section class="login-der relative overflow-hidden min-h-screen flex items-center justify-center p-5 sm:p-8">
        <div class="absolute -right-40 top-[42%] w-[30rem] h-[30rem] rounded-full bg-blue-100/50" aria-hidden="true"></div>
        <div class="absolute -right-32 -bottom-40 w-[26rem] h-[26rem] rounded-full bg-gradient-to-br from-blue-600 to-blue-800 opacity-95 hidden sm:block" aria-hidden="true"></div>
        <p class="login-tag absolute top-12 right-12 text-right text-[11px] font-medium tracking-[.22em] uppercase text-slate-500 leading-relaxed">Tecnología al servicio<br />de tu salud<span class="block h-0.5 w-20 bg-blue-600 mt-2 ml-auto"></span></p>

        <form id="form" class="login-tarjeta relative w-full max-w-[500px] bg-white rounded-[20px] border border-slate-100 px-6 py-8 sm:px-10 sm:py-10" novalidate>
          <img src="/logo.png" alt="IPS Nueva Popayán" class="h-24 w-auto mx-auto" />
          <h2 class="mt-5 text-[1.7rem] font-bold tracking-tight text-slate-900">Iniciar sesión</h2>
          <p class="mt-2 text-sm leading-relaxed text-slate-500">Ingresa con tu usuario y contraseña para acceder al sistema de préstamo de equipos de cardiología.</p>

          <div class="mt-6">
            <label class="flex items-center gap-2 text-[13px] font-medium text-slate-800 mb-2" for="username"><span class="text-blue-600">${I.usuario.replace("w-5 h-5", "w-4 h-4")}</span>Usuario</label>
            <input id="username" required autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Ingresa tu usuario" value="${usuarioGuardado.replace(/"/g, "&quot;")}"
              class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white text-slate-900" />
          </div>
          <div class="mt-5">
            <label class="flex items-center gap-2 text-[13px] font-medium text-slate-800 mb-2" for="password"><span class="text-blue-600">${I.candado.replace("w-5 h-5", "w-4 h-4")}</span>Contraseña</label>
            <div class="relative">
              <input id="password" type="password" required autocomplete="current-password" placeholder="Ingresa tu contraseña"
                class="w-full border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm bg-white text-slate-900" />
              <button type="button" id="ver" class="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-slate-50" aria-label="Mostrar contraseña" aria-pressed="false">${I.ojo}</button>
            </div>
          </div>

          <div class="mt-5 flex items-center justify-between gap-3 flex-wrap">
            <label class="flex items-center gap-2.5 text-[13px] font-medium text-slate-700 cursor-pointer select-none"><input id="recordar" type="checkbox" class="login-check" ${usuarioGuardado ? "checked" : ""} />Recordar mi usuario</label>
            <button type="button" id="olvido" class="text-[13px] font-medium text-blue-700 hover:text-blue-600 hover:underline">¿Olvidaste tu contraseña?</button>
          </div>

          <p id="error" role="alert" class="mt-5 text-sm text-red-700 bg-red-50 ring-1 ring-inset ring-red-600/20 rounded-xl px-4 py-2.5 hidden"></p>
          <button id="btn" class="login-btn mt-6 w-full flex items-center justify-center gap-2.5 text-white font-medium rounded-xl py-3.5 text-[15px]">${I.entrar}<span id="btn-texto">Ingresar</span></button>

          <p class="mt-7 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">${I.escudoMini}Sistema seguro y confidencial</p>
        </form>
      </section>
    </div>`;

  const form = root.querySelector<HTMLFormElement>("#form")!;
  const error = root.querySelector<HTMLElement>("#error")!;
  const btn = root.querySelector<HTMLButtonElement>("#btn")!;
  const texto = root.querySelector<HTMLElement>("#btn-texto")!;
  const inUsuario = root.querySelector<HTMLInputElement>("#username")!;
  const inClave = root.querySelector<HTMLInputElement>("#password")!;
  const ver = root.querySelector<HTMLButtonElement>("#ver")!;

  const mostrarError = (msg: string) => {
    error.textContent = msg;
    error.classList.remove("hidden");
  };

  // Mostrar / ocultar contraseña
  ver.addEventListener("click", () => {
    const visible = inClave.type === "text";
    inClave.type = visible ? "password" : "text";
    ver.innerHTML = visible ? I.ojo : I.ojoOff;
    ver.setAttribute("aria-label", visible ? "Mostrar contraseña" : "Ocultar contraseña");
    ver.setAttribute("aria-pressed", String(!visible));
  });

  // No existe un flujo automático de recuperación: se orienta al usuario.
  root.querySelector("#olvido")!.addEventListener("click", () =>
    toast("Para restablecer tu contraseña, solicítalo a un administrador del sistema.", "info", 6000),
  );

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    error.classList.add("hidden");
    const username = inUsuario.value.trim();
    const password = inClave.value;
    if (!username || !password) return mostrarError("Ingresa tu usuario y tu contraseña.");
    btn.disabled = true;
    texto.textContent = "Ingresando…";
    try {
      await login(username, password);
      try {
        if (root.querySelector<HTMLInputElement>("#recordar")!.checked) localStorage.setItem(RECORDAR, username);
        else localStorage.removeItem(RECORDAR);
      } catch { /* almacenamiento no disponible: se ignora */ }
      onSuccess();
    } catch (err) {
      mostrarError(err instanceof ApiError ? err.message : "No se pudo conectar con el servidor");
      btn.disabled = false;
      texto.textContent = "Ingresar";
    }
  });
}
