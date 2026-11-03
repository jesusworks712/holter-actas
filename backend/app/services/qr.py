import io

import qrcode
from qrcode.constants import ERROR_CORRECT_M


def qr_png(texto: str, caja: int = 8) -> bytes:
    qr = qrcode.QRCode(error_correction=ERROR_CORRECT_M, box_size=caja, border=3)
    qr.add_data(texto)
    qr.make(fit=True)
    buf = io.BytesIO()
    qr.make_image(fill_color="#132b5f", back_color="white").save(buf, "PNG")
    return buf.getvalue()
