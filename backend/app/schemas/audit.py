"""
Audit log schemas.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime
    actor: str
    action: str
    target_reference: str
    status: str
    safe_metadata: Optional[str] = None
