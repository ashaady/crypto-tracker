# database_models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()


class Asset(Base):
    """Modèle pour les actifs du portefeuille"""
    __tablename__ = "assets"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(10), nullable=False, index=True)  # BTC, ETH, SOL
    amount = Column(Float, nullable=False)  # Quantité possédée
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Asset(symbol={self.symbol}, amount={self.amount})>"


class AlertCondition(str, enum.Enum):
    """Conditions possibles pour les alertes"""
    ABOVE = "above"
    BELOW = "below"


class AlertStatus(str, enum.Enum):
    """Statuts possibles pour les alertes"""
    ACTIVE = "active"
    TRIGGERED = "triggered"
    CANCELLED = "cancelled"


class PriceAlert(Base):
    """Modèle pour les alertes de prix"""
    __tablename__ = "price_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(10), nullable=False, index=True)
    target_price = Column(Float, nullable=False)
    condition = Column(String(10), nullable=False)  # "above" ou "below"
    status = Column(String(20), default="active", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    triggered_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<PriceAlert(symbol={self.symbol}, target={self.target_price}, status={self.status})>"


class PortfolioHistory(Base):
    """Modèle pour l'historique de valeur du portefeuille"""
    __tablename__ = "portfolio_history"
    
    id = Column(Integer, primary_key=True, index=True)
    total_value_usd = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    def __repr__(self):
        return f"<PortfolioHistory(value={self.total_value_usd}, time={self.timestamp})>"