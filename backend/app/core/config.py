from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str  # Obligatoria: define en .env (postgresql+psycopg://usuario:password@host:5432/base)
    SECRET_KEY: str  # Obligatoria: sin ella la app no arranca
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str  # Obligatoria: define en .env. Genera con: python -c "import secrets; print(secrets.token_urlsafe(16))"
    ADMIN_NOMBRE: str = "Usuario General"

    # Correo (Brevo). Si BREVO_API_KEY queda vacío, el envío de correos queda desactivado.
    BREVO_API_KEY: str = ""
    BREVO_SENDER_EMAIL: str = ""
    BREVO_SENDER_NAME: str = "IPS Nueva Popayán"

    # Correo por SMTP (Gmail / Google Workspace). Si SMTP_HOST tiene valor, se usa en lugar de Brevo.
    SMTP_HOST: str = ""
    SMTP_PORT: int = 465
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""  # contraseña de aplicación de Google
    SMTP_SENDER_NAME: str = "IPS Nueva Popayán"

    # Dirección pública del sistema, tal como la abre el celular (para QR y enlaces de firma).
    # En red local: http://192.168.X.X:5173  (la IP del computador donde corre el sistema).
    APP_URL: str = "http://localhost:5173"
    FIRMA_ENLACE_MINUTOS: int = 30

    # Avisos automáticos
    SCHEDULER_ACTIVO: bool = True
    RECORDATORIO_HORAS_ANTES: int = 6  # avisa al paciente cuando faltan estas horas para devolver
    ALERTAS_EMAIL: str = ""  # correos del personal que reciben el resumen diario de vencidas (separados por coma)

    # Copias de seguridad
    BACKUP_HORA: int = 2  # hora (0-23, Colombia) a partir de la cual se hace la copia diaria
    BACKUP_CONSERVAR: int = 14  # cuántas copias se guardan
    DB_CONTAINER: str = "holter_db"  # contenedor de Docker con PostgreSQL (para pg_dump)

    # Carpeta donde se guardan los PDF. Vacío = <proyecto>/storage/pdfs
    PDF_DIR: str = ""

    @field_validator("ADMIN_PASSWORD")
    @classmethod
    def admin_password_segura(cls, v: str) -> str:
        if len(v) < 10:
            raise ValueError("ADMIN_PASSWORD debe tener al menos 10 caracteres")
        return v

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_segura(cls, v: str) -> str:
        if v == "dev-inseguro-cambiar" or len(v) < 32:
            raise ValueError(
                "SECRET_KEY debe tener al menos 32 caracteres y no ser la clave de ejemplo"
            )
        return v

    @property
    def pdf_dir(self) -> Path:
        if self.PDF_DIR:
            return Path(self.PDF_DIR)
        return Path(__file__).resolve().parents[3] / "storage" / "pdfs"

    @property
    def fotos_dir(self) -> Path:
        return self.pdf_dir.parent / "equipos"

    @property
    def backup_dir(self) -> Path:
        return self.pdf_dir.parent / "backups"

    @property
    def alertas_lista(self) -> list[str]:
        return [e.strip() for e in self.ALERTAS_EMAIL.split(",") if e.strip()]

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()