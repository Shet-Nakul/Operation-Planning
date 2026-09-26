# Karmarker: Healthcare Operations Planning

## Deck intent

- **Audience:** hospital leaders, operations managers, clinical stakeholders, and technical evaluators
- **Length:** 15 slides, approximately 12-15 minutes plus demo
- **Core message:** Karmarker helps hospitals turn changing demand, staff availability, and resource constraints into feasible, adaptable operating plans.
- **Important claim discipline:** Do not present sample dashboard values as measured outcomes. Replace all `[baseline]` and `[target]` fields with pilot data before an external presentation.

---

## Slide 1 - Ready Before the Patient Arrives

### On-slide copy

**Karmarker**

Intelligent workforce and surgery planning for hospitals

**From reactive coordination to operational readiness**

### Visual direction

Use a full-bleed, authentic image of a prepared operating room just before a procedure. Keep the title large and the subtitle restrained. Add the product logo and presenter details in the lower corners.

### Speaker notes

Hospitals do not fail to plan. The problem is that reality changes faster than a static plan can. Karmarker helps hospitals continuously align people, time, rooms, equipment, beds, and supplies so teams can be ready before a patient is left waiting.

---

## Slide 2 - One Missing Piece Can Stop the Entire Plan

### On-slide copy

The patient is ready.  
The surgeon is ready.  
The operating room is ready.

**But the nurse, bed, instrument, or supply is not.**

The result:

- Delayed care
- Idle operating-room time
- Last-minute staff pressure
- Lost hospital capacity

### Visual direction

Show a horizontal surgery pathway with five connected steps. Highlight one missing resource in red and fade every downstream step to make the dependency visible.

### Speaker notes

Hospital operations behave like a connected system. A single unavailable resource can delay a procedure, waste prepared capacity, and push pressure into another team or shift. The operational challenge is not only treating the patient; it is making every required element available at the same time.

---

## Slide 3 - The Real Problem Is Constant Change

### On-slide copy

Hospital plans must reconcile four moving realities:

| Demand | Workforce | Capacity | Time |
|---|---|---|---|
| Emergencies and elective cases | Skills, roles, shifts, leave | Rooms, beds, equipment, supplies | Priorities, durations, deadlines |

**Traditional schedules become outdated as soon as one assumption changes.**

### Visual direction

Use four vertical bands feeding into a central schedule. Overlay disruption events such as sick leave, an emergency case, maintenance, and low stock.

### Speaker notes

Spreadsheets and isolated systems can record parts of the problem, but they struggle with dependencies. A roster that looks balanced may not support the surgery plan. A free room is not useful if the correct team, recovery bed, or required supply is unavailable. The hospital needs one coordinated view of feasibility.

---

## Slide 4 - One Planning System, Two Connected Decisions

### On-slide copy

**1. Workforce rostering**  
Build balanced, demand-aware schedules around contracts, availability, leave, preferences, and safe shift patterns.

**2. Surgery and resource planning**  
Schedule procedures only when required people and resources can be brought together.

**3. Continuous adjustment**  
Re-plan when staff, demand, or capacity changes.

### Visual direction

Use two interlocking timelines: a monthly staff roster and a near-term surgery plan. Connect them through a central “feasibility + optimization” layer.

### Speaker notes

Karmarker joins decisions that are often made separately. Workforce rostering establishes usable staff capacity. Surgery planning then checks the complete resource picture and selects feasible times. Changes to surgeries, staff, or pools can trigger a new planning cycle so the plan follows operational reality.

---

## Slide 5 - From Hospital Data to an Actionable Plan

### On-slide copy

1. **Capture** demand, staff, skills, availability, leave, rooms, equipment, beds, and supplies
2. **Check feasibility** before optimization
3. **Optimize** timing and resource assignments
4. **Publish** rosters and planned surgeries
5. **Monitor** progress, exceptions, and capacity
6. **Re-plan** when material inputs change

**Output:** scheduled, dropped, and infeasible cases are separated explicitly.

### Visual direction

Use a six-step circular flow with a visible feedback arrow from Monitor to Capture. Show the three output states as distinct chips, with “infeasible” treated as an actionable warning rather than hidden failure.

### Speaker notes

The system first asks whether a case can be supported at all. Only feasible cases proceed into optimization. This avoids spending search time on impossible combinations and surfaces risk earlier. Results preserve scheduled cases, dropped cases, and infeasible cases instead of presenting a plan that silently ignores constraints.

---

## Slide 6 - Workforce Optimization: Coverage Without Losing Fairness

### On-slide copy

**Inputs**

- Employee role, contract, and pool membership
- Availability, approved leave, and shift requests
- Department and shift demand
- Existing assignments and preferences

**Constraints and priorities**

- Required coverage by pool and shift
- Maximum and minimum assignments
- Consecutive work and rest limits
- Weekend consistency
- Unsafe shift transitions, including night-to-day
- Workload balance and employee preferences

**Output:** employee-, pool-, and date-centric rosters with schedule statistics

### Visual direction

Use a roster heat map with a small constraint stack beside it. Show coverage and fatigue-risk indicators, not algorithm code.

