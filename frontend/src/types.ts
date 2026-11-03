export interface Paciente {
  id: string;
  tipo_documento: string;
  numero_documento: string;
  nombre_completo: string;
  ciudad_expedicion: string | null;
  vecino_de: string | null;
  correo: string | null;
  telefono: string | null;
}

export interface Equipo {
  id: string;
  serie: string;
  marca: string | null;
  modelo: string | null;
  estado: string;
  notas?: string | null;
  tiene_foto?: boolean;
  tipo: { id: number; codigo: string; nombre: string };
}

export interface TipoEquipo {
  id: number;
  codigo: string;
  nombre: string;
  marca: string | null;
}

export interface Catalogo {
  id: number;
  nombre: string;
}

export interface Acta {
  id: string;
  numero: number;
  estado: string;
  fecha_entrega: string;
  fecha_devolucion_prevista: string | null;
  fecha_devolucion_real?: string | null;
  duracion_horas: number;
  observaciones?: string | null;
  aseguradora_id?: number | null;
  regimen_id?: number | null;
  paciente: Paciente;
  equipo: Equipo;
}

export interface FirmasEstado {
  estado: string;
  roles_firmados: string[];
  completa: boolean;
}

export interface Envio {
  id: string;
  destinatario: string;
  estado: string;
  error: string | null;
  enviado_en: string | null;
}


export interface UsuarioAdmin {
  id: string;
  username: string;
  nombre: string;
  email: string | null;
  rol: string;
  activo: boolean;
  debe_cambiar_password: boolean;
  ultimo_login: string | null;
}

export interface AuditoriaItem {
  id: number;
  fecha: string;
  usuario: string | null;
  username: string | null;
  accion: string;
  entidad: string | null;
  entidad_id: string | null;
  detalle: Record<string, unknown> | null;
  ip: string | null;
}

export interface HistorialItem {
  acta_id: string;
  numero: number;
  estado: string;
  paciente_nombre: string;
  paciente_documento: string;
  fecha_entrega: string;
  fecha_devolucion_prevista: string | null;
  fecha_devolucion_real: string | null;
}


export interface Dashboard {
  equipos: Record<string, number>;
  actas: Record<string, number>;
  vencidas: number;
  por_vencer_24h: number;
  prestamos_14_dias: { fecha: string; total: number }[];
  top_equipos: { nombre: string; total: number }[];
}

export interface ActaVencida {
  acta_id: string;
  numero: number;
  estado: string;
  paciente_nombre: string;
  paciente_documento: string;
  paciente_correo: string | null;
  paciente_telefono: string | null;
  equipo_tipo: string;
  equipo_serie: string;
  fecha_entrega: string | null;
  fecha_devolucion_prevista: string | null;
  dias_vencida: number | null;
}

export interface Respaldo {
  nombre: string;
  tamano: number;
  fecha: string;
}

export interface HistorialPaciente {
  acta_id: string;
  numero: number;
  estado: string;
  equipo: string;
  fecha_entrega: string;
  fecha_devolucion_prevista: string | null;
  fecha_devolucion_real: string | null;
}


export interface FirmaResumen {
  rol: string;
  firmante_nombre: string | null;
  firmante_documento: string | null;
  firmado_en: string;
  motivo_no_firma?: string | null;
  responsable_nombre?: string | null;
  responsable_documento?: string | null;
}

export interface PacienteResumen extends Paciente {
  total_prestamos: number;
  ultimo_prestamo: string | null;
  en_prestamo: boolean;
}
