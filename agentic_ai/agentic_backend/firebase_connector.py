import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1.base_query import FieldFilter
import json
import time
import sys
from pathlib import Path

# Add agents directory to sys.path
root_dir = Path(__file__).parent.parent.absolute()
agents_dir = root_dir / "agents"
sys.path.insert(0, str(agents_dir))

from orchestration_agent import OrchestrationAgent

def initialize_firebase():
    """
    Initialize Firebase Admin SDK.
    Requires a serviceAccountKey.json file.
    Checks multiple locations to ensure the key is found.
    """
    try:
        # Check for service account key in various locations
        search_paths = [
            Path(__file__).parent / "serviceAccountKey.json",  # Same folder
            Path(__file__).parent.parent / "serviceAccountKey.json", # agentic_ai/
            root_dir / "serviceAccountKey.json", # Finwise/ (Project Root)
            Path.cwd() / "serviceAccountKey.json", # Current Working Dir
        ]
        
        cred_path = None
        for path in search_paths:
            if path.exists():
                cred_path = path
                break
        
        if not cred_path:
            print("Error: serviceAccountKey.json not found.")
            print(f"Checked in: {[str(p) for p in search_paths]}")
            print("Please download it from Firebase Console -> Project Settings -> Service Accounts.")
            return None

        print(f"Using Firebase credentials from: {cred_path}")
        cred = credentials.Certificate(str(cred_path))
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
            # Calculate current value: quantity * currentPrice
            # If currentPrice is not direct, use investedAmount as fallback
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
    
    # Extract user_id from path: users/{user_id}/portfolio_requests/{doc_id}
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
    
    # 1. Update status to 'processing'
    doc_ref.update({"status": "processing"})
    
    try:
        # 2. Fetch REAL portfolio data for THIS user
        real_portfolio, count = fetch_user_portfolio(db, user_id)
        
        if count == 0 or real_portfolio is None:
            # Requirement 7: Return safe fallback if no portfolio exists
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

        # 3. Extract input data and merge with real portfolio
        user_input = data.get("input", {})
        if "financial_details" not in user_input:
            user_input["financial_details"] = {}
        
        # Override any existing (dummy/manual) investments with real DB data
        user_input["financial_details"]["existing_investments"] = real_portfolio
        
        # 4. Run Orchestration Agent
        result = orchestrator.execute_portfolio_optimization(user_input)
        
        # 5. Update document with result and status 'completed'
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
        return

    orchestrator = OrchestrationAgent(max_iterations=2)
    print("Agentic AI Listener started. Waiting for requests...")

    # Collection reference
    # Recommendation: Query for status == 'pending' if you don't want to listen to everything
    requests_query = db.collection_group("portfolio_requests").where(filter=FieldFilter("status", "==", "pending"))

    def on_snapshot(col_snapshot, changes, read_time):
        for change in changes:
            if change.type.name == 'ADDED':
                # Process new pending requests
                process_request(change.document, orchestrator, db)

    # Watch the collection
    query_watch = requests_query.on_snapshot(on_snapshot)

    # Keep the script running
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        query_watch.unsubscribe()
        print("Listener stopped.")

if __name__ == "__main__":
    start_listener()
