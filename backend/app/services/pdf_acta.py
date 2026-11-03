"""Genera el PDF del acta de préstamo replicando el formato oficial FO-TGB-001 (v01, 19 de agosto de 2025).

El texto legal es el del formato autorizado: no lo cambies sin una nueva versión del formato.
Lo único que se adapta es el equipo (Holter EVO o MAPA Spacelabs) y las horas (24 o 48).
"""
from datetime import datetime, timedelta, timezone
from html import escape
from io import BytesIO
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    Image, KeepTogether, ListFlowable, ListItem, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
)

COLOMBIA = timezone(timedelta(hours=-5))
LOGO = Path(__file__).resolve().parent.parent / "assets" / "logo_rehabilitar.png"

PROPIETARIO = "REHABILITAR SEDE IPS NUEVA POPAYAN"
CIUDAD = "Popayán"

NUMEROS_HORAS = {24: "veinticuatro (24)", 48: "cuarenta y ocho (48)"}

OBLIGACIONES_USUARIO = [
    "Empleará el mayor Cuidado en la conservación del {EQ} entregado por REHABILITAR, responderá por lo tanto "
    "por cualquier deterioro que no prevenga de la naturaleza o del uso normal y legítimo del Equipo. Por otra "
    "parte EL USUARIO no será responsable por caso fortuito, a menos que haya empleado el equipo en uso indebido "
    "o demore su restitución.",
    "Informar oportunamente a REHABILITAR sobre los inconvenientes técnicos presentados.",
    "Seguir las recomendaciones del manejo del equipo entregado por el personal de REHABILITAR.",
    "<b>El paciente debe permanecer en la ciudad de popayán,durante el tiempo del exámen.</b>",
    "Acudir a REHABILITAR IPS SEDE NUEVA POPAYÁN, y entregar el equipo en el tiempo estipulado.",
    "En casos de la imposibilidad de un diagnóstico, por el mal uso y desacatamiento de las indicaciones dadas, "
    "el paciente deberá pasar nuevamente a consulta, para un nuevo ordenamiento médico.",
]


def _dt(d: datetime | None) -> datetime | None:
    return d.astimezone(COLOMBIA) if d else None


def _fecha(d: datetime | None) -> str:
    d = _dt(d)
    return d.strftime("%d/%m/%Y") if d else ""


def _hora(d: datetime | None) -> str:
    d = _dt(d)
    return d.strftime("%I:%M %p").lstrip("0").lower() if d else ""


def _v(valor, minimo: int = 0) -> str:
    """Dato rellenado en el formato: negrita y subrayado, para que se distinga del texto fijo."""
    txt = escape(str(valor).strip()) if valor else ""
    if len(txt) < minimo:
        txt = txt + "&nbsp;" * (minimo - len(txt))
    return f"<u><b>{txt}</b></u>" if txt else "<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>"


def _estilos():
    base = ParagraphStyle("base", fontName="Helvetica", fontSize=9, leading=11.5)
    return {
        "base": base,
        "celda": ParagraphStyle("celda", parent=base, fontSize=8.5, leading=10),
        "celda_c": ParagraphStyle("celda_c", parent=base, fontSize=8.5, leading=10.5, alignment=TA_CENTER),
        "just": ParagraphStyle("just", parent=base, alignment=TA_JUSTIFY, spaceAfter=3),
        "titulo": ParagraphStyle("titulo", parent=base, fontName="Helvetica-Bold", spaceBefore=8, spaceAfter=4),
        "item": ParagraphStyle("item", parent=base, alignment=TA_JUSTIFY, leading=11.5),
        "firma": ParagraphStyle("firma", parent=base, fontSize=8.5, leading=10.5),
        "nota": ParagraphStyle("nota", parent=base, fontSize=7, leading=8.4, textColor=colors.HexColor("#334155")),
    }


def _encabezado(acta, est):
    ancho_logo = 4.4 * cm
    w, h = ImageReader(str(LOGO)).getSize()
    logo = Image(str(LOGO), width=ancho_logo, height=ancho_logo * h / w)
    centro = [Paragraph("FORMATO", est["celda_c"]), Spacer(1, 10),
              Paragraph("PRESTAMO EQUIPOS<br/>CARDIOLOGÍA", est["celda_c"])]
    der = [Paragraph(f"<b>CÓDIGO:</b> {escape(acta.formato_codigo)}", est["celda"]),
           Paragraph(f"<b>VERSIÓN</b>: {escape(acta.formato_version)}", est["celda"]),
           Paragraph("<b>FECHA:</b> 19 DE AGOSTO DE 2025", est["celda"])]
    # Cada dato de la derecha va en su propia celda, como en el formato original.
    t = Table(
        [[logo, centro, der[0]], ["", "", der[1]], ["", "", der[2]]],
        colWidths=[5.2 * cm, 6.3 * cm, 6.0 * cm], rowHeights=[1.1 * cm, 1.1 * cm, 1.1 * cm],
    )
    t.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.8, colors.black),
        ("LINEAFTER", (0, 0), (0, -1), 0.8, colors.black),
        ("LINEAFTER", (1, 0), (1, -1), 0.8, colors.black),
        ("LINEBELOW", (2, 0), (2, 1), 0.8, colors.black),
        ("SPAN", (0, 0), (0, 2)), ("SPAN", (1, 0), (1, 2)),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (0, 0), "CENTER"),
    ]))
    return t


