from fastapi import FastAPI, UploadFile, File
import google.generativeai as genai
from PIL import Image
import io
import json
import os

app = FastAPI()

# Vercelの設定画面からキーを読み込む
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

@app.post("/api/analyze")
async def analyze_image(file: UploadFile = File(...)):
    if not GOOGLE_API_KEY:
        return {"error": "Server: API Key not found"}

    try:
        content = await file.read()
        image = Image.open(io.BytesIO(content))

        # Geminiへの指示（画像から枚数を読み取る）
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = """
        釣銭機の画面画像から各金種の枚数を読み取り、JSONで出力してください。
        画像には以下のような金種が表示されています：
        - 紙幣: 10000円、5000円、1000円
        - 硬貨: 500円、100円、50円、10円、5円、1円

        出力形式: {"10000": int, "5000": int, "1000": int, "500": int, "100": int, "50": int, "10": int, "5": int, "1": int}
        必ず数値のみを返してください。金種が表示されていない場合は0を返してください。
        JSONのみを出力し、マークダウン記法や説明文は不要です。
        """

        response = model.generate_content([prompt, image])
        text = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        return {"error": str(e)}
