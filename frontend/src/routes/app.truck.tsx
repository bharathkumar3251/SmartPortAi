import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { StatTile } from "@/components/common/StatTile";
import { NoDataCard } from "@/components/common/NoDataCard";
import { BarsChart, C, ChartCard, DonutChart, BarBreakdown } from "@/components/dash/Charts";
import { DataPanel, StatusBadge } from "@/components/dash/DataPanel";
import {
  ActivityCard,
  CalendarWidget,
  HelpCard,
  NotificationsCard,
  WorkflowOverview,
} from "@/components/dash/Widgets";
import { SubmissionWorkspace } from "@/components/workflow/SubmissionWorkspace";
import { StageActions, type StageAction } from "@/components/workflow/StageActions";
import { ContainerBoard } from "@/components/workflow/ContainerBoard";
import { useAllContainers, useAllSubmissions } from "@/hooks/useOps";
import { containerStageBars, stageCounts } from "@/lib/ops-metrics";
import type { Stage } from "@/lib/workflow";
import {
  Truck,
  DoorOpen,
  DoorClosed,
  Route as RouteIcon,
  CircleCheck,
  Boxes,
  UserCheck,
  LayoutDashboard,
  ClipboardList,
  Clock,
  Timer,
  Compass,
  History,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/app/truck")({
  validateSearch: (search: Record<string, unknown>): { m?: string } => ({
    m: search.m ? String(search.m) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Trucking Portal — SmartPort AI" },
      {
        name: "description",
        content:
          "Pickup requests, truck and driver assignment, trip status updates and delivery hand-off to logistics.",
      },
      { property: "og:title", content: "Trucking Portal — SmartPort AI" },
      {
        property: "og:description",
        content: "Fleet dispatch and trip tracking for port hauliers.",
      },
    ],
  }),
  component: TruckPage,
});

const TRUCK_TABS = [
  { slug: "dashboard", label: "Driver Dashboard", icon: LayoutDashboard },
  { slug: "jobs", label: "Assigned Jobs", icon: ClipboardList },
  { slug: "gate", label: "Assigned Gate", icon: DoorOpen },
  { slug: "slot", label: "Truck Slot (TAS)", icon: Clock },
  { slug: "queue", label: "Gate Queue", icon: Timer },
  { slug: "entry", label: "In-Gate Entry", icon: DoorOpen },
  { slug: "exit", label: "Out-Gate Exit", icon: DoorClosed },
  { slug: "nav", label: "Port Navigation", icon: Compass },
  { slug: "history", label: "Trip History", icon: History },
];

const QUEUE: Stage[] = ["dispatch_ready"];

const ACTIONS: StageAction[] = [
  { label: "Dispatch shipment", stage: "in_transit", action: "Shipment dispatched — in transit" },
];

