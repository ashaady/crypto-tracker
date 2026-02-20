# crud.py
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import database_models
import models


# ==================== ASSET OPERATIONS ====================

def create_asset(db: Session, asset: models.AssetCreate) -> database_models.Asset:
    """Créer un nouvel actif dans le portefeuille"""
    db_asset = database_models.Asset(
        symbol=asset.symbol,
        amount=asset.amount
    )
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset


def get_assets(db: Session) -> List[database_models.Asset]:
    """Récupérer tous les actifs"""
    return db.query(database_models.Asset).all()


def get_asset_by_id(db: Session, asset_id: int) -> Optional[database_models.Asset]:
    """Récupérer un actif par son ID"""
    return db.query(database_models.Asset).filter(database_models.Asset.id == asset_id).first()


def get_assets_by_symbol(db: Session, symbol: str) -> List[database_models.Asset]:
    """Récupérer tous les actifs d'un symbole donné"""
    return db.query(database_models.Asset).filter(database_models.Asset.symbol == symbol).all()


def update_asset(db: Session, asset_id: int, amount: float) -> Optional[database_models.Asset]:
    """Mettre à jour la quantité d'un actif"""
    db_asset = get_asset_by_id(db, asset_id)
    if db_asset:
        db_asset.amount = amount
        db_asset.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_asset)
    return db_asset


def delete_asset(db: Session, asset_id: int) -> bool:
    """Supprimer un actif"""
    db_asset = get_asset_by_id(db, asset_id)
    if db_asset:
        db.delete(db_asset)
        db.commit()
        return True
    return False


# ==================== ALERT OPERATIONS ====================

def create_alert(db: Session, alert: models.AlertCreate) -> database_models.PriceAlert:
    """Créer une nouvelle alerte de prix"""
    db_alert = database_models.PriceAlert(
        symbol=alert.symbol,
        target_price=alert.target_price,
        condition=alert.condition,
        status="active"
    )
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert


def get_alerts(db: Session, status: Optional[str] = None) -> List[database_models.PriceAlert]:
    """Récupérer les alertes, optionnellement filtrées par statut"""
    query = db.query(database_models.PriceAlert)
    if status:
        query = query.filter(database_models.PriceAlert.status == status)
    return query.order_by(database_models.PriceAlert.created_at.desc()).all()


def get_alert_by_id(db: Session, alert_id: int) -> Optional[database_models.PriceAlert]:
    """Récupérer une alerte par son ID"""
    return db.query(database_models.PriceAlert).filter(database_models.PriceAlert.id == alert_id).first()


def update_alert_status(db: Session, alert_id: int, status: str) -> Optional[database_models.PriceAlert]:
    """Mettre à jour le statut d'une alerte"""
    db_alert = get_alert_by_id(db, alert_id)
    if db_alert:
        db_alert.status = status
        if status == "triggered":
            db_alert.triggered_at = datetime.utcnow()
        db.commit()
        db.refresh(db_alert)
    return db_alert


def delete_alert(db: Session, alert_id: int) -> bool:
    """Supprimer une alerte"""
    db_alert = get_alert_by_id(db, alert_id)
    if db_alert:
        db.delete(db_alert)
        db.commit()
        return True
    return False


# ==================== PORTFOLIO HISTORY OPERATIONS ====================

def create_portfolio_history(db: Session, total_value: float) -> database_models.PortfolioHistory:
    """Créer un snapshot de l'historique du portefeuille"""
    db_history = database_models.PortfolioHistory(
        total_value_usd=total_value
    )
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history


def get_portfolio_history(db: Session, days: int = 7) -> List[database_models.PortfolioHistory]:
    """Récupérer l'historique du portefeuille sur X jours"""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    return db.query(database_models.PortfolioHistory)\
        .filter(database_models.PortfolioHistory.timestamp >= cutoff_date)\
        .order_by(database_models.PortfolioHistory.timestamp.asc())\
        .all()


def get_latest_portfolio_value(db: Session) -> Optional[database_models.PortfolioHistory]:
    """Récupérer la dernière valeur enregistrée du portefeuille"""
    return db.query(database_models.PortfolioHistory)\
        .order_by(database_models.PortfolioHistory.timestamp.desc())\
        .first()


def cleanup_old_history(db: Session, days: int = 30):
    """Nettoyer l'historique plus ancien que X jours (maintenance)"""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    db.query(database_models.PortfolioHistory)\
        .filter(database_models.PortfolioHistory.timestamp < cutoff_date)\
        .delete()
    db.commit()