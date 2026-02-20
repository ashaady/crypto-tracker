from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import requests
from functools import lru_cache
import os
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler
import atexit
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from database import get_db, engine
import database_models
import models
import crud

# Charger les variables d'environnement
load_dotenv()

# Créer les tables
database_models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Crypto-Tracker & Alert Manager", version="1.0.0")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permettre tous les origins (à adapter en production)
    allow_credentials=True,
    allow_methods=["*"],  # Permettre toutes les méthodes HTTP
    allow_headers=["*"],  # Permettre tous les headers
)

# Configuration
COINMARKETCAP_API_KEY = os.getenv("COINMARKETCAP_API_KEY", "your_api_key_here")
COINMARKETCAP_BASE_URL = "https://pro-api.coinmarketcap.com/v1"

# Cache simple en mémoire (pour production, utilisez Redis)
price_cache = {}
CACHE_DURATION = 300  # 5 minutes

# ==================== SCHEDULER POUR ALERTES ====================

scheduler = BackgroundScheduler()
ALERT_CHECK_INTERVAL = 60  # Vérifier les alertes toutes les 60 secondes

def get_crypto_prices(symbols: List[str]) -> dict:
    """Récupère les prix de plusieurs cryptos en un seul appel (batching)"""
    cache_key = ",".join(sorted(symbols))
    current_time = datetime.now()
    
    # Vérifier le cache
    if cache_key in price_cache:
        cached_data, cached_time = price_cache[cache_key]
        if (current_time - cached_time).seconds < CACHE_DURATION:
            return cached_data
    
    # Appel API groupé - v2 pour multiple symbols
    symbols_str = ",".join(symbols)
    url = f"{COINMARKETCAP_BASE_URL}/cryptocurrency/quotes/latest"
    headers = {
        "X-CMC_PRO_API_KEY": COINMARKETCAP_API_KEY,
        "Accept": "application/json"
    }
    params = {"symbol": symbols_str, "convert": "USD"}
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10.0)
        
        if response.status_code != 200:
            error_detail = f"CoinMarketCap API Error: {response.status_code} - {response.text}"
            print(error_detail)  # Pour debug
            raise HTTPException(
                status_code=502, 
                detail=f"Erreur API CoinMarketCap (Code: {response.status_code})"
            )
        
        data = response.json()
        
        # Parse response (même logique que le script de test)
        prices = {}
        for symbol in symbols:
            if symbol in data.get("data", {}):
                crypto_data = data["data"][symbol]
                
                # V2 peut retourner un tableau, prendre le premier élément
                if isinstance(crypto_data, list):
                    crypto_data = crypto_data[0] if crypto_data else None
                
                if crypto_data and "quote" in crypto_data and "USD" in crypto_data["quote"]:
                    prices[symbol] = {
                        "price": crypto_data["quote"]["USD"]["price"],
                        "percent_change_24h": crypto_data["quote"]["USD"]["percent_change_24h"],
                        "market_cap": crypto_data["quote"]["USD"]["market_cap"]
                    }
        
        # Mettre en cache
        price_cache[cache_key] = (prices, current_time)
        return prices
        
    except requests.Timeout:
        raise HTTPException(status_code=504, detail="Timeout lors de l'appel à CoinMarketCap")
    except requests.RequestException as e:
        print(f"Erreur requête: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la requête: {str(e)}")
    except KeyError as e:
        print(f"Erreur parsing JSON: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Format de réponse inattendu de l'API")
    except Exception as e:
        print(f"Erreur inattendue: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")


def convert_currency(amount_usd: float, target_currency: str) -> float:
    """Convertit USD vers FCFA, EUR, etc."""
    rates = {
        "USD": 1.0,
        "EUR": 0.92,
        "FCFA": 605.0,  # XOF
    }
    return amount_usd * rates.get(target_currency, 1.0)


# ==================== BACKGROUND JOB POUR ALERTES ====================

