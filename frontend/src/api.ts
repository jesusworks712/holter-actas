// Cliente de la API: guarda el token y envía las peticiones con autenticación.
const TOKEN_KEY = "holter_token";

// sessionStorage: al cerrar el navegador se cierra la sesión (son datos de salud).
export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => sessionStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function mensajeDeError(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    // Errores de validación (422): "campo: mensaje"
    return detail
      .map((d) => `${(d.loc ?? []).slice(1).join(".")}: ${d.msg}`)
      .join(" | ");
  }
  return "Datos inválidos";
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof URLSearchParams) && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`/api${path}`, { ...options, headers });

  if (res.status === 401 && token) {
    // Token vencido o inválido: volver al login.
    clearToken();
    window.dispatchEvent(new Event("auth-changed"));
  }
  if (!res.ok) {
    let msg = res.statusText;
    try {
      msg = mensajeDeError((await res.json()).detail);
    } catch {}
    throw new ApiError(res.status, msg);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export interface Usuario {
  id: string;
  username: string;
  nombre: string;
  email?: string | null;
  rol: string;
  debe_cambiar_password: boolean;
  documento?: string | null;
  tiene_firma?: boolean;
}

export async function login(username: string, password: string) {
  const data = await api<{ access_token: string }>("/auth/login", {
    method: "POST",
    body: new URLSearchParams({ username, password }),
  });
  setToken(data.access_token);
}

export const me = () => api<Usuario>("/auth/me");

// El PDF requiere el token, así que se descarga como archivo y se abre en otra pestaña.
export async function abrirPdf(actaId: string) {
  const res = await fetch(`/api/actas/${actaId}/pdf`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      msg = mensajeDeError((await res.json()).detail);
    } catch {}
    throw new ApiError(res.status, msg);
  }
  const url = URL.createObjectURL(await res.blob());
  window.open(url, "_blank");
}


// URL temporal del PDF para mostrarlo dentro de la página (vista previa). Quien la use debe llamar URL.revokeObjectURL.
export async function pdfBlobUrl(actaId: string): Promise<string> {
  const res = await fetch(`/api/actas/${actaId}/pdf`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      msg = mensajeDeError((await res.json()).detail);
    } catch {}
    throw new ApiError(res.status, msg);
  }
  return URL.createObjectURL(await res.blob());
}


// ---- Fotos de equipos (el <img> no puede enviar el token, así que se pide como archivo y se guarda en memoria) ----
const fotos = new Map<string, Promise<string | null>>();

export function fotoEquipoUrl(equipoId: string): Promise<string | null> {
  if (!fotos.has(equipoId)) {
    fotos.set(
      equipoId,
      fetch(`/api/equipos/${equipoId}/foto`, { headers: { Authorization: `Bearer ${getToken()}` } })
        .then(async (r) => (r.ok ? URL.createObjectURL(await r.blob()) : null))
        .catch(() => null),
    );
  }
  return fotos.get(equipoId)!;
}

export function invalidarFoto(equipoId: string) {
  fotos.delete(equipoId);
}

// Descarga un archivo protegido (Excel, etc.) con el token.
export async function descargarArchivo(path: string, nombreSugerido: string) {
  const res = await fetch(`/api${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      msg = mensajeDeError((await res.json()).detail);
    } catch {}
    throw new ApiError(res.status, msg);
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreSugerido;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}


// Imagen protegida (por ejemplo el QR de un equipo) como URL temporal.
export async function imagenProtegidaUrl(path: string): Promise<string> {
  const res = await fetch(`/api${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) throw new ApiError(res.status, "No se pudo cargar la imagen");
  return URL.createObjectURL(await res.blob());
}
