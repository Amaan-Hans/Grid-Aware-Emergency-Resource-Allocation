# Grid-Aware Emergency Resource Allocation

**QML + classical ML for load-shedding-aware ambulance routing**

Built for [Hackathon Name] — Social Good track.

---

## The Problem

South Africa's Eskom sheds power in stages, each stage removing roughly 1,000MW of national demand, in rotating blocks of 2–4 hours across dozens of feeder groups, up to 8 stages deep. That scheduling decision — which feeder groups go dark, and when — is a large constrained combinatorial choice (dodge hospitals, water pumps, telecom towers; the number of possible combinations grows astronomically as feeder groups are added).

But the schedule doesn't stop at the substation. Every feeder group that goes dark degrades a second network downstream: traffic lights fail (bottlenecked intersections), telecom towers run down finite battery/diesel reserves, hospital backup generators have limited runtime. Ambulances — already stretched against national response-time targets — now have to route through a road network whose travel times and reliability shift on a schedule set by the grid layer.

**Why it's hard:** these two layers are coupled. The grid-shedding schedule *creates* the changing conditions the ambulance-routing problem has to solve *live*. Individually, feeder-group scheduling and vehicle dispatch are each classic NP-hard problems (graph partitioning, dynamic vehicle routing); together they form a bi-level optimization where solving one well requires anticipating the other — at national scale, in real time, with imperfect information about breakdowns and demand.

---

## Our Approach

We split the problem into two coupled graphs and two solver tracks.

### Layer 1 — The Grid (QML / Qiskit)

`G1 = (V1, E1)` — feeder groups as nodes, shared-infrastructure/blackout-window constraints as edges.

Formulated as a QUBO and solved with QAOA/VQE via `qiskit-optimization`, benchmarked against a classical heuristic (simulated annealing / greedy).

```
H = A · Σ_t (Σ_i load_i · x_i^t − target_shed_t)²      # hit the MW shed target per stage
  + B · Σ_{i ∈ critical} x_i^t                          # never shed hospitals/water/telecom
  + C · Σ_{(i,j) ∈ E1} x_i^t · x_j^t                     # no two coupled groups dark at once
  + D · Var_t(Σ_t x_i^t)                                 # fair rotation across groups
  + E · Σ_i risk_i · x_i^t                               # coupling term from Layer 2 (see below)
```

where `x_i^t ∈ {0,1}` = feeder group *i* is off during stage window *t*.

### Layer 2 — The Response Network (classical ML)

`G2(t) = (V2, E2, w(t))` — intersections/depots/hospitals as nodes, road segments as edges, with **time-varying edge weights** `w_e(t)` driven by Layer 1's schedule (dead traffic lights, draining backup power).

Two models:
1. **Degradation forecaster** — predicts `w_e(t)` from generator runtime decay / battery drain curves.
2. **Risk surrogate (`risk_i`)** — predicts how much shutting off feeder group *i* degrades downstream ambulance response time, learned from historical outage → delay data. This is the term fed into Layer 1's QUBO.
3. **Dispatch/routing solver** — time-dependent shortest path or RL-based dispatch over the resulting time-expanded graph.

### The coupling

```
Classical ML (risk_i) → QML QUBO solve → shed schedule → w_e(t) → Classical routing
```

Solving Layer 1 well requires a signal from Layer 2, and Layer 2's inputs are entirely shaped by Layer 1's output — a genuine bi-level loop, not two independent models bolted together.

---

## Repo Structure

```
.
├── README.md
├── docs/
│   └── graph-problem.md          # full technical writeup (this problem, formalized)
├── data/
│   ├── feeder_groups/            # feeder group load, criticality, adjacency
│   └── road_network/             # road graph, historical response times
├── classical/
│   ├── degradation_model/        # w_e(t) forecasting
│   ├── risk_surrogate/           # risk_i model
│   └── routing/                  # dispatch/routing solver
├── qml/
│   ├── qubo_formulation.py       # H construction from feeder graph + risk_i
│   ├── qaoa_solver.py            # Qiskit QAOA/VQE solve
│   └── benchmarks/               # classical heuristic comparison
├── notebooks/                    # exploration, EDA, demo notebooks
└── demo/                         # end-to-end pipeline / dashboard
```

*(adjust to match your actual folder layout before pushing)*

---

## Setup

```bash
git clone <repo-url>
cd grid-aware-emergency-allocation
python -m venv venv
source venv/bin/activate        # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### Key dependencies

- `qiskit`, `qiskit-optimization`, `qiskit-algorithms` — QUBO + QAOA/VQE
- `networkx` — graph construction for both layers
- `scikit-learn` / `pytorch` — degradation and risk surrogate models
- `pandas`, `numpy` — data handling

---

## Running It

```bash
# 1. Build the feeder-group graph and QUBO
python qml/qubo_formulation.py --data data/feeder_groups/

# 2. Solve with QAOA and compare to classical baseline
python qml/qaoa_solver.py --qubo output/qubo.pkl --benchmark

# 3. Train the risk surrogate on historical outage/response data
python classical/risk_surrogate/train.py --data data/road_network/

# 4. Run the end-to-end pipeline (schedule → routing)
python demo/run_pipeline.py
```

*(replace with your actual entrypoints/scripts once written)*

---

## Team

| Track | Owner(s) |
|---|---|
| Degradation prediction + risk surrogate | [names] |
| Dispatch/routing solver | [names] |
| QUBO formulation + QAOA/VQE | [names] |

---

## Status

🚧 Hackathon build — [Hackathon Name], [dates]. See `docs/graph-problem.md` for the full technical formalization.

## License

[MIT / TBD]
