import os
import firebase_admin
from firebase_admin import credentials, firestore
import google.generativeai as genai
import json
from datetime import datetime
import time

class GamificationAgent:
    def __init__(self):
        # Initialize Mock Data ALWAYS to prevent AttributeErrors if fallback happens mid-session
        self.mock_data = {
            "users": {},
            "questions": {},
            "progress": {}
        }
        self.db_available = False
        # Use a stable absolute path in the current working directory
        self.data_file = os.path.join(os.getcwd(), "gamification_data.json")
        self._load_local_data()
        print(f"[GamificationAgent] Data file path: {self.data_file}")
        
        # Path must be resolved relative to backend code (Windows-safe)
        SERVICE_ACCOUNT_PATH = os.path.join(
            os.path.dirname(__file__),
            "firebase-service-account.json"
        )
        
        try:
            # Check if file exists first
            if os.path.exists(SERVICE_ACCOUNT_PATH):
                # Explicitly load credentials
                if not firebase_admin._apps:
                    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
                    firebase_admin.initialize_app(cred)
                
                self.db = firestore.client()
                # Test connectivity with a dummy call
                self.db.collection("gamification_health").document("ping").get()
                self.db_available = True
                print("[Firebase] Firestore client initialized and verified successfully.")
            else:
                print(f"[Firebase] Service account file not found at {SERVICE_ACCOUNT_PATH}")

        except Exception as e:
            print(f"[Firebase] Firestore init/verify failed: {e}")
            self.db_available = False

        if not self.db_available:
            print("[Firebase] Falling back to in-memory mock store.")

        # Initialize Gemini
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            # Configure safety settings to ensure educational feedback isn't blocked
            safety_settings = [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]
            self.gemini_model = genai.GenerativeModel(
                'gemini-1.5-flash',
                safety_settings=safety_settings
            )
            self.gemini_available = True
            print("[GamificationAgent] Gemini 2.5 Flash configured.")
        else:
            print("[GamificationAgent] Warning: GEMINI_API_KEY not found.")
            self.gemini_available = False

    def _load_local_data(self):
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, "r") as f:
                    self.mock_data = json.load(f)
                print(f"[Gamification] Loaded local persistence from {self.data_file}")
            except Exception as e:
                print(f"[Gamification] Failed to load local data: {e}")

    def _save_local_data(self):
        try:
            with open(self.data_file, "w") as f:
                json.dump(self.mock_data, f, indent=4, default=str)
            print(f"[Gamification] Saved local data to {self.data_file}")
        except Exception as e:
            print(f"[Gamification] Failed to save local data: {e}")

    def get_user_status(self, user_id):
        if self.db_available:
            try:
                doc = self.db.collection("gamification_users").document(user_id).get()
                if doc.exists:
                    data = doc.to_dict()
                else:
                    data = {"level": 1, "xp": 0, "badges": []} 
                    self.db.collection("gamification_users").document(user_id).set(data)
                
                # Get topic difficulties
                topics_ref = self.db.collection("gamification_topic_progress").where("userId", "==", user_id).stream()
                topics = {}
                for t in topics_ref:
                    td = t.to_dict()
                    topics[td["topic"]] = td.get("current_difficulty", "easy")

                return {**data, "topics": topics}
            except Exception as e:
                print(f"[Gamification] Firestore query error in get_user_status: {e}")
        
        # Local JSON Fallback
        user = self.mock_data["users"].get(user_id, {"level": 1, "xp": 0, "badges": []})
        topics = {}
        for topic_id, data in self.mock_data["progress"].items():
            if data.get("userId") == user_id:
                topics[data["topic"]] = data.get("current_difficulty", "easy")
        
        # Default topics if none found
        if not topics:
            topics = {"Stocks": "easy", "Mutual Funds": "easy", "Banking": "easy", "Credit": "easy", "Risk": "easy"}
            
        return {**user, "topics": topics}

    def _normalize_text(self, text):
        if not text: return ""
        import re
        # Lowercase, remove non-alphanumeric, strip
        clean = re.sub(r'[^a-zA-Z0-9]', '', text.lower()).strip()
        return clean

    def fetch_questions(self, topic, user_id, limit=5):
        import random
        difficulty = "easy"
        seen_hashes = []
        doc_id = f"{user_id}_{topic}"
        
        # 1. Determine difficulty and seen hashes
        if self.db_available:
            try:
                prog_doc = self.db.collection("gamification_topic_progress").document(doc_id).get()
                if prog_doc.exists:
                    p_data = prog_doc.to_dict()
                    difficulty = p_data.get("current_difficulty", "easy")
                    seen_hashes = p_data.get("seen_question_hashes", [])
            except Exception as e:
                print(f"[Gamification] Error fetching progress: {e}")
        else:
            prog = self.mock_data["progress"].get(doc_id, {"current_difficulty": "easy", "seen_question_hashes": []})
            difficulty = prog.get("current_difficulty", "easy")
            seen_hashes = prog.get("seen_question_hashes", [])

        # 2. Try Cache (Firestore)
        final_questions = []
        if self.db_available:
            try:
                q_ref = self.db.collection("gamification_questions")\
                    .where("topic", "==", topic)\
                    .where("difficulty", "==", difficulty)\
                    .limit(50).stream()
                
                candidates = []
                for q in q_ref:
                    q_data = q.to_dict()
                    q_hash = self._normalize_text(q_data.get("question", ""))
                    if q_hash and q_hash not in seen_hashes:
                        candidates.append(q_data)
                
                if len(candidates) >= limit:
                    final_questions = random.sample(candidates, limit)
                    self._mark_as_seen(user_id, topic, final_questions)
                    return final_questions
            except Exception as e:
                print(f"[Gamification] Cache fetch error: {e}")

        # 3. Try Gemini
        if self.gemini_available:
            # Pass seen_hashes to Gemini would be too many tokens if the list is long
            # Instead, just ask it for NEW questions and filter results.
            generated = self._generate_questions_with_gemini(topic, difficulty, limit)
            if generated:
                filtered_gen = []
                for q in generated:
                    q_hash = self._normalize_text(q.get("question", ""))
                    if q_hash and q_hash not in seen_hashes:
                        filtered_gen.append(q)
                
                if filtered_gen:
                    # Store in DB if available
                    if self.db_available:
                        try:
                            batch = self.db.batch()
                            for q in filtered_gen:
                                ref = self.db.collection("gamification_questions").document()
                                q["source"] = "gemini"
                                q["topic"] = topic
                                q["difficulty"] = difficulty
                                batch.set(ref, q)
                            batch.commit()
                        except: pass
                    
                    self._mark_as_seen(user_id, topic, filtered_gen)
                    return filtered_gen

        # 4. Fallback Static
        fallbacks = self._get_fallback_questions(topic, difficulty)
        candidates = []
        for q in fallbacks:
            q_hash = self._normalize_text(q.get("question", ""))
            if q_hash not in seen_hashes:
                candidates.append(q)
        
        if not candidates: candidates = fallbacks # Reset only if absolute dead end
        
        selected = random.sample(candidates, min(len(candidates), limit))
        self._mark_as_seen(user_id, topic, selected)
        return selected

    def _mark_as_seen(self, user_id, topic, questions):
        if not questions: return
        doc_id = f"{user_id}_{topic}"
        new_hashes = [self._normalize_text(q.get("question", "")) for q in questions]
        new_hashes = [h for h in new_hashes if h] # Filter empty
        
        if self.db_available:
            try:
                self.db.collection("gamification_topic_progress").document(doc_id).set({
                    "seen_question_hashes": firestore.ArrayUnion(new_hashes)
                }, merge=True)
            except Exception as e:
                print(f"[Gamification] Error marking as seen: {e}")
        else:
            prog = self.mock_data["progress"].get(doc_id, {"userId": user_id, "topic": topic, "current_difficulty": "easy", "seen_question_hashes": []})
            existing = prog.get("seen_question_hashes", [])
            prog["seen_question_hashes"] = list(set(existing + new_hashes))
            self.mock_data["progress"][doc_id] = prog
            self._save_local_data()
        

    def submit_quiz(self, user_id, topic, attempted, correct):
        accuracy = (correct / attempted) * 100 if attempted > 0 else 0
        xp_earned = correct * 10
        
        difficulty_update = "maintained"
        new_difficulty = "easy"
        current_difficulty = "easy"
        
        doc_id = f"{user_id}_{topic}"
        current_difficulty = "easy"
        
        try:
            if self.db_available:
                doc_ref = self.db.collection("gamification_topic_progress").document(doc_id)
                prog_doc = doc_ref.get()
                if prog_doc.exists:
                    current_difficulty = prog_doc.to_dict().get("current_difficulty", "easy")
                
                doc_ref.set({
                    "userId": user_id,
                    "topic": topic,
                    "last_batch_accuracy": accuracy,
                    "attempts": firestore.Increment(1),
                    "correct_answers": firestore.Increment(correct),
                    "last_updated": datetime.now()
                }, merge=True)
            else:
                # Mock Update
                prog = self.mock_data["progress"].get(doc_id, {
                    "userId": user_id,
                    "topic": topic,
                    "current_difficulty": "easy", 
                    "attempts": 0, 
                    "correct_answers": 0
                })
                prog["last_batch_accuracy"] = accuracy
                prog["attempts"] += 1
                prog["correct_answers"] += correct
                self.mock_data["progress"][doc_id] = prog
                print(f"[Gamification] Updated mock progress for {doc_id}: acc={accuracy}")
                self._save_local_data()

            # 2. Update User Level/XP
            if self.db_available:
                user_ref = self.db.collection("gamification_users").document(user_id)
                user_doc = user_ref.get()
                current_xp = user_doc.to_dict().get("xp", 0) if user_doc.exists else 0
                
                new_xp = current_xp + xp_earned
                new_level = int((new_xp / 500) + 1)
                
                user_ref.set({
                    "xp": new_xp,
                    "level": new_level,
                    "last_active": datetime.now()
                }, merge=True)
            else:
                user_data = self.mock_data["users"].get(user_id, {"level": 1, "xp": 0, "badges": []})
                new_xp = user_data.get("xp", 0) + xp_earned
                new_level = int((new_xp / 500) + 1)
                self.mock_data["users"][user_id] = {
                    "xp": new_xp,
                    "level": new_level,
                    "badges": user_data.get("badges", []),
                    "last_active": datetime.now().isoformat()
                }
                self._save_local_data()
            
            return {
                "accuracy": accuracy,
                "xpEarned": xp_earned,
                "level": new_level,
                "correct": correct,
                "attempted": attempted
            }
        except Exception as e:
            print(f"[Gamification] Submission process failed: {e}")
            import traceback
            traceback.print_exc()
        
        # Final Fallback
        return {
            "accuracy": accuracy,
            "xpEarned": xp_earned,
            "level": 1,
            "correct": correct,
            "attempted": attempted
        }

    def continue_quiz(self, user_id, topic):
        # 1. Retrieve current difficulty and last accuracy using STABLE ID
        doc_id = f"{user_id}_{topic}"
        current_difficulty = "easy"
        last_accuracy = 100
        found = False
        
        try:
            if self.db_available:
                doc_ref = self.db.collection("gamification_topic_progress").document(doc_id)
                prog_doc = doc_ref.get()
                if prog_doc.exists:
                    data = prog_doc.to_dict()
                    current_difficulty = data.get("current_difficulty", "easy")
                    last_accuracy = data.get("last_batch_accuracy", 100)
                    found = True
            else:
                if doc_id in self.mock_data["progress"]:
                    data = self.mock_data["progress"][doc_id]
                    current_difficulty = data.get("current_difficulty", "easy")
                    last_accuracy = data.get("last_batch_accuracy", 100)
                    found = True

            if found:
                print(f"[DEBUG] ContinueQuiz: Retrieved difficulty={current_difficulty}, accuracy={last_accuracy}")

                # 2. Apply Adaptive Logic
                new_difficulty = current_difficulty
                if last_accuracy >= 80:
                    if current_difficulty == "easy": new_difficulty = "medium"
                    elif current_difficulty == "medium": new_difficulty = "hard"
                elif last_accuracy < 40:
                    if current_difficulty == "hard": new_difficulty = "medium"
                    elif current_difficulty == "medium": new_difficulty = "easy"

                # 3. Update Difficulty
                feedback = "Staying at current level"
                if new_difficulty != current_difficulty:
                    if self.db_available:
                        doc_ref.set({"current_difficulty": new_difficulty}, merge=True)
                    else:
                        self.mock_data["progress"][doc_id]["current_difficulty"] = new_difficulty
                        self._save_local_data()
                    current_difficulty = new_difficulty
                    
                    if new_difficulty == "medium" or new_difficulty == "hard":
                        feedback = "Leveling up!"
                    else:
                        feedback = "Reinforcing basics"
            else:
                print(f"[DEBUG] ContinueQuiz: Document {doc_id} not found.")

            # 4. Fetch Next Questions
            questions = self.fetch_questions(topic, user_id, limit=5)
            return {
                "questions": questions,
                "difficulty": current_difficulty,
                "feedback": feedback
            }

        except Exception as e:
            print(f"[Gamification] Continue quiz error: {e}")
            return {
                "questions": self.fetch_questions(topic, user_id, limit=5),
                "difficulty": "easy",
                "feedback": "Staying at current level"
            }

    def _call_gemini_with_retry(self, prompt, max_retries=3):
        if not self.gemini_available:
            return None
            
        retry_delay = 2 # Start with 2 seconds
        for attempt in range(max_retries):
            try:
                response = self.gemini_model.generate_content(prompt)
                if response and response.text:
                    return response.text
                print(f"[Gamification] Gemini returned empty response (Attempt {attempt+1})")
            except Exception as e:
                error_msg = str(e)
                if "429" in error_msg:
                    print(f"[Gamification] Rate limit hit (429). Retrying in {retry_delay}s... (Attempt {attempt+1})")
                    time.sleep(retry_delay)
                    retry_delay *= 2 # Exponential backoff
                else:
                    print(f"[Gamification] Gemini error: {error_msg}")
                    break # Don't retry for non-429 errors
                    
        return None

    def _generate_questions_with_gemini(self, topic, difficulty, limit=5):
        prompt = f"""
        You are a financial education expert. Generate {limit} multiple-choice questions for:
        Topic: {topic}
        Difficulty: {difficulty} (Levels: easy, medium, hard)

        Rules:
        - Ensure these are NEW and UNIQUE questions (do not repeat common basic concepts if possible).
        - 4 options per question.
        - Exactly ONE correct answer.
        - Provide a short explanation for the correct answer.
        - Return ONLY a JSON list of objects.

        Format:
        [
            {{
                "question": "...",
                "options": ["A", "B", "C", "D"],
                "correct_answer": "...",
                "explanation": "..."
            }}
        ]
        """
        text = self._call_gemini_with_retry(prompt)
        if not text:
            return None
            
        try:
            # Clean JSON markdown if present
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
            
            return json.loads(text.strip())
        except Exception as e:
            print(f"[Gamification] JSON parse error in generated questions: {e}")
            return None

    def get_detailed_explanation(self, question_text, options, correct_answer):
        q_hash = self._normalize_text(question_text)
        
        # 1. Check Cache
        if self.db_available:
            try:
                doc = self.db.collection("gamification_explanations").document(q_hash).get()
                if doc.exists:
                    return doc.to_dict().get("explanation")
            except: pass
        else:
            if "explanations" not in self.mock_data:
                self.mock_data["explanations"] = {}
            if q_hash in self.mock_data["explanations"]:
                return self.mock_data["explanations"][q_hash]

        # 2. Generate with Gemini
        prompt = f"""
        You are an expert financial educator. Provide a detailed explanation for this quiz question:
        
        Question: {question_text}
        Options: {", ".join(options)}
        Correct Answer: {correct_answer}

        Requirements:
        1. Explain WHY the correct option is correct.
        2. Briefly explain WHY the other options are incorrect.
        3. Use a supportive, clear tone.
        4. Max 3-4 sentences total.
        
        Example:
        Explanation: The correct answer is “Ownership in a company” because stocks represent equity ownership. Other options are incorrect as they describe debt instruments or savings products.
        """
        explanation = self._call_gemini_with_retry(prompt)
        
        if not explanation:
            # Fallback to existing explanation if available in mock/db but we are doing a fresh gen here
            explanation = f"The correct answer is {correct_answer}. Our AI mentor is currently fine-tuning its deep explanations."

        # 3. Store in Cache
        if self.db_available:
            try:
                self.db.collection("gamification_explanations").document(q_hash).set({
                    "explanation": explanation,
                    "question": question_text,
                    "options": options,
                    "correct_answer": correct_answer,
                    "created_at": datetime.now()
                })
            except: pass
        else:
            if "explanations" not in self.mock_data: self.mock_data["explanations"] = {}
            self.mock_data["explanations"][q_hash] = explanation
            self._save_local_data()
            
        return explanation

    def get_quiz_explanations(self, questions_and_answers):
        # questions_and_answers is a list of {question, options, selected, correct}
        if not questions_and_answers:
            print("[Gamification] Warning: Empty results sent for explanation.")
            return []

        print(f"[Gamification] Fetching/Generating detailed explanations for {len(questions_and_answers)} questions.")
        
        detailed_explanations = []
        for q in questions_and_answers:
            explanation = self.get_detailed_explanation(
                q.get("question"),
                q.get("options", []),
                q.get("correct")
            )
            detailed_explanations.append({
                "question": q.get("question"),
                "explanation": explanation
            })
            
        return detailed_explanations

    def _get_fallback_questions(self, topic, difficulty):
        # A larger set of static fallback questions to prevent immediate repetition
        return [
            {"question": f"What is a primary principle in {topic} Management?", "options": ["High Risk always", "Diversification", "Ignoring inflation", "Market Timing"], "correct_answer": "Diversification", "explanation": "Diversification helps spread risk across different assets."},
            {"question": f"At {difficulty} level, what is most important for {topic}?", "options": ["Consistency", "Speed", "Complex Math", "Luck"], "correct_answer": "Consistency", "explanation": "Regular monitoring and consistent strategy lead to better long-term outcomes."},
            {"question": f"In {topic}, which of these is usually considered lower risk?", "options": ["Penny Stocks", "Government Bonds", "Unregulated Startups", "Day Trading"], "correct_answer": "Government Bonds", "explanation": "Bonds issued by governments are generally more stable than speculative assets."},
            {"question": f"The term 'Compound Interest' in {topic} refers to:", "options": ["Interest on principal only", "Interest on interest", "Tax deductions", "Service charges"], "correct_answer": "Interest on interest", "explanation": "Compounding means you earn interest on both your initial investment and previous interest earned."},
            {"question": f"When researching {topic}, it's best to:", "options": ["Follow social media tips", "Analyze historical data", "Guess", "Ignore trends"], "correct_answer": "Analyze historical data", "explanation": "Data-driven decisions are more reliable in finance."},
            {"question": f"Which of these defines 'Liquidity' in {topic}?", "options": ["Ease of converting to cash", "Total debt amount", "Profit margin", "Tax rate"], "correct_answer": "Ease of converting to cash", "explanation": "Liquidity is how quickly an asset can be sold for cash without losing value."},
            {"question": f"A 'Balanced Portfolio' in {topic} typically includes:", "options": ["Only risky stocks", "Only cash", "A mix of asset classes", "One single bond"], "correct_answer": "A mix of asset classes", "explanation": "Balancing helps manage risk by not putting all your eggs in one basket."},
            {"question": f"In {topic}, 'Inflation' generally causes:", "options": ["Purchasing power to decrease", "Prices to drop", "Savings to grow faster", "Debt to disappear"], "correct_answer": "Purchasing power to decrease", "explanation": "Inflation means your money buys less over time."},
            {"question": f"The 'Rule of 72' in {topic} helps estimate:", "options": ["Time to double money", "Total tax due", "Daily stock changes", "Retirement age"], "correct_answer": "Time to double money", "explanation": "Dividing 72 by the annual interest rate gives the approximate years to double an investment."},
            {"question": f"What does 'ROI' stand for in {topic}?", "options": ["Rate of Inflation", "Return on Investment", "Risk of Interest", "Revenue over Income"], "correct_answer": "Return on Investment", "explanation": "ROI measures the gain or loss generated on an investment relative to its cost."},
            {"question": f"An 'Emergency Fund' for {topic} purposes should ideally cover:", "options": ["1 month of luxury", "3-6 months of expenses", "A down payment", "Holiday gifts"], "correct_answer": "3-6 months of expenses", "explanation": "This provides a safety net for unexpected financial shocks."},
            {"question": f"In {topic}, 'Diversification' is best described as:", "options": ["Spreading investments", "Focusing on one stock", "Saving in cash only", "Day trading"], "correct_answer": "Spreading investments", "explanation": "It reduces the impact of any single investment's poor performance."},
            {"question": f"At the {difficulty} stage, a key goal in {topic} is:", "options": ["Taking max risk", "Foundational knowledge", "Retiring tomorrow", "Market manipulation"], "correct_answer": "Foundational knowledge", "explanation": "Building a strong base is critical for long-term success."},
            {"question": f"Which of these is a 'Fixed Expense' in a {topic} budget?", "options": ["Movie tickets", "Rent/Mortgage", "Dining out", "New clothes"], "correct_answer": "Rent/Mortgage", "explanation": "Fixed expenses stay relatively constant each month."},
            {"question": f"The concept of 'Time Value of Money' suggests:", "options": ["Money today is worth more than tomorrow", "Time is free", "Money grows linearly", "Wait as long as possible"], "correct_answer": "Money today is worth more than tomorrow", "explanation": "Because of potential earning capacity, money now is more valuable than the same amount later."}
        ]
