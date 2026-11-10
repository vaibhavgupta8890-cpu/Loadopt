# LoadOpt Optimization Algorithm & Routing Engineering

## 1. Mathematical Formulation: Multi-Capacity Knapsack
The core truck loading challenge in LoadOpt is modeled as a variant of the **Multi-Capacity, Multi-Knapsack Problem (MC-MKP)**, an NP-hard combinatorial optimization problem.

### Decision Variable
Let:
$$x_{ij} \in \{0, 1\}$$
where $x_{ij} = 1$ if package $i \in \{1, \dots, N\}$ is assigned to truck $j \in \{1, \dots, M\}$, and $0$ otherwise.

### Hard Constraints
1. **Assignment Uniqueness**: Each package can be placed in at most one truck:
   $$\sum_{j=1}^{M} x_{ij} \le 1, \quad \forall i \in \{1, \dots, N\}$$

2. **Gross Weight Capacity**: The total weight of all packages assigned to truck $j$ cannot exceed its payload rating $W_j$:
   $$\sum_{i=1}^{N} w_i x_{ij} \le W_j, \quad \forall j \in \{1, \dots, M\}$$

3. **Volumetric Storage Capacity**: The total volume of all packages in truck $j$ cannot exceed its internal cargo volume $V_j$:
   $$\sum_{i=1}^{N} v_i x_{ij} \le V_j, \quad \forall j \in \{1, \dots, M\}$$

4. **Availability Filter**: Packages can only be assigned to vehicles with active operational status:
   $$x_{ij} = 0 \quad \text{if } \text{status}(j) \ne \text{'AVAILABLE'}$$

---

## 2. Multi-Objective Scoring Heuristic
Because exact integer programming suffers from exponential time complexity $O(M^N)$ for real-time logistics operations, LoadOpt utilizes an explainable, constraint-aware heuristic:

### Step 1: Package Pre-Sorting (First-Fit Decreasing)
Eligible packages are sorted descending by:
1. **Priority Score**: High (30 pts) > Medium (20 pts) > Low (10 pts).
2. **Normalized Footprint**:
   $$\text{Footprint}(i) = \frac{w_i}{\bar{W}_{\text{fleet}}} + \frac{v_i}{\bar{V}_{\text{fleet}}}$$
3. **Delivery Deadline**: Earliest requested delivery timestamp.

### Step 2: Feasible Candidate Evaluation
For each package $i$, a truck $j$ is considered *feasible* if and only if:
$$w_i \le W_j^{\text{remaining}} \quad \text{AND} \quad v_i \le V_j^{\text{remaining}}$$

If no truck satisfies both constraints, the package is flagged as **Unassigned** and categorized into a diagnostic reason:
- Absolute Oversize (exceeds single maximum truck capacity across entire fleet).
- Remaining Weight Exhaustion.
- Remaining Volume Exhaustion.
- Combined Capacity Saturation.

### Step 3: Feasible Candidate Scoring
Each feasible truck $j$ is evaluated using a normalized scoring function:
$$\text{Score}(i, j) = S_{\text{affinity}}(i, j) \cdot \omega_{\text{affinity}} + S_{\text{tightness}}(i, j) \cdot \omega_{\text{tightness}}$$

Where:
- **Destination Affinity** ($S_{\text{affinity}}$): Grants a +25 point bonus if truck $j$ already has packages destined for package $i$'s target hub. This clusters shipments and reduces unnecessary multi-city stops.
- **Capacity Tightness** ($S_{\text{tightness}}$): Evaluates the Best-Fit ratio:
  $$S_{\text{tightness}}(i, j) = \left( 2.0 - \left[ \frac{W_j^{\text{rem}} - w_i}{W_j} + \frac{V_j^{\text{rem}} - v_i}{V_j} \right] \right) \times 10.0$$
  This minimizes residual fragmentation.

---

## 3. Physical Loading Order Heuristic (LIFO)
Rear-door cargo access dictates that goods for the final stop must be packed at the front of the truck bed, while goods for the first delivery stop must be packed at the rear for immediate unloading.

### Sequencing Rules:
1. Group packages by their planned **Delivery Stop Number** ($1 \le s \le K$).
2. Sort stop groups in **Reverse Order** (Stop $K$ first, Stop 1 last).
3. Within each stop group, sort packages by **Weight Descending** (heavier items loaded on the cargo floor to maintain vehicle center of gravity and avoid crushing fragile cartons).
4. Assign `loading_order` indices $1, 2, \dots, P$ where $1$ is the first item loaded into the truck.

---

## 4. Delivery Sequence & Haversine Routing
When destination GPS coordinates are present, LoadOpt optimizes delivery order using a **Priority-Discounted Nearest Neighbor** heuristic:

### Haversine Formula
Great-circle distance $d$ between $(\phi_1, \lambda_1)$ and $(\phi_2, \lambda_2)$:
$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)$$
$$d = 2 R \cdot \text{atan2}(\sqrt{a}, \sqrt{1-a})$$
where $R = 6,371\text{ km}$.

### Urgent Priority Discounting
To guarantee urgent packages are delivered earlier in the route, the leg distance to high-priority destinations is weighted with a discount factor $\gamma = 0.7$, incentivizing earlier selection during nearest-neighbor traversal.
