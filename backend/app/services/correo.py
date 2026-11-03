"""Envío de correos con Brevo (API v3). Solo usa la librería estándar de Python."""
import base64
import json
import smtplib
import ssl
import urllib.error
import urllib.request
from email.message import EmailMessage
from email.utils import formataddr, make_msgid

from app.core.config import settings

BREVO_URL = "https://api.brevo.com/v3/smtp/email"


class CorreoError(Exception):
    """No se pudo enviar el correo."""


def proveedor() -> str:
    """'smtp' si hay SMTP configurado (tiene prioridad); si no, 'brevo'."""
    return "smtp" if settings.SMTP_HOST else "brevo"


def correo_configurado() -> bool:
    if settings.SMTP_HOST:
        return bool(settings.SMTP_USER and settings.SMTP_PASSWORD)
    return bool(settings.BREVO_API_KEY and settings.BREVO_SENDER_EMAIL)


def _enviar_smtp(destinatario: str, nombre_destinatario: str | None, asunto: str, html: str,
                 adjunto_nombre: str | None, adjunto_bytes: bytes | None) -> str:
    msg = EmailMessage()
    msg["Subject"] = asunto
    msg["From"] = formataddr((settings.SMTP_SENDER_NAME, settings.SMTP_USER))
    msg["To"] = formataddr((nombre_destinatario or "", destinatario))
    msg["Message-ID"] = make_msgid(domain=settings.SMTP_USER.split("@")[-1])
    msg.set_content("Este mensaje está en formato HTML. Ábralo en un cliente de correo que lo soporte.")
    msg.add_alternative(html, subtype="html")
    if adjunto_bytes:
        msg.add_attachment(adjunto_bytes, maintype="application", subtype="pdf", filename=adjunto_nombre or "acta.pdf")

    clave = settings.SMTP_PASSWORD.replace(" ", "")  # Google la muestra con espacios
    try:
        if settings.SMTP_PORT == 465:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, 465, timeout=30, context=ssl.create_default_context()) as srv:
                srv.login(settings.SMTP_USER, clave)
                srv.send_message(msg)
        else:  # 587 con STARTTLS
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as srv:
                srv.starttls(context=ssl.create_default_context())
                srv.login(settings.SMTP_USER, clave)
                srv.send_message(msg)
    except smtplib.SMTPAuthenticationError:
        raise CorreoError("Gmail rechazó el usuario o la contraseña de aplicación")
    except smtplib.SMTPRecipientsRefused:
        raise CorreoError("El correo del destinatario fue rechazado")
    except (smtplib.SMTPException, OSError) as e:
        raise CorreoError(f"No se pudo enviar por SMTP: {e}")
    return msg["Message-ID"]


def enviar_correo(destinatario: str, nombre_destinatario: str | None, asunto: str, html: str,
                  adjunto_nombre: str | None = None, adjunto_bytes: bytes | None = None) -> str:
    """Envía un correo (con adjunto PDF opcional). Devuelve el id del mensaje (SMTP o Brevo)."""
    if settings.SMTP_HOST:
        return _enviar_smtp(destinatario, nombre_destinatario, asunto, html, adjunto_nombre, adjunto_bytes)
    payload = {
        "sender": {"name": settings.BREVO_SENDER_NAME, "email": settings.BREVO_SENDER_EMAIL},
        "to": [{"email": destinatario, **({"name": nombre_destinatario} if nombre_destinatario else {})}],
        "subject": asunto,
        "htmlContent": html,
    }
    if adjunto_bytes:
        payload["attachment"] = [{"name": adjunto_nombre or "acta.pdf", "content": base64.b64encode(adjunto_bytes).decode("ascii")}]
    req = urllib.request.Request(
        BREVO_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"api-key": settings.BREVO_API_KEY, "Content-Type": "application/json", "accept": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            cuerpo = json.loads(resp.read() or b"{}")
    except urllib.error.HTTPError as e:
        detalle = e.read().decode("utf-8", errors="ignore")[:300]
        raise CorreoError(f"Brevo respondió {e.code}: {detalle}")
    except (urllib.error.URLError, TimeoutError) as e:
        raise CorreoError(f"No se pudo conectar con Brevo: {e}")
    return cuerpo.get("messageId", "")