### Speaker notes

The rostering engine uses large-neighborhood search to improve schedules across many interacting rules. Coverage is heavily prioritized, while undesirable patterns and preference violations carry configurable penalties. This allows the optimizer to compare imperfect alternatives instead of failing whenever every preference cannot be met.

---

## Slide 7 - Surgery Optimization: Make the Whole Path Feasible

### On-slide copy

Each procedure is modeled across its operational journey:

**Pre-op → Operation → Post-op → Sterilization → Recovery**

The planner considers:

- Earliest, latest, and preferred start times
- Emergency, mandatory, and elective priority
- Required staff roles and quantities
- Rooms, beds, devices, equipment, and vehicles
- Capacity and availability windows
- Consumable stock thresholds

**Goal:** schedule more feasible procedures while reducing avoidable delay and resource conflict.

### Visual direction

Show one procedure as a multi-stage timeline. Place resource icons beneath each stage and use dependency lines to show that downstream capacity matters before the case starts.

### Speaker notes

Planning a surgery is not a single room booking. Each stage has duration and resource requirements. Karmarker checks these linked needs against capacity, then uses an adaptive search that combines simulated annealing for exploration with tabu search for local refinement. The result includes assigned resources and a planned start time.

---

## Slide 8 - Detect the Problem Before It Reaches the Patient

### On-slide copy

**Feasibility first**

- Identify cases that cannot currently be supported
- Preserve candidate feasible start times for investigation
- Optimize only eligible cases
- Store the selected plan and assigned resources

**When inputs change**

- Staff, surgery, and resource-pool updates trigger re-planning
- Changes are consolidated to avoid repeated solver runs
- Department failures are isolated so other planning can continue

### Visual direction

Use a before/after scenario: a nurse becomes unavailable, the original plan turns amber, and an alternate feasible start or assignment is generated.

### Speaker notes

This changes the management question from “Why was the surgery delayed?” to “What is blocking it, and what feasible alternatives exist?” The current platform reports infeasible cases and candidate starts in solver output. A richer visual explanation of the exact binding constraint is part of the product roadmap.

---

## Slide 9 - A Shared Operational Control Center

### On-slide copy

**Plan**

- Staff, leave, shifts, pools, and demand
- Procedures, phases, and resource requirements
- Renewable and consumable resources

**Operate**

- Surgery status and timeline
- Assigned clinical staff
- Planning results and exceptions
- Inventory shortage status

**Govern**

- Organization-based access
- Roles and permissions
- Activity logs
- Configurable catalogs and forbidden patterns

### Visual direction

Use three real application screenshots: Control Center, planning results, and settings or inventory. Avoid displaying the Analytics sample numbers as production evidence.

### Speaker notes

The application is not only an optimizer. It provides the operational surfaces needed to maintain master data, review plans, follow surgery status, track resources, administer users, and audit changes. This makes optimization part of a working process rather than a disconnected model.

---

## Slide 10 - Architecture Built for Separation and Scale

### On-slide copy

```text
React + TypeScript web application
                 ↓
Node.js + Express API
Authentication • validation • workflow • audit
          ↓                    ↓
   PostgreSQL/Prisma     Python FastAPI solvers
   Operational record    Planning + rostering
                              ↕ WebSocket progress
```

**Deployment:** containerized services with Docker Compose  
**Data boundary:** organization-scoped records and administration

### Visual direction

Redraw the architecture as four clean horizontal layers. Use different colors for experience, orchestration, data, and optimization. Keep infrastructure details secondary.

### Speaker notes

The architecture separates user experience, operational workflow, persistent data, and computational optimization. The Node service prepares planning payloads and controls lifecycle transitions. Python services run feasibility, surgery planning, and rostering algorithms, with progress streamed through WebSockets.

---

## Slide 11 - Decision Support, Not Autonomous Clinical Control

### On-slide copy

**The system recommends. Authorized people decide.**

- Clinical judgment remains with hospital teams
- Planners can review exceptions before execution
- Role-based access limits administrative actions
- Activity logs support traceability
- Planning results remain available for review

**Optimization improves coordination; it does not determine treatment.**

### Visual direction

Show a simple loop: System recommends → Planner reviews → Team confirms → Operations execute → Outcomes inform the next plan.

### Speaker notes

This is an operations decision-support system, not a clinical decision-maker. It coordinates declared requirements and capacity. Hospitals remain responsible for clinical prioritization, staffing policy, labor rules, and final approval. That distinction is essential for trust, adoption, and governance.

---

## Slide 12 - Measure Value Where Operations Feel It

### On-slide copy

| Outcome | Pilot KPI | Baseline → Target |
|---|---|---|
| Faster planning | Planner hours per roster cycle | `[baseline] → [target]` |
| More reliable surgery starts | Delays caused by missing resources | `[baseline] → [target]` |
| Better capacity use | OR utilization and idle minutes | `[baseline] → [target]` |
| More balanced work | Overtime and undesirable shift patterns | `[baseline] → [target]` |
| Earlier warning | Infeasibilities found before day of surgery | `[baseline] → [target]` |
| Stable service | Cases scheduled within their time window | `[baseline] → [target]` |

