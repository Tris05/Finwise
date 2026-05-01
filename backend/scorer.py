from datetime import datetime
from typing import Dict, List, Tuple
import re


def score_financial_fields(fields: Dict) -> Tuple[int, List[str], List[Dict]]:
    """
    Extended scorer for:
    - financial docs
    - offer letters / contracts
    Returns: (score, reasons, risk_details)
    """

    score = 0
    reasons = []
    risk_details = []

    text = fields.get("full_text", "").lower()

    # -------------------------
    # 🪪 1. BASIC STRUCTURE CHECK
    # -------------------------
    if not re.search(r'(company|ltd|pvt|inc|llc)', text):
        score += 20
        reasons.append("Company identity not clearly mentioned")

    if not re.search(r'(offer letter|employment|agreement|contract)', text):
        score += 10
        reasons.append("Document type unclear")

    if not re.search(r'(signature|signed|authorized)', text):
        score += 20
        reasons.append("No signature or authorization detected")

    if not re.search(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', text):
        score += 10
        reasons.append("No valid date found in document")

    # -------------------------
    # 💰 2. SALARY / COMPENSATION
    # -------------------------
    salary_patterns = [
        r'₹\s?\d+',
        r'\d+\s?(lpa|per annum|per year|salary)'
    ]

    salary_found = any(re.search(p, text) for p in salary_patterns)

    if not salary_found:
        score += 30
        reasons.append("Salary/compensation not clearly defined")

    if "ctc" in text and "variable" in text:
        score += 20
        reasons.append("CTC includes variable component — actual pay may be lower")

    if "bonus" in text and "discretion" in text:
        score += 15
        reasons.append("Bonus is discretionary (not guaranteed)")

    # -------------------------
    # ⚖️ 3. LEGAL / CONTRACT RISKS
    # -------------------------
    risky_clauses = {
        "terminate without notice": {"points": 40, "level": "high"},
        "at sole discretion": {"points": 30, "level": "high"},
        "without liability": {"points": 35, "level": "high"},
        "company reserves the right": {"points": 20, "level": "medium"},
        "non-compete": {"points": 25, "level": "medium"},
        "bond": {"points": 30, "level": "medium"},
        "penalty": {"points": 25, "level": "medium"},
        "liquidated damages": {"points": 35, "level": "high"}
    }

    for clause, info in risky_clauses.items():
        if clause in text:
            score += info["points"]
            reasons.append(f"Risky clause detected: '{clause}'")
            risk_details.append({
                "clause": clause,
                "risk_level": info["level"],
                "points": info["points"],
                "category": "legal_risk"
            })

    # -------------------------
    # ⚠️ 4. AMBIGUOUS LANGUAGE
    # -------------------------
    vague_terms = [
        {"term": "subject to change", "level": "medium"},
        {"term": "may be revised", "level": "medium"},
        {"term": "as applicable", "level": "low"},
        {"term": "not guaranteed", "level": "medium"},
        {"term": "based on performance", "level": "low"}
    ]

    for item in vague_terms:
        if item["term"] in text:
            score += 15
            reasons.append(f"Ambiguous condition: '{item['term']}'")
            risk_details.append({
                "clause": item["term"],
                "risk_level": item["level"],
                "points": 15,
                "category": "ambiguous_language"
            })

    # -------------------------
    # 📅 5. ROLE & STRUCTURE
    # -------------------------
    if not re.search(r'(position|role|designation)', text):
        score += 15
        reasons.append("Job role/designation not clearly defined")

    if not re.search(r'(start date|joining date)', text):
        score += 15
        reasons.append("Start/joining date missing")

    if not re.search(r'(duration|contract period|months|years)', text):
        score += 10
        reasons.append("Contract duration not specified")

    # -------------------------
    # 🧾 6. FINANCIAL RULES (your original ones)
    # -------------------------
    total_due = fields.get("total_due")
    credit_limit = fields.get("credit_limit")

    try:
        if total_due and credit_limit:
            util = (float(total_due) / float(credit_limit)) * 100
            if util > 80:
                score += 40
                reasons.append(f"High financial utilization ({util:.0f}%)")
    except:
        pass

    # -------------------------
    # 🚨 7. FRAUD / SCAM SIGNALS
    # -------------------------
    scam_signals = [
        {"signal": "pay registration fee", "level": "high"},
        {"signal": "training fee", "level": "high"},
        {"signal": "deposit required", "level": "high"},
        {"signal": "processing fee", "level": "high"},
        {"signal": "payment before joining", "level": "high"}
    ]

    for item in scam_signals:
        if item["signal"] in text:
            score += 80
            reasons.append(f"Potential scam indicator: '{item['signal']}'")
            risk_details.append({
                "clause": item["signal"],
                "risk_level": item["level"],
                "points": 80,
                "category": "scam_indicator"
            })

    # -------------------------
    # FINAL NORMALIZATION
    # -------------------------
    score = min(100, max(0, score))

    if not reasons:
        reasons.append("No major risks detected (low risk document)")

    return score, reasons, risk_details