function TruckPage() {
  const { m } = Route.useSearch();
  const activeModule = m ?? "dashboard";
  const { data: subs, isLoading } = useAllSubmissions();
  const { data: containers } = useAllContainers();
  const rows = subs ?? [];
  const cts = containers ?? [];
  const pending = cts.filter((c) => c.stage === "dispatch_ready");
  const assigned = cts.filter((c) => c.stage === "assigned_truck");
  const transit = cts.filter((c) => c.stage === "in_transit");
  const delivered = cts.filter((c) => c.stage === "delivered");
  const plates = new Set(cts.map((c) => c.truck_plate).filter(Boolean));
  const drivers = new Set(cts.map((c) => c.driver_name).filter(Boolean));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Truck Operator Portal"
        title={
          activeModule === "jobs"
            ? "Haulage Jobs & Container Pickup Orders"
            : activeModule === "gate"
              ? "Assigned Port Gates & RFID Access Lanes"
              : activeModule === "slot"
                ? "Truck Appointment System (TAS) Slots"
                : activeModule === "queue"
                  ? "Live Terminal Gate Queue & Wait Times"
                  : activeModule === "entry"
                    ? "In-Gate Arrival & Optical Character Recognition"
                    : activeModule === "exit"
                      ? "Out-Gate Clearance & Electronic EIR"
                      : activeModule === "nav"
                        ? "Port Internal Route Navigation"
                        : activeModule === "history"
                          ? "Haulage Trip History & Turnaround Logs"
                          : "Pickup Requests & Fleet Haulage"
        }
        subtitle="Accept pickup requests from the warehouse, assign trucks and drivers, update trip status and hand deliveries to logistics."
      />

      {/* Module Horizontal Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border/60 scrollbar-thin">
        {TRUCK_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeModule === tab.slug || (tab.slug === "dashboard" && !m);
          return (
            <Link
              key={tab.slug}
              to="/app/truck"
              search={tab.slug === "dashboard" ? {} : { m: tab.slug }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-gradient-to-r from-cyan/20 to-violet/20 text-cyan border border-cyan/40 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/40 border border-transparent"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatTile
          label="Pickup requests"
          icon={DoorOpen}
          loading={isLoading}
          value={pending.length}
        />
        <StatTile label="Assigned" icon={Truck} tone="cyan" value={assigned.length} />
        <StatTile label="In transit" icon={RouteIcon} tone="warning" value={transit.length} />
        <StatTile label="Delivered" icon={CircleCheck} tone="success" value={delivered.length} />
        <StatTile label="Trucks in use" icon={Boxes} tone="violet" value={plates.size} />
        <StatTile label="Drivers assigned" icon={UserCheck} value={drivers.size} />
      </div>

      {/* Sub-view switcher based on activeModule */}
      {activeModule === "jobs" ? (
        <div className="space-y-6">
          <ContainerBoard
            title="Assigned Haulage Jobs & Containers"
            subtitle="Review active pickup orders, assign prime movers and record driver names"
            stages={["dispatch_ready", "assigned_truck", "in_transit"]}
            emptyTitle="No jobs dispatched."
            emptyDescription="Jobs appear once the warehouse completes staging."
            exportName="truck-jobs.csv"
            fields={[
              { key: "truck_plate", label: "Truck plate (e.g. SLB 8821 X)", required: true },
              { key: "driver_name", label: "Driver name", required: true },
              { key: "destination", label: "Delivery destination", required: true },
            ]}
            advance={{ label: "Dispatch onto Road", stage: "in_transit" }}
          />
        </div>
      ) : activeModule === "gate" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4 border-l-4 border-cyan">
              <div className="text-xs uppercase text-muted-foreground font-mono">Assigned In-Gate</div>
              <div className="text-2xl font-bold text-cyan mt-1">Tuas Port Gate 03</div>
              <p className="text-xs text-muted-foreground mt-1">Automated RFID / License Plate Lane 4</p>
            </GlassCard>
            <GlassCard className="p-4 border-l-4 border-success">
              <div className="text-xs uppercase text-muted-foreground font-mono">Security Pre-Clearance</div>
              <div className="text-2xl font-bold text-success mt-1">APPROVED</div>
              <p className="text-xs text-muted-foreground mt-1">Driver biometric match verified</p>
            </GlassCard>
            <GlassCard className="p-4 border-l-4 border-violet">
              <div className="text-xs uppercase text-muted-foreground font-mono">Weigh-In-Motion Status</div>
              <div className="text-2xl font-bold text-violet mt-1">Lane Scale Active</div>
              <p className="text-xs text-muted-foreground mt-1">Tolerance verified against VGM</p>
            </GlassCard>
          </div>
          <GlassCard className="p-5">
            <h3 className="font-semibold text-foreground text-sm mb-3">Live Terminal Gate Lanes Status</h3>
            <div className="grid md:grid-cols-4 gap-3 text-xs">
              {[
                { gate: "Gate 1 (Tuas South)", type: "Standard Container", queue: "2 trucks", status: "Open" },
                { gate: "Gate 2 (Tuas South)", type: "Automated RFID", queue: "0 trucks", status: "Express" },
                { gate: "Gate 3 (Tuas West)", type: "HazMat / Over-Dimensional", queue: "1 truck", status: "Open" },
                { gate: "Gate 4 (Tuas West)", type: "Empty Returns", queue: "3 trucks", status: "Open" },
              ].map((g) => (
                <div key={g.gate} className="p-3 rounded-lg bg-card/60 border border-border/60">
                  <div className="font-semibold text-foreground">{g.gate}</div>
                  <div className="text-muted-foreground mt-1">{g.type}</div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/40 font-mono">
                    <span className="text-cyan">{g.queue}</span>
                    <span className="text-success font-semibold">{g.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      ) : activeModule === "slot" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Current TAS Slot</div>
              <div className="text-2xl font-bold text-cyan mt-1">11:00 – 12:00 SGT</div>
              <p className="text-xs text-muted-foreground mt-1">Window opens in 25 minutes</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Slot Adherence Rate</div>
              <div className="text-2xl font-bold text-success mt-1">98.5%</div>
              <p className="text-xs text-muted-foreground mt-1">Haulier gold tier compliance</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Gate Pass Validity</div>
              <div className="text-2xl font-bold text-violet mt-1">2 Hours</div>
              <p className="text-xs text-muted-foreground mt-1">Auto-extended if queue exceeds 15 mins</p>
            </GlassCard>
          </div>
          <GlassCard className="p-5">
            <h3 className="font-semibold text-foreground text-sm mb-3">Booked Truck Appointment Slots (TAS)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-white/[0.02] border-b border-border/70 text-muted-foreground font-mono uppercase">
                  <tr>
                    <th className="text-left p-2.5">Slot ID</th>
                    <th className="text-left p-2.5">Truck Plate</th>
                    <th className="text-left p-2.5">Driver</th>
                    <th className="text-left p-2.5">Terminal Window</th>
                    <th className="text-left p-2.5">Container / Job</th>
                    <th className="text-right p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 font-mono">
                  {[
                    { id: "TAS-8291", plate: "SLB 8821 X", driver: "Tan Wei Meng", time: "11:00 - 12:00", job: "MSKU-982140", status: "Active" },
                    { id: "TAS-8292", plate: "SGB 4432 Y", driver: "Ahmad Bin Salleh", time: "12:00 - 13:00", job: "CMAU-102934", status: "Confirmed" },
                    { id: "TAS-8293", plate: "SKK 9910 P", driver: "K. Rajan", time: "14:00 - 15:00", job: "TGHU-554109", status: "Confirmed" },
                    { id: "TAS-8294", plate: "SLF 1209 D", driver: "Lee Boon Heng", time: "15:30 - 16:30", job: "COSU-881290", status: "Scheduled" },
                  ].map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02]">
                      <td className="p-2.5 text-cyan font-bold">{t.id}</td>
                      <td className="p-2.5 text-foreground">{t.plate}</td>
                      <td className="p-2.5 text-muted-foreground">{t.driver}</td>
                      <td className="p-2.5 text-foreground">{t.time}</td>
                      <td className="p-2.5 text-muted-foreground">{t.job}</td>
                      <td className="p-2.5 text-right"><span className="text-success font-semibold">{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      ) : activeModule === "queue" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4 border-l-4 border-success">
              <div className="text-xs uppercase text-muted-foreground font-mono">Estimated In-Gate Wait Time</div>
              <div className="text-2xl font-bold text-success mt-1">4.5 Minutes</div>
              <p className="text-xs text-muted-foreground mt-1">Smooth flow across all RFID lanes</p>
            </GlassCard>
            <GlassCard className="p-4 border-l-4 border-cyan">
              <div className="text-xs uppercase text-muted-foreground font-mono">Trucks in Physical Queue</div>
              <div className="text-2xl font-bold text-cyan mt-1">6 Trucks</div>
              <p className="text-xs text-muted-foreground mt-1">Tuas Port Entrance Boulevard</p>
            </GlassCard>
            <GlassCard className="p-4 border-l-4 border-violet">
              <div className="text-xs uppercase text-muted-foreground font-mono">Turnaround Velocity</div>
              <div className="text-2xl font-bold text-violet mt-1">16.2 Mins Total</div>
              <p className="text-xs text-muted-foreground mt-1">In-gate to out-gate completion time</p>
            </GlassCard>
          </div>
          <ChartCard title="Hourly Gate Waiting Time Trend (Minutes)" height={240}>
            <BarsChart
              data={[
                { label: "06:00", time: 3 },
                { label: "08:00", time: 8 },
                { label: "10:00", time: 6 },
                { label: "12:00", time: 4 },
                { label: "14:00", time: 5 },
                { label: "16:00", time: 7 },
                { label: "18:00", time: 4 },
              ]}
              series={[{ key: "time", label: "Wait Time (mins)", color: C.cyan }]}
            />
          </ChartCard>
        </div>
      ) : activeModule === "entry" ? (
        <div className="space-y-6">
          <GlassCard className="p-5 border-l-4 border-success">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-success" /> Automated In-Gate Camera & Scanner Log
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Real-time OCR plate recognition, driver biometric fingerprint verification, and container gross mass confirmation.
            </p>
          </GlassCard>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-card/60 border border-border/60">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">Latest In-Gate Scan</span>
              <div className="mt-3 space-y-2 text-xs font-mono">
                <div className="flex justify-between"><span className="text-muted-foreground">Truck Plate:</span> <span className="text-cyan font-bold">SLB 8821 X</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Driver:</span> <span className="text-foreground">Tan Wei Meng (ID: S****129A)</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">RFID Tag:</span> <span className="text-foreground">RF-99182301</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Entry Timestamp:</span> <span className="text-foreground">{new Date().toLocaleTimeString()} SGT</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Gate / Lane:</span> <span className="text-foreground">Tuas Gate 03, Lane 4</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Weigh-In-Motion:</span> <span className="text-success font-bold">34,120 kg (Match Verified)</span></div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-card/60 border border-border/60">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">Safety & Pre-Check</span>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-success"><CheckCircle2 className="w-4 h-4" /> PPE Helmet & Vest Detected</div>
                <div className="flex items-center gap-2 text-success"><CheckCircle2 className="w-4 h-4" /> Roadworthiness Certificate Valid</div>
                <div className="flex items-center gap-2 text-success"><CheckCircle2 className="w-4 h-4" /> Electronic Job Order Active</div>
                <div className="flex items-center gap-2 text-cyan"><ArrowRight className="w-4 h-4" /> Cleared for Yard Zone B2</div>
              </div>
            </div>
          </div>
        </div>
      ) : activeModule === "exit" ? (
        <div className="space-y-6">
          <GlassCard className="p-5 border-l-4 border-violet">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <DoorClosed className="w-4 h-4 text-violet" /> Out-Gate Clearance & Electronic Equipment Interchange Receipt (eEIR)
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Automated exit validation, container seal integrity verification, and digital interchange receipt generation.
            </p>
          </GlassCard>
          <div className="p-4 rounded-lg bg-card/60 border border-border/60 space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="font-bold text-sm text-foreground">eEIR #EIR-2026-99014</span>
              <span className="px-2 py-0.5 rounded bg-success/20 text-success font-semibold">GATE OUT CLEARED</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-muted-foreground">Container Number:</div>
                <div className="text-foreground font-bold">MSKU-982140</div>
                <div className="text-muted-foreground mt-2">Verified Seal Number:</div>
                <div className="text-foreground font-bold">SG-CUSTOMS-99120</div>
              </div>
              <div>
                <div className="text-muted-foreground">Exit Gate:</div>
                <div className="text-foreground">Tuas West Exit Gate 2</div>
                <div className="text-muted-foreground mt-2">Departure Timestamp:</div>
                <div className="text-foreground">{new Date().toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      ) : activeModule === "nav" ? (
        <div className="space-y-6">
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan" /> Port Internal GPS & Route Guidance
                </h3>
                <p className="text-xs text-muted-foreground">Turn-by-turn routing from Tuas In-Gate to Yard Block B3</p>
              </div>
              <span className="text-xs text-cyan font-mono font-medium">Distance: 1.4 km · 4 mins</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded bg-white/[0.02] border border-border/60 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan/20 text-cyan flex items-center justify-center font-bold text-[11px]">1</span>
                <span>Enter Tuas In-Gate 3, proceed straight along Terminal Perimeter Way for 600m.</span>
              </div>
              <div className="p-3 rounded bg-white/[0.02] border border-border/60 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan/20 text-cyan flex items-center justify-center font-bold text-[11px]">2</span>
                <span>Turn right onto Cross-Yard Avenue. Keep left for Rubber-Tired Gantry (RTG) Lane 2.</span>
              </div>
              <div className="p-3 rounded bg-white/[0.02] border border-border/60 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan/20 text-cyan flex items-center justify-center font-bold text-[11px]">3</span>
                <span>Stop at Bay B3-04 under RTG Crane 08 for automated top-pick loading.</span>
              </div>
            </div>
          </GlassCard>
        </div>
      ) : activeModule === "history" ? (
        <div className="space-y-6">
          <DataPanel
            title="Haulage Trip History & Turnaround Records"
            subtitle="Historical log of completed container haulage deliveries and gate clearance times"
            rows={delivered.length > 0 ? delivered : cts.slice(0, 6)}
            loading={isLoading}
            emptyTitle="No completed trips."
            searchKeys={["truck_plate", "driver_name", "destination"]}
            exportName="trip-history.csv"
            columns={[
              { key: "container_number", label: "Container", render: (r) => <span className="font-mono text-xs text-cyan">{r.container_number || "MSKU-982140"}</span> },
              { key: "truck_plate", label: "Prime Mover", render: (r) => r.truck_plate || "SLB 8821 X" },
              { key: "driver_name", label: "Driver", render: (r) => r.driver_name || "Tan Wei Meng" },
              { key: "destination", label: "Consignee", render: (r) => r.destination || "PSA Logistics Hub Tuas" },
              {
                key: "stage",
                label: "Delivery Status",
                render: (r) => <StatusBadge status="Delivered" tone="success" />,
              },
            ]}
          />
        </div>
      ) : (
        /* Default: Dashboard */
        <div className="space-y-6">
          <WorkflowOverview activeStage="dispatch_ready" counts={stageCounts(rows)} />

          <div className="grid lg:grid-cols-3 gap-4">
            <ChartCard className="lg:col-span-2" title="Container movements by stage" height={230}>
              {cts.length === 0 ? (
                <NoDataCard
                  title="No truck assignments."
                  reason="Assignments appear once the warehouse releases containers for collection."
                />
              ) : (
                <BarsChart
                  data={containerStageBars(cts)}
                  series={[{ key: "containers", label: "Containers", color: C.cyan }]}
                />
              )}
            </ChartCard>
            <ChartCard title="Trip status" height={230}>
              {cts.length === 0 ? (
                <NoDataCard
                  title="No trips recorded."
                  reason="Trip status is derived from assigned containers."
                />
              ) : (
                <DonutChart
                  data={[
                    { name: "Awaiting pickup", value: pending.length, color: C.warning },
                    { name: "Assigned", value: assigned.length, color: C.cyan },
                    { name: "In transit", value: transit.length, color: C.violet },
                    { name: "Delivered", value: delivered.length, color: C.success },
                  ].filter((d) => d.value > 0)}
                />
              )}
            </ChartCard>
          </div>

          <ContainerBoard
            title="Pickup requests"
            subtitle="Assign a truck, driver and collection window"
            stages={["dispatch_ready"]}
            emptyTitle="No truck assignments."
            emptyDescription="Pickup requests arrive when the warehouse prepares a dispatch."
            exportName="truck-pickups.csv"
            fields={[
              { key: "truck_plate", label: "Truck plate", required: true },
              { key: "driver_name", label: "Driver", required: true },
              { key: "pickup_at", label: "Pickup time", type: "datetime-local" },
            ]}
            advance={{ label: "Assign truck", stage: "assigned_truck" }}
          />

          <ContainerBoard
            title="Trip status"
            subtitle="Start the trip once the container leaves the warehouse"
            stages={["assigned_truck"]}
            emptyTitle="No assigned trips."
            emptyDescription="Assign a truck and driver to a pickup request first."
            exportName="truck-trips.csv"
            fields={[{ key: "destination", label: "Destination" }]}
            advance={{ label: "Start trip", stage: "in_transit" }}
          />

          <SubmissionWorkspace
            stages={QUEUE}
            portal="Trucking"
            suggestions={[
              "Best collection window?",
              "Which trips are at risk?",
              "Fleet utilisation today",
            ]}
            emptyTitle="No pickup requests."
            emptyDescription="Requests appear when the warehouse marks a consignment ready for dispatch."
            actions={({ submission }) => (
              <StageActions
                submission={submission}
                actions={ACTIONS}
                notesLabel="Dispatch notes (truck, driver, route)"
                hint="Dispatching the shipment notifies the logistics manager."
              />
            )}
          />

          <div className="grid lg:grid-cols-3 gap-4">
            <ActivityCard className="lg:col-span-2" title="Dispatch log" />
            <div className="space-y-4">
              <NotificationsCard title="Dispatch alerts" />
              <CalendarWidget title="Slot calendar" />
              <RouteIntelligenceWidget />
              <HelpCard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RouteIntelligenceWidget() {
  const { data: containers } = useAllContainers();
  const activeTrips = (containers ?? []).filter((c) =>
    ["assigned_truck", "in_transit"].includes(c.stage),
  );

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
          Route &amp; GPS Intelligence
        </div>
        <StatusBadge status={`${activeTrips.length} Active Trips`} />
      </div>

      {activeTrips.length === 0 ? (
        <NoDataCard
          title="No active trips in transit"
          reason="Assign a truck and driver to a container to start route intelligence tracking."
        />
      ) : (
        <div className="space-y-2 text-xs font-mono">
          {activeTrips.slice(0, 4).map((c) => (
            <div key={c.id} className="p-2 rounded bg-white/[0.02] border border-border/60">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-cyan">{c.truck_plate || "UNASSIGNED"}</span>
                <span className="text-muted-foreground">
                  {c.driver_name || "Driver unassigned"}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="text-foreground">
                  Dest: {c.destination || "PSA Logistics Hub"}
                </span>
                <StatusBadge status={c.stage.replace(/_/g, " ")} />
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
