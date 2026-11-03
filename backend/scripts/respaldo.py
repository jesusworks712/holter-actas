"""Crea una copia de seguridad ahora: python -m scripts.respaldo (desde la carpeta backend)."""
from app.services.respaldo import crear_respaldo


def main():
    info = crear_respaldo()
    print(f"Copia creada: {info['nombre']} ({info['tamano'] // 1024} KB, base de datos: {info['metodo']})")
    print("Se guarda en la carpeta storage/backups del proyecto. Copia el archivo a un USB o a la nube.")


if __name__ == "__main__":
    main()
