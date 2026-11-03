import io
from collections import Counter
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, require_admin
from app.api.routes.auditoria import COLOMBIA, rango
from app.models import Acta, ActaFirma, Equipo, Usuario

router = APIRouter(prefix="/reportes", tags=["reportes"])

AZUL = PatternFill("solid", fgColor="1F46A3")
ENCABEZADO = Font(bold=True, color="FFFFFF")
FORMATO_FECHA = "dd/mm/yyyy hh:mm"
NOMBRE_ESTADO = {"BORRADOR": "Borrador", "FIRMADA": "Firmada (sin enviar)", "ENVIADA": "Enviada",
                 "DEVUELTA": "Devuelta", "ANULADA": "Anulada"}


def _aware(d: datetime | None):
    return d if d is None or d.tzinfo else d.replace(tzinfo=timezone.utc)


def _local(d: datetime | None):
    # Excel no maneja zonas horarias: se pasa a hora de Colombia y se quita la zona.
    return d.astimezone(COLOMBIA).replace(tzinfo=None) if d else None


def _hoja(ws, columnas, filas, anchos=None):
    ws.append(columnas)
    for c in ws[1]:
        c.fill, c.font, c.alignment = AZUL, ENCABEZADO, Alignment(vertical="center", wrap_text=True)
    for fila in filas:
        ws.append(fila)
    for i, col in enumerate(columnas, 1):
        letra = get_column_letter(i)
        ancho = (anchos or {}).get(col) or min(max([len(str(col))] + [len(str(f[i - 1] or "")) for f in filas[:200]]) + 3, 45)
        ws.column_dimensions[letra].width = ancho
        if "Fecha" in col or "Devolución" in col or "Entrega" in col:
            for c in ws[letra][1:]:
                c.number_format = FORMATO_FECHA
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions


@router.get("/prestamos.xlsx")
def prestamos_xlsx(desde: date | None = None, hasta: date | None = None, estado: str | None = None,
                   db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    stmt = select(Acta).options(joinedload(Acta.paciente), joinedload(Acta.equipo).joinedload(Equipo.tipo))
    ini, fin = rango(desde, hasta)
    if ini:
        stmt = stmt.where(Acta.fecha_entrega >= ini)
    if fin:
        stmt = stmt.where(Acta.fecha_entrega < fin)
    if estado:
        stmt = stmt.where(Acta.estado == estado.upper())
    actas = db.scalars(stmt.order_by(Acta.numero.desc())).unique().all()

    # Pacientes que no pudieron firmar (solo se leen motivo y responsable, no las imágenes)
    sin_firma = {
        r.acta_id: (r.motivo_no_firma, r.responsable_nombre)
        for r in db.execute(select(ActaFirma.acta_id, ActaFirma.motivo_no_firma, ActaFirma.responsable_nombre)
                            .where(ActaFirma.rol == "PACIENTE", ActaFirma.motivo_no_firma.is_not(None))).all()
    }
    ahora = datetime.now(timezone.utc)
    filas, cuenta_estado, uso_equipo = [], Counter(), Counter()
    for a in actas:
        s = a.snapshot or {}
        p, e = s.get("paciente", {}), s.get("equipo", {})
        prevista, real = _aware(a.fecha_devolucion_prevista), _aware(a.fecha_devolucion_real)
        vencida = a.estado in ("FIRMADA", "ENVIADA") and prevista and prevista < ahora
        dias_retraso = None
        fin_real = real or (ahora if vencida else None)
        if prevista and fin_real and fin_real > prevista:
            dias_retraso = (fin_real - prevista).days
        cuenta_estado[a.estado] += 1
        uso_equipo[f"{e.get('tipo_nombre', '')} {e.get('serie', '')}".strip()] += 1
        filas.append([
            a.numero, NOMBRE_ESTADO.get(a.estado, a.estado), _local(a.fecha_entrega), a.duracion_horas,
            _local(a.fecha_devolucion_prevista), _local(a.fecha_devolucion_real),
            "Sí" if vencida else "", dias_retraso if dias_retraso else "",
            p.get("nombre_completo"), f"{p.get('tipo_documento', '')} {p.get('numero_documento', '')}".strip(),
            p.get("correo"), e.get("tipo_nombre"), e.get("marca"), e.get("serie"),
            s.get("aseguradora"), s.get("regimen"),
            (f"No pudo firmar: {sin_firma[a.id][0]}" + (f" (responsable: {sin_firma[a.id][1]})" if sin_firma[a.id][1] else ""))
            if a.id in sin_firma else ("Firmó" if a.estado != "BORRADOR" else "Pendiente"),
            a.observaciones,
        ])

    wb = Workbook()
    ws = wb.active
    ws.title = "Préstamos"
    _hoja(ws, ["N° acta", "Estado", "Fecha entrega", "Horas", "Devolución prevista", "Devolución real",
               "Vencida", "Días de retraso", "Paciente", "Documento", "Correo", "Equipo", "Marca", "Serie",
               "Aseguradora", "Régimen", "Firma del paciente", "Observaciones"], filas, {"Observaciones": 40, "Firma del paciente": 38})

    rs = wb.create_sheet("Resumen")
    periodo = f"{desde.strftime('%d/%m/%Y') if desde else 'inicio'} a {hasta.strftime('%d/%m/%Y') if hasta else 'hoy'}"
    rs.append(["Reporte de préstamos de equipos de cardiología"])
    rs["A1"].font = Font(bold=True, size=14, color="1F46A3")
    rs.append([f"Periodo: {periodo}"])
    rs.append([f"Generado: {datetime.now(COLOMBIA).strftime('%d/%m/%Y %H:%M')}"])
    rs.append([])
    rs.append(["Estado", "Cantidad"])
    for c in rs[5]:
        c.fill, c.font = AZUL, ENCABEZADO
    for est, n in sorted(cuenta_estado.items()):
        rs.append([NOMBRE_ESTADO.get(est, est), n])
    rs.append(["Total", len(actas)])
    rs[rs.max_row][0].font = rs[rs.max_row][1].font = Font(bold=True)
    rs.append([])
    rs.append(["Equipo (más usados)", "Préstamos"])
    for c in rs[rs.max_row]:
        c.fill, c.font = AZUL, ENCABEZADO
    for nombre, n in uso_equipo.most_common(10):
        rs.append([nombre, n])
    rs.column_dimensions["A"].width = 38
    rs.column_dimensions["B"].width = 14

    eq = wb.create_sheet("Equipos")
    conteo = dict(db.execute(select(Acta.equipo_id, func.count()).group_by(Acta.equipo_id)).all())
    equipos = db.scalars(select(Equipo).options(joinedload(Equipo.tipo)).order_by(Equipo.serie)).all()
    _hoja(eq, ["Tipo", "Marca", "Modelo", "Serie", "Estado", "Préstamos (histórico)"],
          [[e.tipo.nombre, e.marca, e.modelo, e.serie, e.estado.capitalize(), conteo.get(e.id, 0)] for e in equipos])

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    nombre = f"prestamos-{date.today().isoformat()}.xlsx"
    return StreamingResponse(
        buf, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{nombre}"'},
    )
