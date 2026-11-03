# Actas de Préstamo Holter — IPS Nueva Popayán

## Fase 1: base del proyecto, base de datos y login

### 1. Levantar PostgreSQL (Docker)
    docker compose up -d

Sin Docker, en psql:
    CREATE USER holter WITH PASSWORD 'holter';
    CREATE DATABASE holter_actas OWNER holter;

### 2. Backend
    cd backend
    python -m venv .venv
    .venv\Scripts\activate          (Windows)   |   source .venv/bin/activate  (Linux/Mac)
    pip install -r requirements.txt
    copy .env.example .env          (Windows)   |   cp .env.example .env
    # edita .env: SECRET_KEY y ADMIN_PASSWORD

### 3. Crear tablas y datos iniciales
    alembic upgrade head
    python -m scripts.seed

### 4. Arrancar
    uvicorn app.main:app --reload
    Abrir http://localhost:8000/docs

### Probar
- GET  /api/health            -> {"status":"ok","db":"ok"}
- POST /api/auth/login        -> token JWT (usuario/clave del .env)
- GET  /api/auth/me           -> datos del usuario (con token)

### Cambios futuros en la base de datos
    alembic revision --autogenerate -m "describe el cambio"
    alembic upgrade head
Nunca edites las tablas a mano: siempre por migración.
