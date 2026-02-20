# models.py
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, Literal


# ==================== ASSET SCHEMAS ====================

class AssetCreate(BaseModel):
    """Schéma pour créer un actif"""
    symbol: str = Field(..., min_length=2, max_length=10, description="Symbole de la crypto (ex: BTC, ETH)")
    amount: float = Field(..., gt=0, description="Quantité possédée (doit être > 0)")
    
    @field_validator('symbol')
    @classmethod
    def symbol_uppercase(cls, v: str) -> str:
        """Convertir le symbole en majuscules"""
        return v.upper().strip()
    
    class Config:
        json_schema_extra = {
            "example": {
                "symbol": "BTC",
                "amount": 0.5
            }
        }


class AssetResponse(BaseModel):
    """Schéma de réponse pour un actif"""
    id: int
    symbol: str
    amount: float
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AssetUpdate(BaseModel):
    """Schéma pour mettre à jour un actif"""
    amount: Optional[float] = Field(None, gt=0)


# ==================== ALERT SCHEMAS ====================

class AlertCreate(BaseModel):
    """Schéma pour créer une alerte"""
    symbol: str = Field(..., min_length=2, max_length=10)
    target_price: float = Field(..., gt=0, description="Prix cible (doit être > 0)")
    condition: Literal["above", "below"] = Field(..., description="Condition: 'above' ou 'below'")
    
    @field_validator('symbol')
    @classmethod
    def symbol_uppercase(cls, v: str) -> str:
        return v.upper().strip()
    
    class Config:
        json_schema_extra = {
            "example": {
                "symbol": "BTC",
                "target_price": 100000,
                "condition": "above"
            }
        }


class AlertResponse(BaseModel):
    """Schéma de réponse pour une alerte"""
    id: int
    symbol: str
    target_price: float
    condition: str
    status: str
    created_at: datetime
    triggered_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ==================== PORTFOLIO SCHEMAS ====================

class PortfolioValuationResponse(BaseModel):
    """Schéma de réponse pour la valorisation du portefeuille"""
    total_value: float
    currency: str
    assets: list
    last_updated: str


class PortfolioDiversificationResponse(BaseModel):
    """Schéma pour l'analyse de diversification"""
    total_value_usd: float
    diversification: list


class PortfolioHistoryResponse(BaseModel):
    """Schéma de réponse pour l'historique"""
    period_days: int
    data_points: int
    percent_change: float
    data: list


# ==================== MARKET SCHEMAS ====================

class CryptoPrice(BaseModel):
    """Schéma pour le prix d'une crypto"""
    symbol: str
    price: float
    percent_change_24h: float
    market_cap: float


class TopCryptosResponse(BaseModel):
    """Schéma pour le top des cryptos"""
    top_cryptos: list