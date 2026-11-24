import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { StatTile } from "@/components/common/StatTile";
import { SubmissionWorkspace } from "@/components/workflow/SubmissionWorkspace";
import { StageActions, type StageAction } from "@/components/workflow/StageActions";
import { WorkflowOverview } from "@/components/dash/Widgets";
import { useAllSubmissions, useBerths } from "@/hooks/useOps";
import { useAdvanceStage } from "@/hooks/useWorkflow";
import { stageCounts } from "@/lib/ops-metrics";
import type { Stage, Submission } from "@/lib/workflow";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Anchor, ClipboardCheck, FileCheck2, ShieldAlert, Loader2 } from "lucide-react";

export const Route = createFileRoute("/app/approvals")({
  head: () => ({
    meta: [
      { title: "Document Approval — SmartPort AI" },
      {
        name: "description",
        content:
          "Port Authority review of AI-verified vessel and cargo document submissions, clearance sign-off and berth allocation.",
      },
      { property: "og:title", content: "Document Approval — SmartPort AI" },
      {
        property: "og:description",
        content:
          "Review submissions, record decisions and allocate berths in the SmartPort AI workflow.",
      },
    ],
  }),
  component: ApprovalsPage,
});

const QUEUE_STAGES: Stage[] = [
  "uploaded",
  "ai_verification",
  "ai_needs_review",
  "authority_review",
  "modification_requested",
  "customs_cleared",
  "final_approval",
  "final_approved",
];

function actionsFor(stage: Stage): StageAction[] {
  if (
    [
      "uploaded",
      "ai_verification",
      "ai_needs_review",
      "authority_review",
      "modification_requested",
    ].includes(stage)
  ) {
    return [
      {
        label: "Approve",
        stage: "authority_approved",
        action: "Authority approved",
        notesField: "authority_notes",
        tone: "primary",
      },
      {
        label: "Request modification",
        stage: "modification_requested",
        action: "Modification requested",
        notesField: "authority_notes",
        requireNotes: true,
        tone: "warning",
      },
      {
        label: "Reject",
        stage: "authority_rejected",
        action: "Authority rejected",
        notesField: "authority_notes",
        requireNotes: true,
        tone: "danger",
      },
    ];
  }
  if (stage === "customs_cleared" || stage === "final_approval") {
    return [
      {
        label: "Grant final approval",
        stage: "final_approved",
        action: "Final approval granted",
        notesField: "authority_notes",
      },
      {
        label: "Reject",
        stage: "authority_rejected",
        action: "Rejected at final approval",
        notesField: "authority_notes",
        requireNotes: true,
        tone: "danger",
      },
    ];
  }
  return [];
}

function ApprovalsPage() {
  const { data: subs, isLoading } = useAllSubmissions();
  const rows = subs ?? [];
  const queue = rows.filter((s) => QUEUE_STAGES.includes(s.stage));
  const today = (s: Submission) =>
    new Date(s.updated_at).toDateString() === new Date().toDateString();

  return (
    <div>
      <PageHeader
        eyebrow="Port Authority"
        title="Document approval queue."
        subtitle="Every submission arriving from AI verification, with risk scoring, the document set, decision controls and berth allocation."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Awaiting review"
          icon={ClipboardCheck}
          loading={isLoading}
          value={queue.length}
        />
        <StatTile
          label="Approved (today)"
          icon={FileCheck2}
          tone="success"
          loading={isLoading}
          value={
            rows.filter(
              (s) =>
                today(s) &&
                ["authority_approved", "final_approved", "berth_assigned"].includes(s.stage),
            ).length
          }
        />
        <StatTile
          label="Rejected"
          icon={ShieldAlert}
          tone="danger"
          loading={isLoading}
          value={rows.filter((s) => s.stage === "authority_rejected").length}
        />
        <StatTile
          label="Berths allocated"
          icon={Anchor}
          tone="violet"
          loading={isLoading}
          value={rows.filter((s) => !!s.berth_code).length}
        />
      </div>

      <div className="mt-6">
        <WorkflowOverview activeStage="authority_review" counts={stageCounts(rows)} />
      </div>

      <div className="mt-6">
        <SubmissionWorkspace
          stages={QUEUE_STAGES}
          portal="Port Authority"
          suggestions={[
            "Summarise the risk drivers",
            "Are any certificates expired?",
            "Compare with the previous call",
          ]}
          emptyTitle="No pending approvals."
          emptyDescription="Submissions appear here as soon as a shipping line uploads its document package."
          actions={({ submission }) => (
            <StageActions
              submission={submission}
              actions={actionsFor(submission.stage)}
              hint="Approval moves the submission to customs clearance. Every decision is written to the shipment timeline and notifies the next stakeholder."
            />
          )}
          extra={({ submission }) =>
            submission.stage === "final_approved" || submission.berth_code ? (
              <BerthPanel submission={submission} />
            ) : null
          }
        />
      </div>
    </div>
  );
}

function BerthPanel({ submission }: { submission: Submission }) {
  const advance = useAdvanceStage();
  const { data: berths, isLoading, error } = useBerths();
  const [berthCode, setBerthCode] = useState(submission.berth_code ?? "");
  const [start, setStart] = useState(
    submission.arrival_window_start ? submission.arrival_window_start.slice(0, 16) : ""
  );
  const [end, setEnd] = useState(
    submission.arrival_window_end ? submission.arrival_window_end.slice(0, 16) : ""
  );

  // Search & Combobox popup state (Requirement 5)
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const berthList = berths ?? [];

  useEffect(() => {
    if (berthList.length > 0 && !berthCode) {
      setBerthCode(berthList[0].code);
    }
  }, [berthList, berthCode]);

  const selectedBerth = berthList.find((b) => b.code === berthCode);

  const filteredBerths = berthList.filter(
    (b) =>
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      b.terminal_name.toLowerCase().includes(search.toLowerCase())
  );

  async function allocate() {
    if (!berthCode.trim()) {
      toast.error("Berth selection is required");
      return;
    }
    if (start && end && new Date(end) <= new Date(start)) {
      toast.error("Arrival window end must be after the start");
      return;
    }
    try {
      await advance.mutateAsync({
        submissionId: submission.id,
        stage: "berth_assigned",
        action: "Berth allocated",
        notes: `Berth ${berthCode.trim()}`,
        patch: {
          berth_code: berthCode.trim(),
          arrival_window_start: start ? new Date(start).toISOString() : null,
          arrival_window_end: end ? new Date(end).toISOString() : null,
        },
      });
      toast.success(`Berth ${berthCode.trim()} allocated — terminal operator notified!`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Allocation failed");
    }
  }

  return (
    <GlassCard>
      <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-4 flex items-center justify-between">
        <span>Berth allocation &amp; arrival slot</span>
        {submission.berth_code && (
          <span className="px-2 py-0.5 rounded bg-success/10 text-success border border-success/20 text-[10px] font-mono font-semibold">
            Assigned: {submission.berth_code}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="text-xs text-muted-foreground font-mono py-4 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-cyan" />
          Loading PSA berths...
        </div>
      ) : error ? (
        <div className="text-xs text-danger font-mono py-4">
          Unable to load PSA berths: {error instanceof Error ? error.message : String(error)}
        </div>
      ) : berthList.length === 0 ? (
        <div className="text-xs text-warning font-mono py-4">
          No active PSA berths are available. Check berth master data and permissions.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          {/* SEARCHABLE BERTH COMBOBOX (Requirement 5) */}
          <div className="relative">
            <span className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground font-mono block mb-1.5">
              Select PSA Berth *
            </span>
            <div
              onClick={() => setIsOpen(!isOpen)}
              className="w-full h-9 rounded-md bg-white/[0.03] border border-border px-2.5 text-[12.5px] flex items-center justify-between cursor-pointer hover:border-cyan/60 transition"
            >
              <span className="truncate text-foreground font-mono font-medium">
                {selectedBerth
                  ? `${selectedBerth.code} — ${selectedBerth.terminal_name}`
                  : "Search PSA berth e.g. PPT-B04..."}
              </span>
              <span className="text-[10px] text-muted-foreground ml-1">▼</span>
            </div>

            {/* COMBOBOX POPUP DROPDOWN */}
            {isOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-60 overflow-y-auto rounded-md bg-popover border border-border shadow-2xl p-2 space-y-1">
                <input
                  type="text"
                  placeholder="Filter berths (e.g. PPT-B04)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  className="w-full h-8 px-2.5 rounded bg-white/[0.05] border border-border text-xs focus:outline-none focus:border-cyan font-mono"
                />

                <div className="pt-1 max-h-44 overflow-y-auto space-y-0.5 scrollbar-thin">
                  {filteredBerths.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground italic font-mono">
                      No matching berths found
                    </div>
                  ) : (
                    filteredBerths.map((b) => (
                      <div
                        key={b.code}
                        onClick={() => {
                          setBerthCode(b.code);
                          setIsOpen(false);
                          setSearch("");
                        }}
                        className={`p-2 rounded cursor-pointer text-xs font-mono flex items-center justify-between transition-colors ${
                          berthCode === b.code
                            ? "bg-cyan/15 text-cyan font-semibold border border-cyan/30"
                            : "hover:bg-white/[0.05] text-foreground/90"
                        }`}
                      >
                        <div>
                          <span className="font-semibold text-foreground">{b.code}</span>
                          <span className="text-muted-foreground font-sans ml-1.5 text-[11px]">
                            — {b.terminal_name}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono ${
                            b.status === "available"
                              ? "bg-success/10 text-success border border-success/20"
                              : b.status === "occupied"
                                ? "bg-warning/10 text-warning border border-warning/20"
                                : "bg-danger/10 text-danger border border-danger/20"
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Slot Start */}
          <label className="block">
            <span className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground font-mono">
              Slot start
            </span>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="mt-1.5 w-full h-9 rounded-md bg-white/[0.03] border border-border px-2.5 text-[12.5px] outline-none focus:border-cyan/60 font-mono"
            />
          </label>

          {/* Slot End */}
          <label className="block">
            <span className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground font-mono">
              Slot end
            </span>
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="mt-1.5 w-full h-9 rounded-md bg-white/[0.03] border border-border px-2.5 text-[12.5px] outline-none focus:border-cyan/60 font-mono"
            />
          </label>

          {/* Allocate Button */}
          <button
            onClick={allocate}
            disabled={advance.isPending}
            className="h-9 px-4 rounded-md bg-gradient-to-r from-cyan to-violet text-background text-[12.5px] font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 hover:opacity-90 transition shadow-md"
          >
            {advance.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Allocate berth
          </button>
        </div>
      )}

      <p className="mt-3 text-[11.5px] text-muted-foreground">
        Allocating a berth updates submission stage to{" "}
        <code className="text-cyan font-mono text-[11px]">berth_assigned</code>, records a timeline audit event, and notifies the terminal operator.
      </p>
    </GlassCard>
  );
}
