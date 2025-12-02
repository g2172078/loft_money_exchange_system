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
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = """
        釣銭機の画面画像から各金種の枚数を読み取り、JSONで出力してください。
        画像には以下のような金種が表示されています：
        - 紙幣: 10000円、5000円、1000円
        - 硬貨: 500円、100円、50円、10円、5円、1円

        出力形式: {"10000": 0, "5000": 0, "1000": 0, "500": 0, "100": 0, "50": 0, "10": 0, "5": 0, "1": 0}
        上記の形式で、各金種の枚数を数値で返してください。
        金種が表示されていない場合は0を返してください。
        必ず有効なJSONのみを出力し、マークダウン記法や説明文は一切含めないでください。
        """

        response = model.generate_content([prompt, image])
        text = response.text.strip()

        # マークダウンのコードブロックを削除
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text
        if text.endswith("```"):
            text = text.rsplit("\n", 1)[0] if "\n" in text else text
        text = text.replace("```json", "").replace("```", "").strip()

        # JSONをパース
        result = json.loads(text)

        # すべてのキーが存在することを確認
        required_keys = ["10000", "5000", "1000", "500", "100", "50", "10", "5", "1"]
        for key in required_keys:
            if key not in result:
                result[key] = 0

        return result
    except json.JSONDecodeError as e:
        return {"error": f"JSON解析エラー: {str(e)}. 受信テキスト: {text[:200]}"}
    except Exception as e:
        return {"error": f"処理エラー: {str(e)}"}
