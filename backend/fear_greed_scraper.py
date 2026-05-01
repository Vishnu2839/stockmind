import requests

def get_fear_greed() -> dict:
    url = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata"
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        r = requests.get(url, headers=headers, timeout=5)
        if r.status_code == 200:
            data = r.json()
            score = data.get("fear_and_greed", {}).get("score", 50.0)
            return {"fear_greed_score": round(score, 1)}
    except Exception as e:
        print(f"Fear/Greed fallback: {e}")
    return {"fear_greed_score": 50.0}
