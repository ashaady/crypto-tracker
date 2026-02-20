#!/usr/bin/env python3
"""
Script de test pour vérifier la connexion à l'API CoinMarketCap
"""
import os
import requests
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

API_KEY = os.getenv("COINMARKETCAP_API_KEY")

def test_api_connection():
    """Test de connexion basique à l'API"""
    print("🔍 Test de connexion à CoinMarketCap API...\n")
    
    if not API_KEY or API_KEY == "your_api_key_here":
        print("❌ ERREUR: Clé API non configurée!")
        print("   Créez un fichier .env avec: COINMARKETCAP_API_KEY=votre_cle")
        return False
    
    print(f"✅ Clé API trouvée: {API_KEY[:10]}...")
    
    # Test 1: Vérifier les informations de la clé
    print("\n📊 Test 1: Vérification des informations de la clé API")
    url = "https://pro-api.coinmarketcap.com/v1/key/info"
    headers = {
        "X-CMC_PRO_API_KEY": API_KEY,
        "Accept": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            plan = data["data"]["plan"]
            usage = data["data"]["usage"]
            
            print(f"✅ Connexion réussie!")
            print(f"\n📋 Informations du plan:")
            print(f"   - Limite mensuelle: {plan['credit_limit_monthly']} crédits")
            print(f"   - Limite par minute: {plan['rate_limit_minute']} requêtes")
            print(f"\n📈 Utilisation actuelle:")
            print(f"   - Crédits utilisés ce mois: {usage['current_month']['credits_used']}")
            print(f"   - Crédits restants: {usage['current_month']['credits_left']}")
            
        else:
            print(f"❌ Erreur: {response.status_code}")
            print(f"   Réponse: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False
    
    # Test 2: Récupérer le prix du Bitcoin
    print("\n\n💰 Test 2: Récupération du prix du Bitcoin")
    url = "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest"
    params = {
        "symbol": "BTC",
        "convert": "USD"
    }
    
    try:
        response = requests.get(url, headers=headers, params=params)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # V2 retourne un array
            btc_data = data["data"]["BTC"]
            if isinstance(btc_data, list):
                btc_data = btc_data[0]
            
            price = btc_data["quote"]["USD"]["price"]
            change_24h = btc_data["quote"]["USD"]["percent_change_24h"]
            market_cap = btc_data["quote"]["USD"]["market_cap"]
            
            print(f"✅ Prix récupéré avec succès!")
            print(f"\n📊 Bitcoin (BTC):")
            print(f"   - Prix: ${price:,.2f}")
            print(f"   - Change 24h: {change_24h:.2f}%")
            print(f"   - Market Cap: ${market_cap:,.0f}")
            
        else:
            print(f"❌ Erreur: {response.status_code}")
            print(f"   Réponse: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False
    
    # Test 3: Récupérer plusieurs cryptos en une fois
    print("\n\n🔄 Test 3: Récupération de plusieurs cryptos (Batching)")
    params = {
        "symbol": "BTC,ETH,BNB",
        "convert": "USD"
    }
    
    try:
        response = requests.get(url, headers=headers, params=params)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Données récupérées avec succès!")
            print(f"\n💎 Cryptomonnaies:")
            
            for symbol in ["BTC", "ETH", "BNB"]:
                crypto_data = data["data"][symbol]
                if isinstance(crypto_data, list):
                    crypto_data = crypto_data[0]
                
                name = crypto_data["name"]
                price = crypto_data["quote"]["USD"]["price"]
                print(f"   - {name} ({symbol}): ${price:,.2f}")
            
        else:
            print(f"❌ Erreur: {response.status_code}")
            print(f"   Réponse: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False
    
    print("\n\n✅ Tous les tests sont réussis! Votre API est prête à être utilisée.")
    return True


if __name__ == "__main__":
    test_api_connection()