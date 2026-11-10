from typing import List, Dict
from app.schemas.optimization import DeliveryStopDetail, AssignedPackageDetail

def compute_loading_order(
    assigned_packages: List[AssignedPackageDetail],
    delivery_stops: List[DeliveryStopDetail]
) -> List[AssignedPackageDetail]:
    """
    Computes physical loading order for rear-loading trucks (LIFO rule).
    Items for later delivery stops are loaded first.
    Within the same stop, heavier items are loaded first to maintain center of gravity.
    Loading order 1 = loaded first into truck (deepest inside).
    """
    if not assigned_packages or not delivery_stops:
        for idx, pkg in enumerate(assigned_packages, start=1):
            pkg.loading_order = idx
        return assigned_packages

    # Map destination to its stop number (1 to N)
    stop_map = {stop.destination.strip().lower(): stop.stop_number for stop in delivery_stops}

    def get_sort_key(pkg: AssignedPackageDetail):
        dest_key = pkg.destination.strip().lower()
        stop_num = stop_map.get(dest_key, 999)
        # Reverse stop number so later stops come first (e.g., stop 3 loaded before stop 1)
        # Heaviest weight loaded first within that stop (-pkg.weight_kg)
        return (-stop_num, -pkg.weight_kg)

    sorted_packages = sorted(assigned_packages, key=get_sort_key)

    for order_idx, pkg in enumerate(sorted_packages, start=1):
        pkg.loading_order = order_idx
        dest_key = pkg.destination.strip().lower()
        stop_num = stop_map.get(dest_key, 1)
        pkg.assignment_reason += f" | Load Order #{order_idx} (Delivery Stop #{stop_num}, Weight: {pkg.weight_kg}kg, LIFO position)"

    return sorted_packages
