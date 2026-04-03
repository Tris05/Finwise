import firebase_admin
from firebase_admin import credentials, firestore
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
    Requires a serviceAccountKey.json file in the root or backend directory.
    """
    try:
        # Check for service account key in backend/ or root
        cred_path = Path(__file__).parent / "serviceAccountKey.json"
        if not cred_path.exists():
            cred_path = root_dir / "serviceAccountKey.json"
        
        if not cred_path.exists():
            print("Error: serviceAccountKey.json not found.")
            print("Please download it from Firebase Console -> Project Settings -> Service Accounts.")
            return None

        cred = credentials.Certificate(str(cred_path))
        firebase_admin.initialize_app(cred)
        return firestore.client()
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return None

def process_request(doc_snapshot, orchestrator, db):
    """
    Process a single Firestore document that is in 'pending' status.
    """
    data = doc_snapshot.to_dict()
    doc_ref = doc_snapshot.reference
    
    print(f"Processing request: {doc_snapshot.id}")
    
    # 1. Update status to 'processing'
    doc_ref.update({"status": "processing"})
    
    try:
        # 2. Extract input data
        # Mapping frontend structure to OrchestrationAgent expected structure
        user_input = data.get("input", {})
        
        # 3. Run Orchestration Agent
        result = orchestrator.execute_portfolio_optimization(user_input)
        
        # 4. Update document with result and status 'completed'
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
    requests_query = db.collection_group("portfolio_requests").where("status", "==", "pending")

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