def check_alerts_background():
    """
    Tâche de vérification des alertes en arrière-plan.
    Exécutée automatiquement toutes les N secondes par le scheduler.
    """
    from database import SessionLocal
    db = SessionLocal()
    try:
        alerts = crud.get_alerts(db, status="active")
        
        if not alerts:
            logger.debug("Aucune alerte active à vérifier")
            return
        
        symbols = list(set(alert.symbol for alert in alerts))
        prices = get_crypto_prices(symbols)
        
        triggered_count = 0
        
        for alert in alerts:
            if alert.symbol in prices:
                current_price = prices[alert.symbol]["price"]
                
                should_trigger = False
                if alert.condition == "above" and current_price >= alert.target_price:
                    should_trigger = True
                elif alert.condition == "below" and current_price <= alert.target_price:
                    should_trigger = True
                
                if should_trigger:
                    # Mettre à jour le statut en base de données
                    crud.update_alert_status(db, alert.id, "triggered")
                    triggered_count += 1
                    
                    # Envoyer la notification
                    send_alert_notification(
                        alert.symbol,
                        current_price,
                        alert.target_price
                    )
                    
                    logger.warning(
                        f"🚨 ALERTE DÉCLENCHÉE: {alert.symbol} = {current_price:.2f}$ "
                        f"(seuil {alert.condition}: {alert.target_price:.2f}$)"
                    )
        
        if triggered_count > 0:
            logger.info(f"✅ {triggered_count} alerte(s) déclenchée(s) lors de la vérification")
    
    except Exception as e:
        logger.error(f"❌ Erreur lors de la vérification automatique des alertes: {str(e)}")
    finally:
        db.close()


# ==================== ÉVÉNEMENTS DE CYCLE DE VIE ====================

@app.on_event("startup")
def startup_event():
    """Exécuté au démarrage de l'application"""
    try:
        scheduler.add_job(
            check_alerts_background,
            'interval',
            seconds=ALERT_CHECK_INTERVAL,
            id='check_alerts_background_job',
            name='Vérifier les alertes de prix',
            replace_existing=True
        )
        scheduler.start()
        logger.info(
            f"🚀 Scheduler d'alertes DÉMARRÉ "
            f"(vérification toutes les {ALERT_CHECK_INTERVAL}s)"
        )
    except Exception as e:
        logger.error(f"Erreur au démarrage du scheduler: {str(e)}")


@app.on_event("shutdown")
def shutdown_event():
    """Exécuté à l'arrêt de l'application"""
    try:
        if scheduler.running:
            scheduler.shutdown()
            logger.info("🛑 Scheduler d'alertes arrêté")
    except Exception as e:
        logger.error(f"Erreur à l'arrêt du scheduler: {str(e)}")


# Fallback: Arrêter le scheduler en cas de crash
atexit.register(lambda: scheduler.shutdown(wait=False) if scheduler.running else None)


# ==================== SERVICES ====================

@app.post("/portfolio/assets", response_model=models.AssetResponse)
def add_asset(
    asset: models.AssetCreate,
    db: Session = Depends(get_db)
):
    """Ajouter un actif au portefeuille"""
    return crud.create_asset(db, asset)


@app.get("/portfolio/assets", response_model=List[models.AssetResponse])
def list_assets(db: Session = Depends(get_db)):
    """Lister tous les actifs du portefeuille"""
    return crud.get_assets(db)


