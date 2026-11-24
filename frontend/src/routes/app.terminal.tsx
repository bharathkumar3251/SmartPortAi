import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { StatTile } from "@/components/common/StatTile";
import { NoDataCard } from "@/components/common/NoDataCard";
import { BarsChart, C, ChartCard, DonutChart } from "@/components/dash/Charts";
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
import { GlassCard } from "@/components/common/GlassCard";
import { useAllContainers, useAllSubmissions, useRegisterContainers } from "@/hooks/useOps";
import { containerStageBars, stageCounts } from "@/lib/ops-metrics";
import type { Stage, Submission } from "@/lib/workflow";
import {
  Anchor,
  Boxes,
  Container,
  Loader2,
  Ship,
  Wrench,
  Clock,
  Gauge,
  Activity,
  CheckCircle2,
  ArrowDownToLine,
  ArrowUpFromLine,
  Layers,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/terminal")({
  validateSearch: (search: Record<string, unknown>): { m?: string } => ({
    m: search.m ? String(search.m) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Terminal Operations — SmartPort AI" },
      {
        name: "description",
        content:
          "Unloading schedules, crane assignment, yard allocation and container hand-off to the warehouse.",
      },
      { property: "og:title", content: "Terminal Operations — SmartPort AI" },
      {
        property: "og:description",
        content: "Berth, crane and yard operations for allocated vessels.",
      },
    ],
  }),
  component: TerminalPage,
});

const QUEUE: Stage[] = ["berth_assigned", "terminal_scheduled", "unloading"];

function actionsFor(stage: Stage): StageAction[] {
  if (stage === "berth_assigned") {
    return [
      {
        label: "Create unloading schedule",
        stage: "terminal_scheduled",
        action: "Unloading scheduled",
      },
    ];
  }
  if (stage === "terminal_scheduled") {
    return [{ label: "Start unloading", stage: "unloading", action: "Unloading started" }];
  }
  if (stage === "unloading") {
    return [
      {
        label: "Mark unloading complete",
        stage: "warehouse_received",
        action: "Unloading completed — handed to warehouse",
      },
    ];
  }
  return [];
}

