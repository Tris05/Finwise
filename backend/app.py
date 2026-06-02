## frontend/backend/app.py
import os
import base64
import re
import json
import time
import sys
import threading
import urllib.request
import urllib.error
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from PIL import Image
from io import BytesIO

# Firebase dependencies
import firebase_admin
from firebase_admin import credentials, firestore

# Local modules
from ocr import pdf_to_images, image_ocr_words
from layout_model import LayoutModel
from extractor import extract_from_text
from scorer import score_financial_fields

app = Flask(__name__, static_folder="static")
CORS(app, resources={r"/*": {"origins": "*"}}) 

POPPLER_PATH = r"C:\poppler\poppler-25.12.0\Library\bin"  # set if needed on Windows
layout_model = LayoutModel(device="cpu")  # change to "cuda" if you have GPU and torch GPU available

# Setup paths for Orchestration Agent
backend_dir = Path(__file__).parent.absolute()
root_dir = backend_dir.parent
agents_dir = root_dir / "agentic_ai" / "agents"
if str(agents_dir) not in sys.path:
    sys.path.insert(0, str(agents_dir))

# Try to load OrchestrationAgent
try:
    from orchestration_agent import OrchestrationAgent
except ImportError as e:
    print(f"Warning: Could not import OrchestrationAgent from {agents_dir}: {e}")
    OrchestrationAgent = None

# Try to load AdvisorScenarioEngine
try:
    from advisor_scenario_engine import AdvisorScenarioEngine
except ImportError as e:
    print(f"Warning: Could not import AdvisorScenarioEngine from {agents_dir}: {e}")
    AdvisorScenarioEngine = None

try:
    from google.cloud.firestore_v1.base_query import FieldFilter
except ImportError:
    try:
        from google.cloud.firestore_v1.query import FieldFilter
    except ImportError:
        FieldFilter = None

