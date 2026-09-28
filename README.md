# Grid-Aware-Emergency-Resource-Allocation

## The Problem

South Africa's Eskom sheds power in stages, each stage removing roughly 1,000MW of national demand, in rotating blocks of 2–4 hours across dozens of feeder groups, up to 8 stages deep. That scheduling decision — which feeder groups go dark, and when — is a large constrained combinatorial choice (dodge hospitals, water pumps, telecom towers; the number of possible combinations grows astronomically as feeder groups are added).

But the schedule doesn't stop at the substation. Every feeder group that goes dark degrades a second network downstream: traffic lights fail (bottlenecked intersections), telecom towers run down finite battery/diesel reserves, hospital backup generators have limited runtime. Ambulances — already stretched against national response-time targets — now have to route through a road network whose travel times and reliability shift on a schedule set by the grid layer.

**Why it's hard:** these two layers are coupled. The grid-shedding schedule *creates* the changing conditions the ambulance-routing problem has to solve *live*. Individually, feeder-group scheduling and vehicle dispatch are each classic NP-hard problems (graph partitioning, dynamic vehicle routing); together they form a bi-level optimization where solving one well requires anticipating the other — at national scale, in real time, with imperfect information about breakdowns and demand.
