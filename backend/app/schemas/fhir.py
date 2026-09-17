from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class FHIRResource(BaseModel):
    resourceType: str
    id: str
    meta: Optional[Dict[str, Any]] = None
    text: Optional[Dict[str, Any]] = None


class FHIRBundleEntry(BaseModel):
    fullUrl: Optional[str] = None
    resource: Dict[str, Any]


class FHIRBundleResponse(BaseModel):
    resourceType: str = "Bundle"
    id: str
    type: str = "collection"
    timestamp: str
    total: int
    entry: List[FHIRBundleEntry] = Field(default_factory=list)