# --- ENVIRONMENT VARIABLES LOADER ---
env_paths = [
    root_dir / ".env",
    backend_dir / ".env",
    Path.cwd() / ".env"
]
for p in env_paths:
    if p.exists():
        print(f"Loading environment variables from: {p}")
        try:
            with open(p, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    line = line.strip()
                    if "=" in line and not line.startswith("#"):
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip("'\"")
                        if k:
                            os.environ[k] = v
        except Exception as e:
            print(f"Error loading env file {p}: {e}")

# --- COMPLETE PII REDACTER ---
def redact_sensitive_info(text: str) -> str:
    if not text:
        return ""
    
    # 1. Email Addresses
    text = re.sub(r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b', '[EMAIL REDACTED]', text)
    
    # 2. Phone Numbers (Indian mobile numbers, international, standard formats)
    text = re.sub(r'\b(?:\+91[\-\s]?)?[6-9]\d{9}\b', '[PHONE REDACTED]', text)
    text = re.sub(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b', '[PHONE REDACTED]', text)
    
    # 3. PAN (Indian Permanent Account Number)
    text = re.sub(r'\b[A-Z]{5}[0-9]{4}[A-Z]\b', '[PAN REDACTED]', text)
    
    # 4. Aadhaar Numbers (Indian National ID)
    text = re.sub(r'\b\d{4}\s\d{4}\s\d{4}\b', '[AADHAAR REDACTED]', text)
    text = re.sub(r'\b\d{12}\b', '[AADHAAR REDACTED]', text)
    
    # 5. Credit/Debit Card Numbers
    text = re.sub(r'\b(?:\d{4}[-\s]?){3}\d{4,7}\b', '[CREDIT_CARD REDACTED]', text)
    
    # 6. Bank Account Numbers (sequences of 9 to 18 digits)
    text = re.sub(r'\b\d{9,18}\b', '[ACCOUNT REDACTED]', text)
    
    # 7. Indian PIN codes / Postal codes
    text = re.sub(r'\b[1-9][0-9]{5}\b', '[PINCODE REDACTED]', text)
    # US Zip codes
    text = re.sub(r'\b\d{5}(?:-\d{4})?\b', '[ZIPCODE REDACTED]', text)
    
    # 8. Passport Numbers
    text = re.sub(r'\b[A-Z][0-9]{7}\b', '[PASSPORT REDACTED]', text)
    
    # 9. Names preceded by label prefixes (Name: Trish, Customer: John)
    text = re.sub(
        r'(?i)\b(name|holder|customer|employee|client|patient|attention|attn|proprietor|nominee)\b\s*[:\-]\s*([A-Za-z]+(?:\s+[A-Za-z]+){1,3})',
        r'\1: [NAME REDACTED]',
        text
    )
    
    # 10. Address blocks
    text = re.sub(
        r'(?i)\b(address|residence|location|billing address|shipping address)\b\s*[:\-]\s*([^\n]+(?:\n[^\n]+){0,2})',
        r'\1: [ADDRESS REDACTED]',
        text
    )
    
    return text

# --- GEMINI JARGON SUMMARIZER ---
def generate_jargon_summary(text: str, api_key: str) -> dict:
    if not api_key:
        print("Gemini API call skipped: GEMINI_API_KEY is not set.")
        return {
            "simple_summary": "Skipped generating AI summary because GEMINI_API_KEY is missing.",
            "importance": "Missing API Key",
            "risky_clauses": ["N/A"],
            "alternatives": ["Please configure GEMINI_API_KEY in your environment/dotenv file."]
        }

    prompt = f"""
Analyze the following document text and provide a structured JSON response.
Translate all financial and technical jargon to simple, short, and understandable words.
Focus on identifying and highlighting key elements: Importance, Risky Clauses, and Alternatives.
Since the original text was automatically redacted to remove sensitive personal data (like names, emails, phones, accounts, PAN, Aadhaar), do not worry about missing identifiers.

Document text:
\"\"\"
{text}
\"\"\"

Return ONLY a JSON object (no markdown code blocks, no backticks, just raw JSON) matching this structure:
{{
  "simple_summary": "A brief, 2-3 sentence overview of the document in plain English/Hindi-influenced simple terminology, translating all technical jargon into easy words.",
  "importance": "Explain why this document matters, what it represents, and its key highlights.",
  "risky_clauses": [
    "List specific potential risky terms, clauses, or indicators found in the document, described in simple terms.",
    "If none are found, list standard things to watch out for in this type of document."
  ],
  "alternatives": [
    "Provide clear, actionable alternative paths, strategies, or next steps to mitigate risks or optimize outcomes.",
    "e.g. negotiation points, alternative products, actions the user can take."
  ]
}}
"""

    req_data = {
        "contents": [{
            "role": "user",
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "response_mime_type": "application/json"
        }
    }
    
    req_body = json.dumps(req_data).encode("utf-8")
    
    for model_attempt in ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"]:
        try:
            url_attempt = f"https://generativelanguage.googleapis.com/v1beta/models/{model_attempt}:generateContent?key={api_key}"
            req = urllib.request.Request(
                url_attempt,
                data=req_body,
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=25) as response:
                resp_data = json.loads(response.read().decode("utf-8"))
                raw_text = resp_data['candidates'][0]['content']['parts'][0]['text'].strip()
                
                # Remove markdown fences if model returned them
                if raw_text.startswith("```"):
                    lines = raw_text.splitlines()
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines[-1].startswith("```"):
                        lines = lines[:-1]
                    raw_text = "\n".join(lines).strip()
                
                return json.loads(raw_text)
        except Exception as e:
            print(f"Gemini API call with model {model_attempt} failed: {e}")
            continue

    return {
        "simple_summary": "Failed to generate AI summary. Please check your Gemini API key and connection.",
        "importance": "N/A",
        "risky_clauses": ["Could not parse risky clauses."],
        "alternatives": ["Please retry uploading."]
    }

# --- FIREBASE CONNECTOR LOGIC (COMBINED) ---
def initialize_firebase():
    """
    Initialize Firebase Admin SDK.
    Requires a serviceAccountKey.json file.
    Checks multiple locations to ensure the key is found.
    """
    try:
        search_paths = [
            backend_dir / "serviceAccountKey.json",
            root_dir / "agentic_ai" / "agentic_backend" / "serviceAccountKey.json",
            root_dir / "agentic_ai" / "serviceAccountKey.json",
            root_dir / "serviceAccountKey.json",
            Path.cwd() / "serviceAccountKey.json",
        ]
        
        cred_path = None
        for path in search_paths:
            if path.exists():
                cred_path = path
                break
        
        if not cred_path:
            print("Error: serviceAccountKey.json not found.")
            print(f"Checked in: {[str(p) for p in search_paths]}")
            return None

        print(f"Using Firebase credentials from: {cred_path}")
        cred = credentials.Certificate(str(cred_path))
        try:
            firebase_admin.get_app()
        except ValueError:
            firebase_admin.initialize_app(cred)
        return firestore.client()
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return None

def fetch_user_portfolio(db, user_id):
    """
    Fetch all assets from the user's portfolio and aggregate by category.
    """
    try:
        portfolio_ref = db.collection("users").document(user_id).collection("portfolio")
        docs = portfolio_ref.stream()
        
        aggregated = {
            "stocks": 0.0,
            "mutual_funds": 0.0,
            "fd_ppf": 0.0,
            "crypto": 0.0,
            "gold": 0.0
        }
        
        count = 0
        for doc in docs:
            data = doc.to_dict()
            category = data.get("category", "").lower()
            qty = float(data.get("quantity", 0))
            price = float(data.get("currentPrice", 0))
            value = qty * price if qty and price else float(data.get("investedAmount", 0))
            
            if category in ["equity", "stocks"]:
                aggregated["stocks"] += value
            elif category in ["mutual fund", "mutual_funds"]:
                aggregated["mutual_funds"] += value
            elif category in ["stable", "fixed income", "fd_ppf"]:
                aggregated["fd_ppf"] += value
            elif category == "crypto":
                aggregated["crypto"] += value
            elif category in ["commodity", "gold"]:
                aggregated["gold"] += value
            count += 1
            
        return aggregated, count
    except Exception as e:
        print(f"Error fetching portfolio for {user_id}: {e}")
        return None, 0

def process_request(doc_snapshot, orchestrator, db):
    """
    Process a single Firestore document that is in 'pending' status.
    Uses real user portfolio data from the database.
    """
    data = doc_snapshot.to_dict()
    doc_ref = doc_snapshot.reference
    
    path_parts = doc_ref.path.split('/')
    if len(path_parts) >= 2 and path_parts[0] == 'users':
        user_id = path_parts[1]
    else:
        print(f"Error: Could not determine user_id from path {doc_ref.path}")
        doc_ref.update({
            "status": "error",
            "error": "Invalid document path structure",
            "processed_at": firestore.SERVER_TIMESTAMP
        })
        return

    print(f"Processing request: {doc_snapshot.id} for user: {user_id}")
    doc_ref.update({"status": "processing"})
    
    try:
        real_portfolio, count = fetch_user_portfolio(db, user_id)
        if count == 0 or real_portfolio is None:
            print(f"No portfolio data found for user {user_id}")
            doc_ref.update({
                "output": {
                    "message": "No portfolio data found for the current user.",
                    "status": "no_data"
                },
                "status": "completed",
                "processed_at": firestore.SERVER_TIMESTAMP
            })
            return

        user_input = data.get("input", {})
        if "financial_details" not in user_input:
            user_input["financial_details"] = {}
        
        user_input["financial_details"]["existing_investments"] = real_portfolio
        result = orchestrator.execute_portfolio_optimization(user_input)
        
        doc_ref.update({
            "output": result,
            "status": "completed",
            "processed_at": firestore.SERVER_TIMESTAMP
        })
        print(f"Successfully processed: {doc_snapshot.id}")
        
    except Exception as e:
        print(f"Error processing {doc_snapshot.id}: {e}")
        doc_ref.update({
            "status": "error",
            "error": str(e),
            "processed_at": firestore.SERVER_TIMESTAMP
        })

def start_listener():
    """
    Start a Firestore listener on the 'portfolio_requests' collection.
    """
    db = initialize_firebase()
    if not db:
        print("Cannot start Firebase listener: db initialization failed.")
        return

    if OrchestrationAgent is None:
        print("Cannot start listener: OrchestrationAgent is not imported.")
        return

    orchestrator = OrchestrationAgent(max_iterations=2)
    print("Agentic AI Listener started. Waiting for requests...")

    if FieldFilter is None:
        print("FieldFilter is not available, listener cannot filter correctly.")
        return
        
    requests_query = db.collection_group("portfolio_requests").where(filter=FieldFilter("status", "==", "pending"))

    def on_snapshot(col_snapshot, changes, read_time):
        for change in changes:
            if change.type.name == 'ADDED':
                process_request(change.document, orchestrator, db)

    query_watch = requests_query.on_snapshot(on_snapshot)
    
    try:
        while True:
            time.sleep(1)
    except Exception as e:
        print(f"Background listener thread encountered error: {e}")
    finally:
        try:
            query_watch.unsubscribe()
        except:
            pass
        print("Listener stopped.")

# --- FLASK FLUX ROUTES ---
@app.route("/")
def index():
    return jsonify({"ok": True, "message": "FinWise backend running with integrated Firebase listener"})

@app.route("/simulate_scenario", methods=["POST", "OPTIONS"])
def simulate_scenario():
    if request.method == "OPTIONS":
        return "", 200
        
    if AdvisorScenarioEngine is None:
        return jsonify({"error": "AdvisorScenarioEngine not loaded on backend."}), 500
        
    data = request.json or {}
    user_id = data.get("user_id")
    intent = data.get("intent")
    
    if not user_id or not intent:
        return jsonify({"error": "Missing user_id or intent in request body"}), 400
        
    try:
        engine = AdvisorScenarioEngine()
        result = engine.execute_scenario(user_id, intent)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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

    score, reasons, risk_details = score_financial_fields(regex_fields)
    
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

    # Assign risk levels to entities based on detected risky clauses
    for e in all_entities:
        text = str(e.get("text", "")).lower()
        e["risk_level"] = "low"  # default
        e["risky"] = False
        
        for risk_detail in risk_details:
            if risk_detail["clause"] in text:
                e["risk_level"] = risk_detail["risk_level"]
                e["risky"] = True
                e["risk_category"] = risk_detail["category"]
                e["risk_points"] = risk_detail["points"]
                break

    # 1. Complete Redaction locally
    redacted_text = redact_sensitive_info(combined_text)
    
    # 2. Call Gemini for jargon summary, importance, risky clauses, alternatives
    api_key = os.getenv("GEMINI_API_KEY")
    jargon_summary = generate_jargon_summary(redacted_text, api_key)

    out = {
        "ocr_text": combined_text,
        "entities_model": all_entities,
        "regex_fields": regex_fields,
        "risk_score": score,
        "risk_reasons": reasons,
        "risk_details": risk_details,
        "page_images": page_images,
        "jargon_summary": jargon_summary
    }
    return jsonify(out)

if __name__ == "__main__":
    # Start the Firebase listener in a background daemon thread (only once, ignoring reloader child processes)
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true" or not app.debug:
        print("Starting background Firebase listener thread...")
        listener_thread = threading.Thread(target=start_listener, daemon=True)
        listener_thread.start()
    else:
        print("Skipping background thread start in parent reloader process.")
        
    app.run(host="0.0.0.0", port=8000, debug=True)