def _tabla_datos(acta, snap, descripcion, est):
    pac = snap.get("paciente", {})
    telefono = pac.get("telefono") or ""
    filas = [
        ("PROPIETARIO", PROPIETARIO),
        ("DESCRIPCION DEL EQUIPO", descripcion),
        ("FECHA DE ENTREGA DEL EQUIPO", _fecha(acta.fecha_entrega)),
        ("HORA DE ENTREGA", _hora(acta.fecha_entrega)),
        ("FECHA Y HORA DE DEVOLUCION DEL EQUIPO",
         f"{_fecha(acta.fecha_devolucion_prevista)} {_hora(acta.fecha_devolucion_prevista)}".strip()),
        ("ASEGURADORA Y RÉGIMEN",
         " - ".join(x for x in (snap.get("aseguradora"), snap.get("regimen")) if x)),
        ("TELÉFONO DEL PACIENTE", telefono),   # ← nuevo: visible en el acta impresa
    ]
    datos = [[Paragraph(k, est["celda"]), Paragraph(escape(v), est["celda"])] for k, v in filas]
    t = Table(datos, colWidths=[8.0 * cm, 9.5 * cm], rowHeights=0.62 * cm)
    t.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.8, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 1), ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    return t


def _bloque_firma(firma, titulo, documento, est):
    """Firma dibujada, línea, cargo y cédula (como en el formato: 'cc____').

    Si el paciente no puede firmar se deja constancia del motivo en el espacio de la firma y,
    si lo hay, quién firma a su ruego.
    """
    arriba = []
    if firma and getattr(firma, "motivo_no_firma", None):
        motivo = escape(firma.motivo_no_firma[:260])
        arriba.append(Paragraph(f"<b>El usuario no puede firmar.</b> Motivo: {motivo}", est["nota"]))
    if firma and firma.imagen_png:
        img = ImageReader(BytesIO(firma.imagen_png))
        w, h = img.getSize()
        alto = 1.5 * cm if arriba else 2.2 * cm
        escala = min(6.0 * cm / w, alto / h)
        arriba.append(Image(BytesIO(firma.imagen_png), width=w * escala, height=h * escala))
    if not arriba:
        arriba = [Spacer(1, 2.2 * cm)]

    nombre = escape(firma.firmante_nombre) if firma and firma.firmante_nombre else ""
    cc = escape(documento or "")
    lineas = [Paragraph(f"{titulo}" + (f"<br/>{nombre}" if nombre else ""), est["firma"])]
    if firma and getattr(firma, "responsable_nombre", None):
        doc_resp = f" — cc {escape(firma.responsable_documento)}" if firma.responsable_documento else ""
        lineas.append(Paragraph(f"Firma a ruego / responsable: {escape(firma.responsable_nombre)}{doc_resp}", est["nota"]))
    lineas.append(Paragraph(f"cc <u>{cc or '&nbsp;' * 22}</u>", est["firma"]))

    t = Table([[arriba], *[[l] for l in lineas]], colWidths=[7.8 * cm], rowHeights=[2.4 * cm] + [None] * len(lineas))
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (0, 0), "BOTTOM"), ("ALIGN", (0, 0), (0, 0), "LEFT"),
        ("LINEBELOW", (0, 0), (0, 0), 0.8, colors.black),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return t


