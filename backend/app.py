# frontend/backend/app.py
import os
import base64
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from PIL import Image
from io import BytesIO
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Local modules
from ocr import pdf_to_images, image_ocr_words
from layout_model import LayoutModel
from extractor import extract_from_text
from scorer import score_financial_fields
from gamification_agent import GamificationAgent

app = Flask(__name__, static_folder="static")
CORS(app)  # allow cross-origin requests from frontend

# Initialize Agents
gamification_agent = GamificationAgent()

POPPLER_PATH = None  # set if needed on Windows
layout_model = LayoutModel(device="cpu")

@app.route("/")
def index():
    return jsonify({"ok": True, "message": "FinWise backend running"})

# --- Gamification Routes ---
@app.route("/api/gamification/user/status", methods=["GET"])
def get_user_status():
    print(f"[DEBUG] Route /user/status called")
    user_id = request.args.get("userId", "test_user_123")
    status = gamification_agent.get_user_status(user_id)
    return jsonify(status)

@app.route("/api/gamification/questions", methods=["GET"])
def get_questions():
    topic = request.args.get("topic")
    limit = int(request.args.get("limit", 5))
    user_id = request.args.get("userId", "test_user_123")
    
    if not topic:
        return jsonify({"error": "Topic is required"}), 400
        
    questions = gamification_agent.fetch_questions(topic, user_id, limit)
    return jsonify({"questions": questions})

@app.route("/api/gamification/quiz/submit", methods=["POST"])
def submit_quiz():
    print(f"[DEBUG] Route /quiz/submit called")
    data = request.json
    user_id = data.get("userId", "test_user_123")
    topic = data.get("topic")
    attempted = data.get("attempted", 0)
    correct = data.get("correct", 0)
    
    if not topic:
        return jsonify({"error": "Topic is required"}), 400
        
    result = gamification_agent.submit_quiz(user_id, topic, attempted, correct)
    return jsonify(result)

@app.route("/api/gamification/quiz/explain", methods=["POST"])
def explain_quiz():
    data = request.json
    results = data.get("results", [])
    explanation = gamification_agent.get_quiz_explanations(results)
    return jsonify({"explanation": explanation})

@app.route("/api/gamification/quiz/continue", methods=["POST"])
def continue_quiz():
    print(f"[DEBUG] Route /quiz/continue called")
    data = request.json
    user_id = data.get("userId", "test_user_123")
    topic = data.get("topic")
    
    if not topic:
        return jsonify({"error": "Topic is required"}), 400
        
    result = gamification_agent.continue_quiz(user_id, topic)
    return jsonify(result)

# --- Financial Analysis Route ---
@app.route("/analyze", methods=["POST"])
def analyze():
    if "file" not in request.files:
        return jsonify({"error": "no file part 'file'"}), 400

    f = request.files["file"]
    filename = (f.filename or "").lower()
    buf = f.read()

    # convert file -> list of PIL pages
    if filename.endswith(".pdf"):
        tmp_path = "tmp_upload.pdf"
        with open(tmp_path, "wb") as fw:
            fw.write(buf)
        pages = pdf_to_images(tmp_path, poppler_path=POPPLER_PATH)
        try:
            os.remove(tmp_path)
        except:
            pass
    else:
        img = Image.open(BytesIO(buf)).convert("RGB")
        pages = [img]

    all_entities = []
    combined_text = ""

    for p_idx, page_img in enumerate(pages):
        txt, words = image_ocr_words(page_img, page=p_idx)
        combined_text += "\n" + txt

        entities = layout_model.predict_entities(page_img, words)
        for e in entities:
            e["page"] = p_idx
        all_entities.extend(entities)

    regex_fields = extract_from_text(combined_text)
    regex_fields["full_text"] = combined_text

    score, reasons = score_financial_fields(regex_fields)
    
    page_images = []
    for p_idx, page_img in enumerate(pages):
        buffer = BytesIO()
        page_img.save(buffer, format="PNG")
        b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        page_images.append({
            "page": p_idx,
            "image": b64,
            "width": page_img.width,
            "height": page_img.height
        })

    risky_texts = {str(v).lower() for v in regex_fields.values() if isinstance(v, (str, int, float))}
    for e in all_entities:
        text = str(e.get("text", "")).lower()
        e["risky"] = any(rt in text for rt in risky_texts)

    out = {
        "ocr_text": combined_text,
        "entities_model": all_entities,
        "regex_fields": regex_fields,
        "risk_score": score,
        "risk_reasons": reasons,
        "page_images": page_images
    }
    return jsonify(out)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
