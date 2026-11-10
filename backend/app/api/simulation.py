from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.simulation import (
    SimulationRequest,
    SimulationComparisonResponse,
    ApplySimulationPlanRequest,
)
from app.security import (
    get_current_user,
    require_manager_or_admin,
)
from app.optimization.simulation import (
    run_what_if_simulation,
    apply_simulation_plan,
)

router = APIRouter(prefix="/api/simulation", tags=["What-If Simulation Engine"])

@router.post("/run", response_model=SimulationComparisonResponse)
def execute_simulation(
    payload: SimulationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Executes a non-destructive What-If simulation.
    Scenarios:
    1. EXCLUDE_TRUCK: Evaluate impact if a truck breaks down or is removed from service.
    2. URGENT_PACKAGE: Check feasibility and reallocation if an emergency shipment arrives.
    3. REDUCE_CAPACITY: Model partial payload restrictions (e.g. maintenance limit).
    """
    try:
        return run_what_if_simulation(db, payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation calculation error: {str(e)}"
        )

@router.post("/apply", status_code=status.HTTP_200_OK)
def apply_simulated_plan(
    payload: ApplySimulationPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    """
    Applies the evaluated What-If simulation plan directly to the production database
    within an ACID transaction.
    """
    try:
        run = apply_simulation_plan(db, payload, user_id=current_user.user_id)
        return {
            "message": "Revised simulation plan applied successfully to production database.",
            "optimization_run_id": run.optimization_run_id,
            "status": run.status,
            "assigned_packages": run.assigned_packages,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to apply simulation plan: {str(e)}"
        )