def generar_pdf(acta, firmas) -> bytes:
    """acta: objeto Acta (con snapshot). firmas: lista de ActaFirma. Devuelve los bytes del PDF."""
    est = _estilos()
    snap = acta.snapshot or {}
    pac = snap.get("paciente", {})
    eq = snap.get("equipo", {})
    numero = f"{acta.numero:06d}"

    es_mapa = eq.get("tipo") == "MAPA"
    marca = (eq.get("marca") or ("SPACELABS" if es_mapa else "EVO")).upper()
    nombre_equipo = f"EQUIPO {'MAPA' if es_mapa else 'HOLTER'} MARCA {marca}"
    descripcion = f"{'MAPA' if es_mapa else 'HOLTER'} MARCA {marca}" + (
        f" - {eq['modelo']}" if eq.get("modelo") else "")
    horas = NUMEROS_HORAS.get(acta.duracion_horas, f"{acta.duracion_horas}")
    desde = f"{_fecha(acta.fecha_entrega)} {_hora(acta.fecha_entrega)}"
    hasta = f"{_fecha(acta.fecha_devolucion_prevista)} {_hora(acta.fecha_devolucion_prevista)}"
    doc_pac = f"{pac.get('tipo_documento', '')} {pac.get('numero_documento', '')}".strip()
    por_rol = {f.rol: f for f in firmas}

    def pie_pagina(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(colors.grey)
        canvas.drawString(2 * cm, 1.0 * cm, f"Acta N° {numero}")
        canvas.drawRightString(letter[0] - 2 * cm, 1.0 * cm, f"Página {doc.page}")
        canvas.restoreState()

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, leftMargin=2 * cm, rightMargin=2 * cm,
                            topMargin=1.4 * cm, bottomMargin=1.6 * cm,
                            title=f"Préstamo equipos cardiología - Acta N° {numero}",
                            author="REHABILITAR IPS NUEVA POPAYÁN")

    parrafo = (
        f"El suscrito {_v(pac.get('nombre_completo'), 30)} mayor de edad y Vecino de {_v(pac.get('vecino_de'), 14)} "
        f"identificado con la cédula de ciudadanía {_v(doc_pac, 14)} expedida en {_v(pac.get('ciudad_expedicion'), 14)} "
        f"declaro que en Calidad de préstamo de uso REHABILITAR IPS SEDE NUEVA POPAYÁN, ME ENTREGA {nombre_equipo} "
        f"de su propiedad. Lo anterior teniendo en cuenta que para la realización del procedimiento se requiere que "
        f"porte este equipo durante {_v(horas)} horas. "
        f"ENTREGA Y ESTADO DEL EQUIPO: REHABILITAR entrega al usuario un (1) {nombre_equipo}, serie "
        f"{_v(eq.get('serie'), 10)}, en perfecto estado de funcionamiento y libre de todo gravamen, o impedimento "
        f"para el uso del mismo."
    )
    nombre_corto = nombre_equipo
    flow = [
        _encabezado(acta, est), Spacer(1, 10),
        _tabla_datos(acta, snap, descripcion, est), Spacer(1, 14),
        Paragraph(parrafo, est["just"]),
        Paragraph(f"TÉRMINO DE DURACIÓN: Desde el {_v(desde, 14)} hasta el {_v(hasta, 14)}", est["just"]),
        Paragraph(f"DESTINACIÓN: EL {nombre_corto} se destinará exclusivamente para la realización del "
                  f"procedimiento electrocardiográfico.", est["just"]),
        Paragraph("OBLIGACIONES DE REHABILITAR:", est["titulo"]),
        ListFlowable([ListItem(Paragraph(t, est["item"]), leftIndent=18) for t in (
            f"Entregar en perfecto estado de funcionamiento un (1) {nombre_corto}",
            f"Capacitar al USUARIO en el manejo y funcionamiento del {nombre_corto}")],
            bulletType="bullet", start="•", leftIndent=18, bulletFontSize=9),
        Paragraph("OBLIGACIONES DEL USUARIO:", est["titulo"]),
        ListFlowable([ListItem(Paragraph(t.replace("{EQ}", nombre_corto), est["item"]), leftIndent=18)
                      for t in OBLIGACIONES_USUARIO],
                     bulletType="bullet", start="•", leftIndent=18, bulletFontSize=9),
        Spacer(1, 10),
        Paragraph(f"Firmado en {CIUDAD} {_v(_fecha(acta.fecha_entrega), 12)}", est["base"]),
        Spacer(1, 4),
    ]

    firmas_tabla = Table(
        [[_bloque_firma(por_rol.get("ENFERMERA"), "Enfermera Cardiologia Rehabilitar",
                        por_rol["ENFERMERA"].firmante_documento if "ENFERMERA" in por_rol else None, est),
          _bloque_firma(por_rol.get("PACIENTE"), "Usuario", pac.get("numero_documento"), est)]],
        colWidths=[8.75 * cm, 8.75 * cm],
    )
    firmas_tabla.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    flow.append(KeepTogether(firmas_tabla))

    doc.build(flow, onFirstPage=pie_pagina, onLaterPages=pie_pagina)
    return buf.getvalue()
