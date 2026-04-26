"""
AI-Legis: Copyright Service
Handles the logic for copyright application processing and status tracking.
"""
import uuid
from datetime import datetime
from typing import Dict, List, Optional

class CopyrightService:
    def __init__(self):
        # In a real app, this would be a database table
        self.registrations = {}

    def apply_for_copyright(self, user_id: str, title: str, author: str, work_type: str, description: str) -> Dict:
        """
        Creates a new copyright application record.
        """
        application_id = f"CP-{uuid.uuid4().hex[:8].upper()}"
        
        application = {
            "id": application_id,
            "user_id": user_id,
            "title": title,
            "author": author,
            "work_type": work_type,
            "description": description,
            "status": "Pending Review",
            "created_at": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat(),
            "filing_number": f"IN-COP-{datetime.now().year}-{uuid.uuid4().hex[:4].upper()}"
        }
        
        self.registrations[application_id] = application
        return application

    def get_status(self, application_id: str) -> Optional[Dict]:
        """
        Retrieves the status of a copyright application.
        """
        return self.registrations.get(application_id)

    def get_user_applications(self, user_id: str) -> List[Dict]:
        """
        Returns all copyright applications for a specific user.
        """
        return [app for app in self.registrations.values() if app["user_id"] == user_id]

# Singleton instance
copyright_service = CopyrightService()
