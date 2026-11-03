// Evita que texto de la base de datos se interprete como HTML.
export function esc(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

export const fechaLarga = (d: Date) =>
  d.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });