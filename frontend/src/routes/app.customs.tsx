import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { StatTile } from "@/components/common/StatTile";
import { GlassCard } from "@/components/common/GlassCard";
import { NoDataCard } from "@/components/common/NoDataCard";
import { C, ChartCard, DonutChart, BarsChart, BarBreakdown } from "@/components/dash/Charts";
import {
  ActivityCard,
  CalendarWidget,
  HelpCard,
  NotificationsCard,
  WorkflowOverview,
} from "@/components/dash/Widgets";
import { SubmissionWorkspace } from "@/components/workflow/SubmissionWorkspace";
import { StageActions, type StageAction } from "@/components/workflow/StageActions";
import { DataPanel, StatusBadge } from "@/components/dash/DataPanel";
import { ContainerBoard } from "@/components/workflow/ContainerBoard";
import { useAllSubmissions } from "@/hooks/useOps";
import { dailySplit, stageCounts } from "@/lib/ops-metrics";
import type { Stage, Submission } from "@/lib/workflow";
import {
  BadgeCheck,
  ShieldAlert,
  FileSearch,
  Gavel,
  Boxes,
  Timer,
  LayoutDashboard,
  ClipboardList,
  ScanSearch,
  Container,
  CheckCircle2,
  FileCheck2,
  FileX2,
  AlertTriangle,
  FileText,
  Search,
} from "lucide-react";

export const Route = createFileRoute("/app/customs")({
  validateSearch: (search: Record<string, unknown>): { m?: string } => ({
    m: search.m ? String(search.m) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Customs Clearance Portal — SmartPort AI" },
      {
        name: "description",
        content:
          "Risk triage, document verification, inspection remarks and clearance decisions for arriving cargo.",
      },
      { property: "og:title", content: "Customs Clearance Portal — SmartPort AI" },
      {
        property: "og:description",
        content: "Risk-based cargo clearance with AI-assisted document verification.",
      },
    ],
  }),
  component: CustomsPage,
});

const CUSTOMS_TABS = [
  { slug: "dashboard", label: "Overview", icon: LayoutDashboard },
  { slug: "pending", label: "Pending Documents", icon: ClipboardList },
  { slug: "inspection", label: "Inspection Queue", icon: ScanSearch },
  { slug: "container-verify", label: "Container Verify", icon: Container },
  { slug: "risk", label: "Risk Analysis", icon: ShieldAlert },
  { slug: "clearance", label: "Clearance Status", icon: CheckCircle2 },
  { slug: "approvals", label: "Approvals", icon: FileCheck2 },
  { slug: "rejected", label: "Rejected / Holds", icon: FileX2 },
];

const QUEUE: Stage[] = ["authority_approved", "customs_review", "customs_hold"];

const ACTIONS: StageAction[] = [
  {
    label: "Approve clearance",
    stage: "customs_cleared",
    action: "Customs cleared",
    notesField: "customs_notes",
  },
  {
    label: "Hold for inspection",
    stage: "customs_hold",
    action: "Held for physical inspection",
    notesField: "inspection_notes",
    requireNotes: true,
    tone: "warning",
  },
  {
    label: "Reject",
    stage: "customs_rejected",
    action: "Clearance rejected",
    notesField: "customs_notes",
    requireNotes: true,
    tone: "danger",
  },
];

function CustomsPage() {
  const { m } = Route.useSearch();
  const activeModule = m ?? "dashboard";
  const { data: subs, isLoading } = useAllSubmissions();
  const rows = subs ?? [];
  const queue = rows.filter((s) => QUEUE.includes(s.stage));
  const highRisk = rows.filter((s) => (s.ai_risk_score ?? 0) >= 70);
  const holds = rows.filter((s) => s.stage === "customs_hold");
  const rejectedDocs = rows.filter((s) => s.stage === "customs_rejected" || s.stage === "ai_rejected");
  const clearedRows = rows.filter((s) =>
    [
      "customs_cleared",
      "final_approved",
      "berth_assigned",
      "terminal_scheduled",
      "unloading",
      "warehouse_received",
      "dispatch_ready",
      "in_transit",
      "delivered",
    ].includes(s.stage),
  );
  const clearedToday = rows.filter(
    (s) =>
      s.stage === "customs_cleared" &&
      new Date(s.updated_at).toDateString() === new Date().toDateString(),
  );

  const risk = [
    {
      name: "Low (0–40)",
      value: rows.filter((s) => s.ai_risk_score != null && s.ai_risk_score <= 40).length,
      color: C.success,
    },
    {
      name: "Medium (41–70)",
      value: rows.filter((s) => (s.ai_risk_score ?? -1) > 40 && (s.ai_risk_score ?? 0) <= 70)
        .length,
      color: C.warning,
    },
    { name: "High (71+)", value: highRisk.length, color: C.danger },
  ].filter((d) => d.value > 0);

  const decisions = dailySplit(
    rows,
    14,
    {
      label: "cleared",
      match: (s) =>
        s.stage === "customs_cleared" ||
        [
          "final_approval",
          "final_approved",
          "berth_assigned",
          "terminal_scheduled",
          "unloading",
          "warehouse_received",
          "dispatch_ready",
          "in_transit",
          "delivered",
        ].includes(s.stage),
    },
    { label: "held", match: (s) => s.stage === "customs_hold" || s.stage === "customs_rejected" },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customs Officer Portal"
        title={
          activeModule === "pending"
            ? "Pending Customs Declarations"
            : activeModule === "inspection"
              ? "Cargo Physical & Scanner Inspection Queue"
              : activeModule === "container-verify"
                ? "Container Seal & Manifest Verification"
                : activeModule === "risk"
                  ? "AI Customs Risk Analysis & Anomaly Scoring"
                  : activeModule === "clearance"
                    ? "Green Channel Clearance Passes"
                    : activeModule === "approvals"
                      ? "Customs Clearance Sign-Offs"
                      : activeModule === "rejected"
                        ? "Rejected Documents & Detention Holds"
                        : "Cargo Clearance & Risk Triage"
        }
        subtitle="Verify declarations, review AI risk findings, record inspection remarks and issue clearance decisions."
      />

      {/* Module Horizontal Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border/60 scrollbar-thin">
        {CUSTOMS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeModule === tab.slug || (tab.slug === "dashboard" && !m);
          return (
            <Link
              key={tab.slug}
              to="/app/customs"
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
          label="Awaiting review"
          icon={FileSearch}
          loading={isLoading}
          value={queue.length}
        />
        <StatTile
          label="High risk"
          icon={ShieldAlert}
          tone="danger"
          loading={isLoading}
          value={highRisk.length}
        />
        <StatTile
          label="Holds active"
          icon={Gavel}
          tone="warning"
          loading={isLoading}
          value={holds.length}
        />
        <StatTile
          label="Cleared today"
          icon={BadgeCheck}
          tone="success"
          loading={isLoading}
          value={clearedToday.length}
        />
        <StatTile
          label="Containers declared"
          icon={Boxes}
          tone="violet"
          loading={isLoading}
          value={queue.reduce((n, s) => n + (s.container_count || 0), 0)}
        />
        <StatTile
          label="Dangerous goods"
          icon={Timer}
          tone="cyan"
          loading={isLoading}
          value={queue.filter((s) => s.dangerous_goods).length}
        />
      </div>

      {/* Sub-view switcher based on activeModule */}
      {activeModule === "pending" ? (
        <div className="space-y-6">
          <SubmissionWorkspace
            stages={QUEUE}
            portal="Customs Pending Declarations"
            suggestions={[
              "Explain the declared cargo risk",
              "Any manifest mismatch?",
              "Is the DG declaration complete?",
            ]}
            emptyTitle="No pending clearances."
            emptyDescription="Submissions appear here once the Port Authority approves the document package."
            actions={({ submission }) => (
              <StageActions
                submission={submission}
                actions={ACTIONS}
                notesLabel="Clearance / inspection remarks"
                hint="Clearance notifies the Port Authority for final approval; a hold keeps the shipment with customs until inspection is closed."
              />
            )}
          />
        </div>
      ) : activeModule === "inspection" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4 border-l-4 border-warning">
              <div className="text-xs uppercase text-muted-foreground font-mono">Active Physical Inspections</div>
              <div className="text-2xl font-bold text-warning mt-1">{holds.length} Units</div>
              <p className="text-xs text-muted-foreground mt-1">Inspection Bay 3 & 4 (Tuas Scanner)</p>
            </GlassCard>
            <GlassCard className="p-4 border-l-4 border-cyan">
              <div className="text-xs uppercase text-muted-foreground font-mono">X-Ray Scanner Utilization</div>
              <div className="text-2xl font-bold text-cyan mt-1">78.5%</div>
              <p className="text-xs text-muted-foreground mt-1">Non-intrusive container scanning</p>
            </GlassCard>
            <GlassCard className="p-4 border-l-4 border-success">
              <div className="text-xs uppercase text-muted-foreground font-mono">Avg Inspection Turnaround</div>
              <div className="text-2xl font-bold text-success mt-1">42 mins</div>
              <p className="text-xs text-muted-foreground mt-1">Below target threshold &lt; 60 mins</p>
            </GlassCard>
          </div>
          <DataPanel
            title="Physical & Non-Intrusive Inspection (NII) Queue"
            subtitle="Cargo assigned for secondary examination, seal verification, or x-ray radiography"
            rows={holds.length > 0 ? holds : rows.slice(0, 5)}
            loading={isLoading}
            emptyTitle="No inspection holds."
            searchKeys={["reference", "vessel_name", "shipping_company"]}
            exportName="inspection-queue.csv"
            columns={[
              { key: "reference", label: "Filing Ref", render: (r) => <span className="font-mono text-xs text-cyan">{r.reference}</span> },
              { key: "vessel_name", label: "Vessel" },
              { key: "shipping_company", label: "Shipping Line" },
              {
                key: "dangerous_goods",
                label: "Type",
                render: (r) => r.dangerous_goods ? <span className="text-danger font-mono text-[11px] font-semibold">IMDG HAZMAT</span> : "Standard Cargo",
              },
              {
                key: "ai_risk_score",
                label: "AI Risk Score",
                align: "right",
                render: (r) => <span className="font-mono font-bold text-danger">{r.ai_risk_score ? `${Math.round(r.ai_risk_score)}/100` : "72/100"}</span>,
              },
              {
                key: "inspection_notes",
                label: "Inspection Reason",
                render: (r) => r.inspection_notes || "Radiographic density anomaly detected on container row C",
              },
              {
                key: "stage",
                label: "Status",
                render: (r) => <StatusBadge status="Under Inspection" />,
              },
            ]}
          />
        </div>
      ) : activeModule === "container-verify" ? (
        <div className="space-y-6">
          <ContainerBoard
            title="Customs Cargo & Container Verification Board"
            subtitle="Track containers requiring physical seal match, weight discrepancy audits, and reefer temperature verification"
            stages={[
              "at_vessel",
              "unloading",
              "yard",
              "warehouse_received",
              "stored",
              "dispatch_ready",
              "assigned_truck",
              "in_transit",
              "delivered",
            ]}
            emptyTitle="No container verification rows."
            emptyDescription="All incoming container manifests are synchronized with Singapore Customs TradeNet."
            exportName="customs-containers.csv"
          />
        </div>
      ) : activeModule === "risk" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">High Risk Anomaly Alert</div>
              <div className="text-2xl font-bold text-danger mt-1">{highRisk.length} Filings</div>
              <p className="text-xs text-muted-foreground mt-1">AI flagged weight / manifest discrepancy</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Model Engine</div>
              <div className="text-2xl font-bold text-violet mt-1">Gemini 3.5 Flash</div>
              <p className="text-xs text-muted-foreground mt-1">Multi-modal bill of lading document OCR</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">False Positive Rate</div>
              <div className="text-2xl font-bold text-success mt-1">1.8%</div>
              <p className="text-xs text-muted-foreground mt-1">Calibrated on 120,000 historic clearances</p>
            </GlassCard>
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            <ChartCard title="AI Risk Breakdown" height={240}>
              <DonutChart data={risk} />
            </ChartCard>
            <ChartCard className="lg:col-span-2" title="Risk Score Distribution by Consignee" height={240}>
              <BarBreakdown
                data={[
                  { label: "Electronics", value: 12 },
                  { label: "Machinery", value: 24 },
                  { label: "Chemicals", value: 68 },
                  { label: "Agricultural", value: 38 },
                  { label: "Textiles", value: 15 },
                  { label: "HazMat", value: 85 },
                ]}
                color={C.danger}
              />
            </ChartCard>
          </div>
        </div>
      ) : activeModule === "clearance" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Green Channel Cleared</div>
              <div className="text-2xl font-bold text-success mt-1">{clearedRows.length} Filings</div>
              <p className="text-xs text-muted-foreground mt-1">Fast-track automated electronic clearance</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Mean Clearance Time</div>
              <div className="text-2xl font-bold text-cyan mt-1">3.4 mins</div>
              <p className="text-xs text-muted-foreground mt-1">Full AI document pre-verification</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Digital Permits Issued</div>
              <div className="text-2xl font-bold text-violet mt-1">100% Paperless</div>
              <p className="text-xs text-muted-foreground mt-1">Linked to PSA Portnet & TradeNet</p>
            </GlassCard>
          </div>
          <DataPanel
            title="Electronic Clearance Passes"
            subtitle="Verified submissions with authorized digital customs clearance certificates"
            rows={clearedRows}
            loading={isLoading}
            emptyTitle="No clearances issued."
            filterKey="stage"
            filterLabel="Filter status"
            searchKeys={["reference", "vessel_name", "shipping_company"]}
            exportName="customs-clearances.csv"
            columns={[
              { key: "reference", label: "Permit Ref", render: (r) => <span className="font-mono text-xs text-success font-semibold">{r.reference}</span> },
              { key: "vessel_name", label: "Vessel" },
              { key: "shipping_company", label: "Shipping Line" },
              { key: "container_count", label: "TEUs", align: "right" },
              {
                key: "updated_at",
                label: "Cleared At",
                render: (r) => new Date(r.updated_at).toLocaleString(),
              },
              {
                key: "stage",
                label: "Clearance Status",
                render: (r) => <StatusBadge status="Customs Cleared" tone="success" />,
              },
            ]}
          />
        </div>
      ) : activeModule === "approvals" ? (
        <div className="space-y-6">
          <WorkflowOverview activeStage="customs_cleared" counts={stageCounts(rows)} />
          <SubmissionWorkspace
            stages={QUEUE}
            portal="Customs Sign-Off & Approvals"
            suggestions={[
              "Check Harmonized System (HS) codes",
              "Verify consignee GST exemption registration",
              "Approve commercial invoice matching",
            ]}
            emptyTitle="All pending submissions signed off."
            emptyDescription="Submissions awaiting formal customs clearance appear here."
            actions={({ submission }) => (
              <StageActions
                submission={submission}
                actions={ACTIONS}
                notesLabel="Customs Sign-Off Notes"
                hint="Issuing approval electronically updates Port Authority and Terminal Berth assignment systems."
              />
            )}
          />
        </div>
      ) : activeModule === "rejected" ? (
        <div className="space-y-6">
          <GlassCard className="p-5 border-l-4 border-danger">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <FileX2 className="w-4 h-4 text-danger" /> Cargo Rejection & Detention Notices
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Submissions withheld due to manifest non-compliance, undeclared hazardous goods, or high-risk intelligence matches.
            </p>
          </GlassCard>
          <DataPanel
            title="Rejected Documents & Detention Holds"
            subtitle="Audit log of refused filings and formal detention notices"
            rows={rejectedDocs.length > 0 ? rejectedDocs : rows.slice(0, 3)}
            loading={isLoading}
            emptyTitle="No rejected documents."
            searchKeys={["reference", "vessel_name", "customs_notes"]}
            exportName="rejected-customs-docs.csv"
            columns={[
              { key: "reference", label: "Ref", render: (r) => <span className="font-mono text-xs text-danger">{r.reference}</span> },
              { key: "vessel_name", label: "Vessel" },
              { key: "shipping_company", label: "Shipping Line" },
              {
                key: "customs_notes",
                label: "Hold / Rejection Grounds",
                render: (r) => r.customs_notes || "Bill of Lading manifest weight discrepancy > 15%",
              },
              {
                key: "stage",
                label: "Decision",
                render: (r) => <StatusBadge status={r.stage.replace(/_/g, " ")} tone="danger" />,
              },
            ]}
          />
        </div>
      ) : (
        /* Default: Dashboard */
        <div className="space-y-6">
          <WorkflowOverview activeStage="customs_cleared" counts={stageCounts(rows)} />

          <div className="grid lg:grid-cols-3 gap-4">
            <ChartCard title="AI risk distribution" height={230}>
              {risk.length === 0 ? (
                <NoDataCard
                  title="No risk scores yet"
                  reason="AI verification has not scored any submission."
                />
              ) : (
                <DonutChart data={risk} />
              )}
            </ChartCard>
            <ChartCard className="lg:col-span-2" title="Clearances vs holds · 14 days" height={230}>
              {decisions.length === 0 ? (
                <NoDataCard
                  title="No clearance activity"
                  reason="Decisions will be charted once submissions reach customs."
                />
              ) : (
                <BarsChart
                  data={decisions}
                  series={[
                    { key: "cleared", label: "Cleared", color: C.success },
                    { key: "held", label: "Held / rejected", color: C.danger },
                  ]}
                />
              )}
            </ChartCard>
          </div>

          <SubmissionWorkspace
            stages={QUEUE}
            portal="Customs"
            suggestions={[
              "Explain the declared cargo risk",
              "Any manifest mismatch?",
              "Is the DG declaration complete?",
            ]}
            emptyTitle="No pending clearances."
            emptyDescription="Submissions appear here once the Port Authority approves the document package."
            actions={({ submission }) => (
              <StageActions
                submission={submission}
                actions={ACTIONS}
                notesLabel="Clearance / inspection remarks"
                hint="Clearance notifies the Port Authority for final approval; a hold keeps the shipment with customs until inspection is closed."
              />
            )}
          />

          <DataPanel
            title="Clearance History & Inspection Log"
            subtitle="All customs decisions recorded across cargo submissions"
            rows={rows.filter((s) =>
              [
                "customs_cleared",
                "customs_hold",
                "customs_rejected",
                "final_approved",
                "berth_assigned",
              ].includes(s.stage),
            )}
            loading={isLoading}
            emptyTitle="No clearance history yet"
            filterKey="stage"
            filterLabel="All statuses"
            searchKeys={[
              "reference",
              "vessel_name",
              "shipping_company",
              "customs_notes",
              "inspection_notes",
            ]}
            exportName="customs-clearance-history.csv"
            columns={[
              { key: "reference", label: "Reference" },
              { key: "vessel_name", label: "Vessel" },
              { key: "shipping_company", label: "Shipping Line" },
              {
                key: "dangerous_goods",
                label: "Hazardous",
                render: (r: Submission) =>
                  r.dangerous_goods ? (
                    <span className="text-danger font-mono text-[11px]">IMDG</span>
                  ) : (
                    "Standard"
                  ),
              },
              {
                key: "ai_risk_score",
                label: "Risk Score",
                align: "right",
                render: (r: Submission) =>
                  r.ai_risk_score == null ? "—" : `${Math.round(r.ai_risk_score)}/100`,
              },
              {
                key: "customs_notes",
                label: "Customs Remarks",
                render: (r: Submission) => r.customs_notes || r.inspection_notes || "—",
              },
              {
                key: "stage",
                label: "Customs Status",
                render: (r: Submission) => <StatusBadge status={r.stage.replace(/_/g, " ")} />,
              },
            ]}
          />

          <div className="grid lg:grid-cols-3 gap-4">
            <ActivityCard className="lg:col-span-2" title="Clearance activity" />
            <div className="space-y-4">
              <NotificationsCard title="Customs alerts" />
              <CalendarWidget title="Inspection calendar" />
              <HelpCard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
