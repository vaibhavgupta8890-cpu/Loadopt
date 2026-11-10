from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class DashboardKpiResponse(BaseModel):
    total_trucks: int
    available_trucks: int
    total_packages: int
    assigned_packages: int
    unassigned_packages: int
    average_weight_utilization_pct: float
    average_volume_utilization_pct: float
    high_priority_pending_packages: int
    recent_activities: List[Dict[str, Any]]
    truck_utilization_summary: List[Dict[str, Any]]
    priority_distribution: Dict[str, int]
    delivery_status_distribution: Dict[str, int]

class ReportSummaryResponse(BaseModel):
    generated_at: datetime
    truck_count: int
    package_count: int
    active_assignments_count: int
    avg_weight_utilization: float
    avg_volume_utilization: float
    truck_records: List[Dict[str, Any]]
    package_records: List[Dict[str, Any]]