@app.delete("/portfolio/assets/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    """Supprimer un actif"""
    if not crud.delete_asset(db, asset_id):
        raise HTTPException(status_code=404, detail="Actif non trouvé")
    return {"message": "Actif supprimé avec succès"}


@app.get("/portfolio/valuation")
def get_portfolio_valuation(
    currency: str = "USD",
    db: Session = Depends(get_db)
):
    """Obtenir la valorisation totale du portefeuille"""
    assets = crud.get_assets(db)
    
    if not assets:
        return {"total_value": 0, "currency": currency, "assets": []}
    
    # Récupérer tous les symboles uniques
    symbols = list(set(asset.symbol for asset in assets))
    prices = get_crypto_prices(symbols)
    
    total_value_usd = 0
    assets_detail = []
    
    for asset in assets:
        if asset.symbol in prices:
            price = prices[asset.symbol]["price"]
            value_usd = asset.amount * price
            total_value_usd += value_usd
            
            assets_detail.append({
                "symbol": asset.symbol,
                "amount": asset.amount,
                "current_price": price,
                "value_usd": value_usd,
                "percent_change_24h": prices[asset.symbol]["percent_change_24h"]
            })
    
    # Convertir si nécessaire
    total_value = convert_currency(total_value_usd, currency)
    
    return {
        "total_value": round(total_value, 2),
        "currency": currency,
        "assets": assets_detail,
        "last_updated": datetime.now().isoformat()
    }


@app.get("/portfolio/diversification")
def get_portfolio_diversification(db: Session = Depends(get_db)):
    """Analyser la diversification du portefeuille"""
    assets = crud.get_assets(db)
    
    if not assets:
        return {"message": "Portefeuille vide"}
    
    symbols = list(set(asset.symbol for asset in assets))
    prices = get_crypto_prices(symbols)
    
    total_value = 0
    asset_values = {}
    
    for asset in assets:
        if asset.symbol in prices:
            value = asset.amount * prices[asset.symbol]["price"]
            asset_values[asset.symbol] = asset_values.get(asset.symbol, 0) + value
            total_value += value
    
    # Calculer les pourcentages
    diversification = []
    for symbol, value in asset_values.items():
        percentage = (value / total_value) * 100 if total_value > 0 else 0
        diversification.append({
            "symbol": symbol,
            "value_usd": round(value, 2),
            "percentage": round(percentage, 2)
        })
    
    # Trier par valeur décroissante
    diversification.sort(key=lambda x: x["value_usd"], reverse=True)
    
    return {
        "total_value_usd": round(total_value, 2),
        "diversification": diversification
    }


# ==================== ROUTES ALERTES ====================

@app.post("/alerts", response_model=models.AlertResponse)
def create_alert(
    alert: models.AlertCreate,
    db: Session = Depends(get_db)
):
    """Créer une alerte de prix"""
    return crud.create_alert(db, alert)


@app.get("/alerts", response_model=List[models.AlertResponse])
def list_alerts(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lister toutes les alertes"""
    return crud.get_alerts(db, status)


@app.delete("/alerts/{alert_id}")
def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    """Supprimer une alerte"""
    if not crud.delete_alert(db, alert_id):
        raise HTTPException(status_code=404, detail="Alerte non trouvée")
    return {"message": "Alerte supprimée avec succès"}


@app.post("/alerts/check")
def check_alerts(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Vérifier manuellement toutes les alertes actives.
    
    Note: Les alertes sont aussi vérifiées automatiquement toutes les 60 secondes
    par le scheduler en arrière-plan.
    """
    alerts = crud.get_alerts(db, status="active")
    
    if not alerts:
        return {
            "message": "Aucune alerte active",
            "checked": 0,
            "triggered": [],
            "scheduler_status": "running" if scheduler.running else "stopped"
        }
    
    symbols = list(set(alert.symbol for alert in alerts))
    prices = get_crypto_prices(symbols)
    
    triggered = []
    
    for alert in alerts:
        if alert.symbol in prices:
            current_price = prices[alert.symbol]["price"]
            
            # Logique de déclenchement
            should_trigger = False
            if alert.condition == "above" and current_price >= alert.target_price:
                should_trigger = True
            elif alert.condition == "below" and current_price <= alert.target_price:
                should_trigger = True
            
            if should_trigger:
                crud.update_alert_status(db, alert.id, "triggered")
                triggered.append({
                    "alert_id": alert.id,
                    "symbol": alert.symbol,
                    "target_price": alert.target_price,
                    "current_price": current_price,
                    "condition": alert.condition,
                    "triggered_at": datetime.now().isoformat()
                })
                
                # Background task pour notification
                background_tasks.add_task(
                    send_alert_notification,
                    alert.symbol,
                    current_price,
                    alert.target_price
                )
    
    return {
        "checked": len(alerts),
        "triggered": triggered,
        "scheduler_status": "running" if scheduler.running else "stopped",
        "scheduler_interval": f"{ALERT_CHECK_INTERVAL}s"
    }


def send_alert_notification(symbol: str, current_price: float, target_price: float):
    """
    Envoyer une notification d'alerte.
    Cette fonction est exécutée en arrière-plan et ne bloque pas la requête.
    
    Peut être étendue pour envoyer:
    - Email
    - SMS
    - Webhooks
    - Discord, Telegram, etc.
    """
    message = (
        f"🚨 ALERTE DE PRIX: {symbol}\n"
        f"   Prix actuel: ${current_price:.2f}\n"
        f"   Seuil: ${target_price:.2f}\n"
        f"   Timestamp: {datetime.now().isoformat()}"
    )
    
    # Actuellement: Logging en console
    logger.warning(message)
    print(message)
    
    # TODO: Extensions possibles
    # - send_email(to=user_email, subject="Alerte Crypto-Tracker", body=message)
    # - send_sms(phone=user_phone, message=message)
    # - requests.post(webhook_url, json={"symbol": symbol, "price": current_price})
    # - discord_webhook(embed=create_embed(symbol, current_price))
    # - telegram_bot.send_message(chat_id=user_id, text=message)


@app.get("/alerts/status")
def get_alerts_scheduler_status():
    """
    Obtenir le statut du scheduler d'alertes.
    Retourne des informations sur les jobs en arrière-plan.
    """
    jobs = []
    if scheduler.running:
        for job in scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "trigger": str(job.trigger),
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None
            })
    
    return {
        "scheduler_running": scheduler.running,
        "interval_seconds": ALERT_CHECK_INTERVAL,
        "active_jobs": len(jobs),
        "jobs": jobs
    }


# ==================== ROUTES HISTORIQUE ====================

@app.post("/portfolio/history/save")
def save_portfolio_snapshot(db: Session = Depends(get_db)):
    """Enregistrer un snapshot de la valeur du portefeuille"""
    valuation = get_portfolio_valuation(db=db)
    total_value = valuation.get("total_value", 0)
    
    snapshot = crud.create_portfolio_history(db, total_value)
    return {"message": "Snapshot enregistré", "value": total_value}


@app.get("/portfolio/history")
def get_portfolio_history(
    days: int = 7,
    db: Session = Depends(get_db)
):
    """Obtenir l'historique de performance du portefeuille"""
    history = crud.get_portfolio_history(db, days)
    
    if not history:
        return {"message": "Aucun historique disponible", "data": []}
    
    data = [
        {
            "timestamp": h.timestamp.isoformat(),
            "value_usd": h.total_value_usd
        }
        for h in history
    ]
    
    # Calculer la variation
    if len(data) >= 2:
        initial_value = data[0]["value_usd"]
        final_value = data[-1]["value_usd"]
        percent_change = ((final_value - initial_value) / initial_value * 100) if initial_value > 0 else 0
    else:
        percent_change = 0
    
    return {
        "period_days": days,
        "data_points": len(data),
        "percent_change": round(percent_change, 2),
        "data": data
    }


# ==================== ROUTES BONUS ====================

@app.get("/market/top")
def get_top_cryptos(limit: int = 10):
    """Obtenir le top des cryptomonnaies"""
    url = f"{COINMARKETCAP_BASE_URL}/cryptocurrency/listings/latest"
    headers = {
        "X-CMC_PRO_API_KEY": COINMARKETCAP_API_KEY,
        "Accept": "application/json"
    }
    params = {"limit": limit, "convert": "USD"}
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10.0)
        
        if response.status_code != 200:
            print(f"Erreur API: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=502, 
                detail=f"Erreur API CoinMarketCap (Code: {response.status_code})"
            )
        
        data = response.json()
        
        top_cryptos = []
        for crypto in data.get("data", []):
            top_cryptos.append({
                "rank": crypto["cmc_rank"],
                "symbol": crypto["symbol"],
                "name": crypto["name"],
                "price": crypto["quote"]["USD"]["price"],
                "percent_change_24h": crypto["quote"]["USD"]["percent_change_24h"],
                "market_cap": crypto["quote"]["USD"]["market_cap"]
            })
        
        return {"top_cryptos": top_cryptos}
    
    except requests.Timeout:
        raise HTTPException(status_code=504, detail="Timeout lors de l'appel à CoinMarketCap")
    except requests.RequestException as e:
        print(f"Erreur requête: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la requête: {str(e)}")
    except Exception as e:
        print(f"Erreur inattendue: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")


@app.get("/")
def root():
    return {
        "message": "Crypto-Tracker API",
        "version": "1.0.0",
        "endpoints": {
            "portfolio": "/portfolio/assets, /portfolio/valuation, /portfolio/diversification",
            "alerts": "/alerts, /alerts/check",
            "history": "/portfolio/history",
            "market": "/market/top"
        }
    }