### Visual direction

Use six restrained KPI tiles or the table above. Do not show percentages until they come from an agreed pilot baseline and measurement method.

### Speaker notes

The business case should be measured, not assumed. Before a pilot, agree on definitions, data sources, baseline period, and target thresholds. Track operational indicators such as planning effort, resource-related delays, overtime, utilization, and schedule stability. Patient outcomes can be studied separately, but should not be claimed from operational optimization alone.

---

## Slide 13 - Demo: From Disruption to a Feasible Alternative

### On-slide copy

**Scenario:** An assigned nurse becomes unavailable before tomorrow's procedures.

1. Review the original roster and surgery plan
2. Record the employee's unavailability or approved leave
3. Trigger the updated feasibility and planning flow
4. Inspect scheduled, dropped, and infeasible results
5. Review the revised start time and resource assignment
6. Confirm the operational plan in the Control Center

**What to watch:** constraint compliance, changed assignments, and surfaced risk

### Visual direction

Use a six-frame storyboard with screenshots from the actual application. Keep one surgery highlighted consistently across every frame.

### Speaker notes

This demonstration connects the product to the opening story. Do not spend time touring every administration screen. Follow one disruption through the system and show how the application exposes its effect, recalculates the plan, and gives the operations team a usable next action.

---

## Slide 14 - Pilot Safely, Then Expand

### On-slide copy

**Phase 1: Configure**

- Select one department and planning horizon
- Validate staff, contracts, skills, shifts, and resource data
- Agree on hard rules, weighted preferences, and KPIs

**Phase 2: Shadow**

- Run alongside the existing planning process
- Compare feasibility, effort, stability, and exceptions
- Review recommendations with clinical and operations leaders

**Phase 3: Operate and scale**

- Approve controlled use for the pilot department
- Monitor outcomes and tune weights
- Extend to additional departments and resource types

### Visual direction

Use a three-stage left-to-right rollout with clear decision gates between phases. Show “data sign-off,” “operational sign-off,” and “scale decision” as gates.

### Speaker notes

A shadow deployment reduces risk and creates the evidence needed for adoption. Begin where data quality and operational ownership are strongest. The pilot should test both the algorithm and the workflow around it: who reviews exceptions, who approves a plan, and how changes are communicated.

---

## Slide 15 - Better Planning Changes What Is Possible

### On-slide copy

**Better use of time.**  
**Better use of capacity.**  
**Better balance for staff.**  
**Better decisions for care.**

We cannot predict every disruption.  
We can be better prepared for it.

**When the next patient arrives, be ready to say:**  
## “We are ready for you.”

**Proposed next step:** agree on one department, one baseline period, and one measurable pilot.

### Visual direction

Return to the operating-room image from Slide 1, now with the prepared team present. Keep the close human and uncluttered.

### Speaker notes

Behind every schedule is a person, and behind every procedure is a patient. Karmarker is not designed to replace the people who care. It is designed to remove avoidable operational friction so those people can use limited time and capacity where they matter most.

---

# Presentation guidance

## Recommended visual system

- **Tone:** calm, clinical, operational, and human; avoid futuristic AI imagery
- **Palette:** white and charcoal foundations, hospital blue for planning, emerald for feasible states, amber for risk, and red only for blocking exceptions
- **Typography:** use a confident sans serif such as Aptos, Avenir Next, or IBM Plex Sans
- **Charts:** label units and time periods; use direct labels instead of legends where possible
- **Screenshots:** use real product screens at readable scale and obscure personal or test credentials
- **Animation:** reveal dependencies and replanning changes in sequence; avoid decorative transitions

## Claims to avoid until validated

- Do not describe dashboard mock values as live hospital performance.
- Do not promise a specific reduction in delays, overtime, cost, or waiting time without pilot evidence.
- Do not call the current system predictive AI; its verified core is constraint-based feasibility and metaheuristic optimization.
- Do not imply that the platform makes clinical decisions or guarantees resource availability.
- Do not claim full constraint explainability; current results identify infeasible cases and candidate feasible starts, while detailed reason visualization remains a roadmap item.

## Product roadmap points for Q&A

- Live KPI integration using optimizer and operational data
- Visual root-cause explanations for infeasible procedures
- What-if scenario comparison and rollback
- User-configurable optimization weights and parameters
- Custom planning horizons and richer skill-proficiency matching
- Stronger resilience for long-running and concurrent planning jobs

## Technical source map

- Surgery planning and feasibility: `planning_and_scheduling-1.2.1/src/planning/main.py`
- Adaptive surgery search: `planning_and_scheduling-1.2.1/src/planning/search/adaptive_search.py`
- Rostering configuration and weighted constraints: `server/src/config/schedulingConfig.ts`
- Two-phase planning orchestration: `server/src/services/planningProcessManager.ts`
- Automatic planning trigger: `server/src/services/planningAutoTrigger.ts`
- Core operational data model: `server/prisma/schema.prisma`
- Product control center: `client/src/pages/ControlCenterPage.tsx`
- Product analytics mock-up: `client/src/pages/AnalyticsPage.tsx`