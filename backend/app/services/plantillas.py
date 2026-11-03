"""Plantilla de correo con la imagen de la IPS (azul corporativo). Solo HTML simple y estilos en línea: funciona en Gmail y Outlook."""
from html import escape


def correo_html(titulo: str, cuerpo: str) -> str:
    """cuerpo: HTML ya escapado por quien lo arma."""
    return f"""<!doctype html>
<html lang="es"><body style="margin:0;padding:0;background:#f0f4fa;font-family:Segoe UI,Arial,sans-serif;color:#1e293b;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4fa;padding:24px 0;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e3eaf5;">
<tr><td style="background:#132b5f;padding:20px 28px;color:#ffffff;">
<div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#bcd2fb;">IPS Nueva Popayán · Rehabilitar</div>
<div style="font-size:20px;font-weight:600;margin-top:4px;">{escape(titulo)}</div></td></tr>
<tr><td style="padding:26px 28px;font-size:15px;line-height:1.55;">{cuerpo}</td></tr>
<tr><td style="padding:16px 28px;background:#f7f9fd;font-size:12px;color:#64748b;border-top:1px solid #e3eaf5;">
Este es un mensaje automático del servicio de préstamo de equipos de cardiología. Si tiene dudas, comuníquese con la IPS.</td></tr>
</table></td></tr></table></body></html>"""


def tabla(filas: list[tuple[str, str]]) -> str:
    """Pares (etiqueta, valor) ya escapados."""
    celdas = "".join(
        f'<tr><td style="padding:6px 10px;color:#64748b;white-space:nowrap;">{k}</td>'
        f'<td style="padding:6px 10px;font-weight:600;">{v}</td></tr>'
        for k, v in filas
    )
    return f'<table cellpadding="0" cellspacing="0" style="background:#f0f4fa;border-radius:8px;margin:14px 0;">{celdas}</table>'
