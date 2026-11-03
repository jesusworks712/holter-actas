import "./style.css";
import { getToken, me } from "./api";
import { renderActaForm } from "./pages/acta-form";
import { renderAuditoria } from "./pages/auditoria";
import { renderCuenta } from "./pages/cuenta";
import { renderEquipoDetalle } from "./pages/equipo-detalle";
import { renderEquipos } from "./pages/equipos";
import { renderFirmaPublica } from "./pages/firma-publica";
import { renderPacientes } from "./pages/pacientes";
import { renderHome } from "./pages/home";
import { renderLogin } from "./pages/login";
import { renderReportes } from "./pages/reportes";
import { renderShell } from "./pages/shell";
import { renderUsuarios } from "./pages/usuarios";
import { renderVencidas } from "./pages/vencidas";

const root = document.getElementById("app")!;

async function render() {
  const ruta = location.hash || "#/";
  const base = ruta.split("?")[0];

  // Firma desde el celular del paciente: no requiere iniciar sesión (el enlace es de un solo uso).
  if (base.startsWith("#/firmar/")) return renderFirmaPublica(root, base.slice("#/firmar/".length));

  if (!getToken()) return renderLogin(root, render);
  try {
    const user = await me();

    // Contraseña temporal: hay que cambiarla antes de usar el sistema.
    if (user.debe_cambiar_password) {
      root.innerHTML = `<div class="min-h-screen flex items-center p-4"><div id="forzado" class="w-full"></div></div>`;
      return renderCuenta(root.querySelector("#forzado")!, user, render, true);
    }

    const main = renderShell(root, user, render);
    if (base === "#/nueva") await renderActaForm(main);
    else if (base === "#/pacientes") await renderPacientes(main);
    else if (base === "#/equipos") await renderEquipos(main, user);
    else if (base.startsWith("#/equipo/")) await renderEquipoDetalle(main, base.slice("#/equipo/".length));
    else if (base === "#/usuarios") await renderUsuarios(main, user);
    else if (base === "#/reportes") await renderReportes(main, user);
    else if (base === "#/auditoria") await renderAuditoria(main, user);
    else if (base === "#/cuenta") renderCuenta(main, user, () => {});
    else if (base === "#/vencidas") await renderVencidas(main);
    else await renderHome(main);
  } catch {
    // Si el token ya no sirve, api.ts dispara "auth-changed" y se vuelve al login.
    if (getToken()) root.innerHTML = `<p class="p-6 text-red-600">No se pudo cargar. Revisa que el backend esté encendido y recarga la página.</p>`;
  }
}

window.addEventListener("auth-changed", render);
window.addEventListener("hashchange", render);
render();
