import math
from typing import List, Dict, Tuple, Optional
from app.schemas.optimization import DeliveryStopDetail

# Preset reference coordinates for realistic logistics destinations (North India corridor)
DEFAULT_COORDINATES = {
    "central logistics depot, delhi": (28.6139, 77.2090),
    "delhi": (28.6139, 77.2090),
    "delhi hub": (28.6500, 77.2300),
    "gurgaon": (28.4595, 77.0266),
    "gurgaon sector 18": (28.4900, 77.0700),
    "noida": (28.5355, 77.3910),
    "noida phase 2": (28.5200, 77.4100),
    "faridabad": (28.4089, 77.3178),
    "ghaziabad": (28.6692, 77.4538),
    "jaipur": (26.9124, 75.7873),
    "jaipur industrial": (26.9300, 75.8200),
    "agra": (27.1767, 78.0081),
    "agra logistics park": (27.2000, 78.0200),
    "chandigarh": (30.7333, 76.7794),
    "chandigarh depot": (30.7400, 76.7900),
    "ludhiana": (30.9010, 75.8573),
    "kanpur": (26.4499, 80.3319),
}

def get_coordinates_for_location(location: str, lat: Optional[float] = None, lon: Optional[float] = None) -> Tuple[float, float]:
    """Resolves latitude and longitude from input or defaults."""
    if lat is not None and lon is not None and -90 <= lat <= 90 and -180 <= lon <= 180:
        return (lat, lon)
    norm = location.strip().lower()
    for key, coords in DEFAULT_COORDINATES.items():
        if key in norm or norm in key:
            return coords
    # Default fall-back to Delhi origin
    return (28.6139, 77.2090)

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS points using Haversine formula."""
    r = 6371.0  # Earth's mean radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(r * c, 2)

def sequence_deliveries_nearest_neighbor(
    origin_location: str,
    assigned_packages: List[dict],
    origin_lat: Optional[float] = None,
    origin_lon: Optional[float] = None
) -> Tuple[List[DeliveryStopDetail], float, float]:
    """
    Computes delivery sequence using Nearest-Neighbor heuristic with priority weighting.
    Returns:
        (ordered_stops, total_distance_km, estimated_travel_time_hours)
    """
    if not assigned_packages:
        return [], 0.0, 0.0

    start_lat, start_lon = get_coordinates_for_location(origin_location, origin_lat, origin_lon)

    # Group packages by destination
    destinations_map: Dict[str, Dict] = {}
    for pkg in assigned_packages:
        dest = pkg["destination"].strip()
        if dest not in destinations_map:
            plat = pkg.get("destination_latitude")
            plon = pkg.get("destination_longitude")
            clat, clon = get_coordinates_for_location(dest, plat, plon)
            destinations_map[dest] = {
                "destination": dest,
                "lat": clat,
                "lon": clon,
                "packages": [],
                "has_high_priority": False
            }
        destinations_map[dest]["packages"].append(pkg)
        if pkg.get("priority") == "HIGH":
            destinations_map[dest]["has_high_priority"] = True

    unvisited = list(destinations_map.values())
    ordered_stops: List[DeliveryStopDetail] = []
    current_lat, current_lon = start_lat, start_lon
    total_distance = 0.0
    stop_idx = 1

    while unvisited:
        # Nearest neighbor selection considering priority bonus
        best_candidate = None
        best_effective_score = float("inf")
        best_leg_dist = 0.0

        for cand in unvisited:
            dist = haversine_distance_km(current_lat, current_lon, cand["lat"], cand["lon"])
            # Priority weighting: high priority destination receives distance discount to visit sooner
            priority_discount = 0.7 if cand["has_high_priority"] else 1.0
            effective_score = dist * priority_discount

            if effective_score < best_effective_score:
                best_effective_score = effective_score
                best_candidate = cand
                best_leg_dist = dist

        unvisited.remove(best_candidate)
        total_distance += best_leg_dist

        ordered_stops.append(
            DeliveryStopDetail(
                stop_number=stop_idx,
                destination=best_candidate["destination"],
                latitude=best_candidate["lat"],
                longitude=best_candidate["lon"],
                package_count=len(best_candidate["packages"]),
                estimated_leg_distance_km=best_leg_dist
            )
        )
        current_lat, current_lon = best_candidate["lat"], best_candidate["lon"]
        stop_idx += 1

    # Estimate travel time: average truck speed 50 km/h + 30 min (0.5h) per stop unloading
    driving_hours = total_distance / 50.0
    stop_hours = len(ordered_stops) * 0.5
    total_travel_time_hours = round(driving_hours + stop_hours, 2)

    return ordered_stops, round(total_distance, 2), total_travel_time_hours
