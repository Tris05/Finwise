# frontend/backend/app.py
import os
import base64
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from PIL import Image
from io import BytesIO

# Local modules (copy the other .py files into same folder)
from ocr import pdf_to_images, image_ocr_words
from layout_model import LayoutModel
from extractor import extract_from_text
from scorer import score_financial_fields

app = Flask(__name__, static_folder="static")
CORS(app, resources={r"/*": {"origins": "*"}}) 

POPPLER_PATH = r"C:\poppler\poppler-25.12.0\Library\bin"  # set if needed on Windows
layout_model = LayoutModel(device="cpu")  # change to "cuda" if you have GPU and torch GPU available

@app.route("/")
def index():
    return jsonify({"ok": True, "message": "FinWise backend running"})

@app.route("/analyze", methods=["POST", "OPTIONS"])
def analyze():
    if request.method == "OPTIONS":
        return "", 200
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