function TerminalPage() {
  const { m } = Route.useSearch();
  const navigate = useNavigate();
  const activeModule = m ?? "dashboard";

  const { data: subs, isLoading } = useAllSubmissions();
  const { data: containers } = useAllContainers();
  const rows = subs ?? [];
  const queue = rows.filter((s) => QUEUE.includes(s.stage));
  const cts = containers ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Terminal Operator"
        title="Berth, crane & yard operations."
        subtitle="Receive approved vessels, build the unloading schedule, assign cranes and yard slots, then hand containers to the warehouse."
      />

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-border mb-6 overflow-x-auto scrollbar-none pb-1">
        {[
          { id: "dashboard", label: "Overview" },
          { id: "berths", label: "Assigned Berths" },
          { id: "cranes", label: "Crane Utilization" },
          { id: "loading", label: "Loading Queue" },
          { id: "unloading", label: "Unloading Queue" },
          { id: "yard", label: "Yard Capacity" },
          { id: "container-yard", label: `Container Yard (${cts.length})` },
          { id: "equipment", label: "Equipment" },
          { id: "timeline", label: "Timeline" },
          { id: "maintenance", label: "Maintenance" },
          { id: "kpis", label: "KPIs" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              navigate({
                to: "/app/terminal",
                search: { m: tab.id === "dashboard" ? undefined : tab.id },
              })
            }
            className={`px-3 py-2 text-xs font-mono uppercase tracking-wider rounded-t-md transition-colors whitespace-nowrap ${
              activeModule === tab.id
                ? "bg-white/[0.08] text-cyan border-b-2 border-cyan font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* VIEW: OVERVIEW */}
      {activeModule === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <StatTile
              label="Vessels allocated"
              icon={Anchor}
              loading={isLoading}
              value={rows.filter((s) => s.stage === "berth_assigned").length}
            />
            <StatTile
              label="Scheduled"
              icon={Ship}
              tone="cyan"
              loading={isLoading}
              value={rows.filter((s) => s.stage === "terminal_scheduled").length}
            />
            <StatTile
              label="Unloading now"
              icon={Wrench}
              tone="warning"
              loading={isLoading}
              value={rows.filter((s) => s.stage === "unloading").length}
            />
            <StatTile label="Containers registered" icon={Container} tone="violet" value={cts.length} />
            <StatTile
              label="In yard"
              icon={Boxes}
              tone="success"
              value={cts.filter((c) => c.stage === "yard").length}
            />
            <StatTile
              label="Handed to warehouse"
              icon={Boxes}
              value={
                cts.filter((c) =>
                  [
                    "warehouse_received",
                    "stored",
                    "dispatch_ready",
                    "assigned_truck",
                    "in_transit",
                    "delivered",
                  ].includes(c.stage),
                ).length
              }
            />
          </div>

          <div>
            <WorkflowOverview activeStage="terminal_scheduled" counts={stageCounts(rows)} />
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <ChartCard className="lg:col-span-2" title="Containers by operational stage" height={230}>
              {cts.length === 0 ? (
                <NoDataCard
                  title="No containers registered"
                  reason="Register the container manifest for a scheduled vessel to populate the yard view."
                />
              ) : (
                <BarsChart
                  data={containerStageBars(cts)}
                  series={[{ key: "containers", label: "Containers", color: C.cyan }]}
                />
              )}
            </ChartCard>
            <ChartCard title="Hazardous split" height={230}>
              {cts.length === 0 ? (
                <NoDataCard
                  title="No containers registered"
                  reason="Hazardous split appears once containers exist."
                />
              ) : (
                <DonutChart
                  data={[
                    { name: "Standard", value: cts.filter((c) => !c.hazardous).length, color: C.cyan },
                    { name: "IMDG", value: cts.filter((c) => c.hazardous).length, color: C.danger },
                  ].filter((d) => d.value > 0)}
                />
              )}
            </ChartCard>
          </div>

          <div>
            <SubmissionWorkspace
              stages={QUEUE}
              portal="Terminal"
              suggestions={[
                "Optimal crane allocation?",
                "Which vessel unloads first?",
                "Yard capacity risk",
              ]}
              emptyTitle="No vessels available."
              emptyDescription="Vessels appear here once the Port Authority allocates a berth."
              actions={({ submission }) => (
                <StageActions
                  submission={submission}
                  actions={actionsFor(submission.stage)}
                  notesLabel="Operational notes (crane, gang, sequence)"
                  hint="Completing unloading notifies the warehouse manager."
                />
              )}
              extra={({ submission }) => <ManifestPanel submission={submission} />}
            />
          </div>

          <div>
            <ContainerBoard
              title="Yard & crane assignment"
              subtitle="Select containers to assign a crane, unloading gang and yard slot"
              stages={["at_vessel", "unloading", "yard"]}
              emptyTitle="No containers at the terminal."
              emptyDescription="Register a vessel's container manifest to start yard operations."
              exportName="terminal-containers.csv"
              fields={[
                { key: "crane_id", label: "Crane" },
                { key: "unloading_team", label: "Gang" },
                { key: "yard_slot", label: "Yard slot" },
              ]}
              advance={{ label: "Assign to yard", stage: "yard" }}
            />
          </div>

          <div>
            <ContainerBoard
              title="Hand-off to warehouse"
              subtitle="Containers cleared from the yard are released to the warehouse"
              stages={["yard"]}
              emptyTitle="No containers ready for hand-off."
              emptyDescription="Assign containers to a yard slot first."
              exportName="terminal-handoff.csv"
              advance={{ label: "Release to warehouse", stage: "warehouse_received" }}
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <ActivityCard className="lg:col-span-2" title="Terminal activity" />
            <div className="space-y-4">
              <NotificationsCard title="Terminal alerts" />
              <CalendarWidget title="Berth calendar" />
              <HelpCard />
            </div>
          </div>
        </div>
      )}

      {/* VIEW: ASSIGNED BERTHS */}
      {activeModule === "berths" && (
        <div className="space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Assigned Berths &amp; Quay Operations</div>
                <div className="text-sm font-medium mt-0.5">Vessels currently allocated to terminal quayside</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan/10 text-cyan border border-cyan/25 text-xs font-mono">
                {rows.filter((s) => s.stage === "berth_assigned" || s.berth_code).length} Berths Assigned
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[10px]">
                    <th className="text-left py-2.5">Berth</th>
                    <th className="text-left py-2.5">Vessel</th>
                    <th className="text-left py-2.5">Carrier</th>
                    <th className="text-right py-2.5">Discharge (TEU)</th>
                    <th className="text-right py-2.5">Crane Gang</th>
                    <th className="text-right py-2.5">Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {rows.filter((s) => s.stage === "berth_assigned" || s.berth_code).map((s) => (
                    <tr key={s.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 text-cyan font-bold">{s.berth_code || "P3"}</td>
                      <td className="py-3 text-foreground font-semibold">{s.vessel_name}</td>
                      <td className="py-3 text-muted-foreground">{s.shipping_company}</td>
                      <td className="py-3 text-right">{s.container_count} TEU</td>
                      <td className="py-3 text-right text-success">QC-03 / Gang Alpha</td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 rounded bg-cyan/10 text-cyan border border-cyan/20 text-[10px]">
                          {s.stage.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* VIEW: CRANES */}
      {activeModule === "cranes" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile label="Total Quay Cranes" icon={Wrench} tone="cyan" value="8 Cranes" />
            <StatTile label="Active in Operation" icon={Activity} tone="success" value="6 Active" />
            <StatTile label="Average Gross Moves" icon={Gauge} tone="violet" value="34.8 moves/hr" />
            <StatTile label="Maintenance" icon={Clock} tone="warning" value="2 Standby" />
          </div>

          <GlassCard>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-4">
              Quay Crane Telemetry &amp; Productivity
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
              {[
                { id: "QC-01", status: "Active", moves: "36 moves/h", vessel: "Ever Given", gang: "Alpha" },
                { id: "QC-02", status: "Active", moves: "34 moves/h", vessel: "Ever Given", gang: "Beta" },
                { id: "QC-03", status: "Active", moves: "38 moves/h", vessel: "Maersk Mc-Kinney", gang: "Gamma" },
                { id: "QC-04", status: "Active", moves: "32 moves/h", vessel: "CMA CGM Palais", gang: "Delta" },
                { id: "QC-05", status: "Standby", moves: "—", vessel: "Ready", gang: "Standby" },
                { id: "QC-06", status: "Active", moves: "35 moves/h", vessel: "COSCO Shipping", gang: "Epsilon" },
                { id: "QC-07", status: "Active", moves: "34 moves/h", vessel: "ONE Apus", gang: "Zeta" },
                { id: "QC-08", status: "Maintenance", moves: "—", vessel: "Servicing", gang: "Tech Crew" },
              ].map((c) => (
                <div key={c.id} className="p-3 rounded border border-border/70 bg-white/[0.02] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-cyan text-sm">{c.id}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${c.status === "Active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="text-foreground font-semibold">{c.moves}</div>
                  <div className="text-muted-foreground text-[11px] truncate">Assigned: {c.vessel}</div>
                  <div className="text-cyan text-[10px]">Gang: {c.gang}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* VIEW: LOADING QUEUE */}
      {activeModule === "loading" && (
        <div className="space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Outbound Vessel Loading Queue</div>
                <div className="text-sm font-medium mt-0.5">Export container staging bays and vessel stowage plans</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-success/10 text-success border border-success/20 text-xs font-mono">
                Stowage Verification Active
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[10px]">
                    <th className="text-left py-2.5">Vessel</th>
                    <th className="text-left py-2.5">Quay Bay</th>
                    <th className="text-right py-2.5">Staged TEUs</th>
                    <th className="text-right py-2.5">Stowage Progress</th>
                    <th className="text-right py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-3 text-foreground font-bold">Ever Given</td>
                    <td className="py-3 text-cyan">Bay 14-22</td>
                    <td className="py-3 text-right">420 / 600 TEU</td>
                    <td className="py-3 text-right text-success font-semibold">70%</td>
                    <td className="py-3 text-right">
                      <span className="px-2 py-0.5 rounded bg-cyan/10 text-cyan border border-cyan/20 text-[10px]">Loading in progress</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* VIEW: UNLOADING QUEUE */}
      {activeModule === "unloading" && (
        <div className="space-y-6">
          <SubmissionWorkspace
            stages={QUEUE}
            portal="Terminal Unloading"
            suggestions={[
              "Unload priority containers first",
              "Which crane unloads fastest?",
              "Hazardous discharge protocol",
            ]}
            emptyTitle="No unloading jobs queued."
            emptyDescription="Vessels ready for discharge will appear here."
            actions={({ submission }) => (
              <StageActions
                submission={submission}
                actions={actionsFor(submission.stage)}
                notesLabel="Operational notes (crane, gang, sequence)"
                hint="Completing unloading notifies the warehouse manager."
              />
            )}
            extra={({ submission }) => <ManifestPanel submission={submission} />}
          />
        </div>
      )}

      {/* VIEW: YARD CAPACITY */}
      {activeModule === "yard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile label="Total Yard Capacity" icon={Boxes} tone="cyan" value="24,000 TEU" />
            <StatTile label="Current Yard Stacking" icon={Layers} tone="warning" value="16,840 TEU" />
            <StatTile label="Yard Utilization" icon={Gauge} tone="violet" value="70.2%" />
            <StatTile label="Reefer Plugs Occupancy" icon={Cpu} tone="success" value="82% (820 / 1000)" />
          </div>

          <GlassCard>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-4">
              Terminal Stacking Blocks (Pasir Panjang Terminal)
            </div>
            <div className="grid md:grid-cols-3 gap-3 font-mono text-xs">
              {[
                { block: "Block A (Inbound Dry)", cap: "78%", slots: "3,120 / 4,000", tone: "warning" },
                { block: "Block B (Export Staging)", cap: "64%", slots: "2,560 / 4,000", tone: "success" },
                { block: "Block C (Reefer Cold Chain)", cap: "82%", slots: "820 / 1,000", tone: "warning" },
                { block: "Block D (IMDG Dangerous Goods)", cap: "38%", slots: "380 / 1,000", tone: "success" },
                { block: "Block E (Empty Repositioning)", cap: "88%", slots: "4,400 / 5,000", tone: "danger" },
                { block: "Block F (Buffer Yard)", cap: "45%", slots: "1,800 / 4,000", tone: "success" },
              ].map((b) => (
                <div key={b.block} className="p-3.5 rounded border border-border/70 bg-white/[0.02] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">{b.block}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${b.tone === "danger" ? "bg-danger/10 text-danger" : b.tone === "warning" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}>
                      {b.cap}
                    </span>
                  </div>
                  <div className="text-muted-foreground">{b.slots} TEU</div>
                  <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan to-violet" style={{ width: b.cap }} />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* VIEW: CONTAINER YARD */}
      {activeModule === "container-yard" && (
        <div className="space-y-6">
          <ContainerBoard
            title="Yard & crane assignment"
            subtitle="Select containers to assign a crane, unloading gang and yard slot"
            stages={["at_vessel", "unloading", "yard"]}
            emptyTitle="No containers at the terminal."
            emptyDescription="Register a vessel's container manifest to start yard operations."
            exportName="terminal-containers.csv"
            fields={[
              { key: "crane_id", label: "Crane" },
              { key: "unloading_team", label: "Gang" },
              { key: "yard_slot", label: "Yard slot" },
            ]}
            advance={{ label: "Assign to yard", stage: "yard" }}
          />
        </div>
      )}

      {/* VIEW: EQUIPMENT */}
      {activeModule === "equipment" && (
        <div className="space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Terminal Heavy Equipment Fleet</div>
                <div className="text-sm font-medium mt-0.5">Automated Guided Vehicles, RTGs, and Prime Movers</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-success/10 text-success border border-success/20 text-xs font-mono">
                98.4% Fleet Availability
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[10px]">
                    <th className="text-left py-2.5">Equipment Type</th>
                    <th className="text-right py-2.5">Total Fleet</th>
                    <th className="text-right py-2.5">Active</th>
                    <th className="text-right py-2.5">Standby</th>
                    <th className="text-right py-2.5">Maintenance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {[
                    { type: "Quay Cranes (Super Post-Panamax)", total: 8, active: 6, sb: 1, mt: 1 },
                    { type: "Rubber Tyred Gantry (RTG) Cranes", total: 32, active: 28, sb: 3, mt: 1 },
                    { type: "Automated Guided Vehicles (AGV)", total: 48, active: 44, sb: 4, mt: 0 },
                    { type: "Terminal Prime Movers", total: 60, active: 52, sb: 6, mt: 2 },
                  ].map((eq) => (
                    <tr key={eq.type} className="hover:bg-white/[0.02]">
                      <td className="py-3 text-foreground font-semibold">{eq.type}</td>
                      <td className="py-3 text-right font-bold text-cyan">{eq.total}</td>
                      <td className="py-3 text-right text-success">{eq.active}</td>
                      <td className="py-3 text-right text-muted-foreground">{eq.sb}</td>
                      <td className="py-3 text-right text-warning">{eq.mt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* VIEW: TIMELINE */}
      {activeModule === "timeline" && (
        <div className="space-y-6">
          <CalendarWidget title="Terminal Operations 24-Hour Shift Timeline" />
        </div>
      )}

      {/* VIEW: MAINTENANCE */}
      {activeModule === "maintenance" && (
        <div className="space-y-6">
          <GlassCard>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-4">
              Preventive &amp; Scheduled Equipment Maintenance
            </div>
            <div className="space-y-3 font-mono text-xs">
              {[
                { asset: "Quay Crane QC-08", work: "Wire rope replacement and hoist gearbox lube", due: "In Progress · Due 18:00", tech: "Engineering Shift A" },
                { asset: "RTG Crane Block E-04", work: "Diesel generator filter replacement", due: "Scheduled Tomorrow 08:00", tech: "Maintenance Team 2" },
                { asset: "Spreader System SP-12", work: "Twistlock sensor calibration & ultrasonic test", due: "Passed Inspection", tech: "Quality Assurance" },
              ].map((m) => (
                <div key={m.asset} className="p-3.5 rounded border border-border/70 bg-white/[0.02] flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">{m.asset}</div>
                    <div className="text-muted-foreground text-[11px]">{m.work}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-cyan text-[11px] font-bold">{m.due}</div>
                    <div className="text-muted-foreground text-[10px]">{m.tech}</div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* VIEW: KPIS */}
      {activeModule === "kpis" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile label="Moves per Crane Hour" icon={Gauge} tone="cyan" value="34.8" />
            <StatTile label="Average Truck Turnaround" icon={Clock} tone="success" value="22.4 min" />
            <StatTile label="Yard Dwell Time" icon={Boxes} tone="violet" value="2.8 days" />
            <StatTile label="Schedule Adherence" icon={CheckCircle2} tone="warning" value="98.2%" />
          </div>
        </div>
      )}
    </div>
  );
}

function ManifestPanel({ submission }: { submission: Submission }) {
  const register = useRegisterContainers();
  const { data: containers } = useAllContainers();
  const mine = (containers ?? []).filter((c) => c.submission_id === submission.id);
  const remaining = Math.max(0, submission.container_count - mine.length);

  return (
    <GlassCard>
      <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-3">
        Container manifest
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[12.5px] text-muted-foreground">
          {mine.length} of {submission.container_count} declared containers registered
          {remaining === 0 && submission.container_count > 0 ? " — manifest complete." : "."}
        </div>
        <button
          onClick={async () => {
            if (remaining === 0) {
              toast.info("Manifest already complete");
              return;
            }
            try {
              const n = await register.mutateAsync({ submission, count: remaining });
              toast.success(`${n} container records created`);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Could not register containers");
            }
          }}
          disabled={register.isPending || remaining === 0}
          className="h-9 px-3.5 rounded-md border border-cyan/40 bg-cyan/10 text-cyan text-[12.5px] inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          {register.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Register {remaining || ""} container{remaining === 1 ? "" : "s"}
        </button>
      </div>
    </GlassCard>
  );
}
