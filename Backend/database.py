# database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

# Configuration de la base de données
DATABASE_URL = "sqlite:///./crypto_tracker.db"
# Pour PostgreSQL (production):
# DATABASE_URL = "postgresql://user:password@localhost/crypto_tracker"

# Créer le moteur SQLAlchemy
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False  # Mettre à True pour voir les requêtes SQL
)

# Créer la session locale
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Générateur de dépendance pour obtenir une session de base de données.
    Utilisé avec Depends() dans FastAPI.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()