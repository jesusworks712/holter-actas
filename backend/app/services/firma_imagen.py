"""Prepara la imagen de una firma cargada desde un archivo o dibujada: fondo transparente, recortada y liviana."""
import base64
import binascii
import io

from fastapi import HTTPException, status
from PIL import Image, ImageChops, ImageOps, UnidentifiedImageError

MAX_ENTRADA = 6 * 1024 * 1024


def _error(msg: str):
    return HTTPException(status.HTTP_400_BAD_REQUEST, msg)


def normalizar_firma(imagen: str) -> bytes:
    if imagen.startswith("data:"):
        imagen = imagen.split(",", 1)[-1]
    try:
        crudo = base64.b64decode(imagen, validate=True)
    except (binascii.Error, ValueError):
        raise _error("La imagen de la firma no es válida")
    if len(crudo) > MAX_ENTRADA:
        raise _error("La imagen pesa más de 6 MB")
    try:
        img = Image.open(io.BytesIO(crudo))
        img.load()
    except (UnidentifiedImageError, OSError):
        raise _error("El archivo no es una imagen válida (usa PNG, JPG o WEBP)")

    img = ImageOps.exif_transpose(img).convert("RGBA")
    r, g, b, a = img.split()
    if a.getextrema()[0] == 255:  # sin transparencia (foto o escaneo): el blanco pasa a ser transparente
        minimo = ImageChops.darker(ImageChops.darker(r, g), b)
        a = minimo.point(lambda v: 0 if v > 225 else 255)
        img.putalpha(a)

    caja = img.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()
    if not caja:
        raise _error("No se ve ninguna firma en la imagen")
    margen = 6
    caja = (max(caja[0] - margen, 0), max(caja[1] - margen, 0),
            min(caja[2] + margen, img.width), min(caja[3] + margen, img.height))
    img = img.crop(caja)
    if img.width > 700:
        img = img.resize((700, max(1, round(img.height * 700 / img.width))), Image.LANCZOS)

    salida = io.BytesIO()
    img.save(salida, "PNG", optimize=True)
    return salida.getvalue()
