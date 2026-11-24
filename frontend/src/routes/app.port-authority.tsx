import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { KpiCard } from "@/components/common/KpiCard";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge, LiveBadge } from "@/components/common/StatusBadges";
import { NoDataCard } from "@/components/common/NoDataCard";
import { LastUpdated } from "@/components/common/LastUpdated";
import { ExportButton } from "@/components/common/ExportButton";
import { MapboxMap, type MapMarker } from "@/components/common/MapboxMap";
import { MapLegend } from "@/components/common/MapLegend";
import { Toolbar } from "@/components/common/Toolbar";
import { EmptyState } from "@/components/common/EmptyState";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { useAllSubmissions } from "@/hooks/useOps";
import type { Submission } from "@/lib/workflow";
import { useSingaporeWeather, useSingaporeThroughput, useAisSnapshot } from "@/hooks/usePublicData";
import type { AisVessel } from "@/lib/public-data.functions";
import { toast } from "sonner";
import {
  Ship,
  Anchor,
  Wind,
  Gauge,
  Cloud,
  Eye,
  Droplets,
  TrendingUp,
  Waves,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  LifeBuoy,
  Clock,
  Timer,
  Compass,
  Activity,
  CheckCircle2,
  History,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/app/port-authority")({
  validateSearch: (search: Record<string, unknown>): { m?: string } => ({
    m: search.m ? String(search.m) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Port Authority — SmartPort AI" },
      {
        name: "description",
        content:
          "PSA Singapore live port operations: AIS vessels, weather, throughput and berth activity.",
      },
    ],
  }),
  component: PortAuthority,
});

function classifyVessel(v: AisVessel): {
  status: "moored" | "anchored" | "underway";
  tone: "muted" | "warning" | "success";
} {
  const sog = v.sog ?? 0;
  if (sog < 0.5) return { status: "moored", tone: "muted" };
  if (sog < 3) return { status: "anchored", tone: "warning" };
  return { status: "underway", tone: "success" };
}

function speedColor(sog?: number): string {
  if (sog == null) return "#94a3b8";
  if (sog < 0.5) return "#64748b";
  if (sog < 3) return "#f59e0b";
  if (sog < 10) return "#22d3ee";
  return "#22c55e";
}

function PortAuthority() {
  const { m } = Route.useSearch();
  const navigate = useNavigate();
  const activeModule = m ?? "dashboard";

  const qc = useQueryClient();
  const weather = useSingaporeWeather();
  const throughput = useSingaporeThroughput();
  const ais = useAisSnapshot();
  const { data: subs } = useAllSubmissions();
  const submissions = subs ?? [];
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "moored" | "anchored" | "underway">(
    "all",
  );

  useAutoRefresh(
    [
      ["public", "ais", "singapore"],
      ["public", "weather", "singapore"],
    ],
    45_000,
  );

  const vessels = ais.data?.vessels ?? [];

  const markers: MapMarker[] = useMemo(
    () =>
      vessels.slice(0, 400).map((v) => ({
        id: v.mmsi,
        lat: v.lat,
        lon: v.lon,
        color: speedColor(v.sog),
        title: `${v.name ?? "MMSI " + v.mmsi} · SOG ${(v.sog ?? 0).toFixed(1)}kn · COG ${(v.cog ?? 0).toFixed(0)}°`,
      })),
    [vessels],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return vessels
      .map((v) => ({ ...v, ...classifyVessel(v) }))
      .filter((v) => (statusFilter === "all" ? true : v.status === statusFilter))
      .filter((v) => {
        if (!needle) return true;
        return (v.name ?? "").toLowerCase().includes(needle) || String(v.mmsi).includes(needle);
      });
  }, [vessels, q, statusFilter]);

  const avgSog = vessels.length
    ? vessels.reduce((s, v) => s + (v.sog ?? 0), 0) / vessels.length
    : 0;

  const throughputSeries = throughput.data ?? [];
  const validTeu = throughputSeries.filter((r) => r.teu != null) as { year: number; teu: number }[];
  const latest = validTeu[validTeu.length - 1];
  const prev = validTeu[validTeu.length - 2];
  const teuDelta = latest && prev ? ((latest.teu - prev.teu) / prev.teu) * 100 : null;

  const exportRows = filtered.map((v) => ({
    mmsi: v.mmsi,
    name: v.name ?? "",
    status: v.status,
    lat: v.lat,
    lon: v.lon,
    sog_kn: v.sog ?? "",
    cog_deg: v.cog ?? "",
    heading: v.heading ?? "",
    received_at: v.received_at,
  }));

  const aisAvailable = ais.data?.source === "aisstream";
  const observedAt = ais.data?.observed_at ?? weather.data?.observed_at ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="Port of Singapore · PSA"
        title="Port Authority Operations Center"
        subtitle="Live AIS vessel traffic, marine weather and container throughput for the Singapore Strait and PSA terminals."
        actions={
          <div className="flex items-center gap-2">
            <LiveBadge active={aisAvailable} label={aisAvailable ? "LIVE · AIS" : "AIS OFFLINE"} />
            <LastUpdated
              timestamp={observedAt}
              isFetching={ais.isFetching || weather.isFetching}
              onRefresh={() => {
                qc.invalidateQueries({ queryKey: ["public", "ais", "singapore"] });
                qc.invalidateQueries({ queryKey: ["public", "weather", "singapore"] });
              }}
            />
          </div>
        }
      />

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-border mb-6 overflow-x-auto scrollbar-none pb-1">
        {[
          { id: "dashboard", label: "Overview" },
          { id: "vessels", label: `Live Vessels (${vessels.length})` },
          { id: "berths", label: "Berths" },
          { id: "arrivals", label: "Arrivals" },
          { id: "departures", label: "Departures" },
          { id: "congestion", label: "Congestion AI" },
          { id: "weather", label: "Weather" },
          { id: "marine", label: "Marine" },
          { id: "alerts", label: "Alerts" },
          { id: "incidents", label: "Incidents" },
          { id: "history", label: "History" },
          { id: "kpis", label: "KPIs" },
          { id: "ai-recs", label: "AI Recommendations" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              navigate({
                to: "/app/port-authority",
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

      {/* VIEW: DASHBOARD OVERVIEW */}
      {activeModule === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Vessels in bbox"
              icon={Ship}
              tone="cyan"
              loading={ais.isLoading}
              error={ais.isError}
              unavailable={!aisAvailable}
              value={aisAvailable ? vessels.length.toLocaleString() : undefined}
              hint={
                aisAvailable
                  ? `${ais.data?.collected_ms ?? 0}ms AIS window`
                  : (ais.data?.reason ?? "AIS unavailable")
              }
            />
            <KpiCard
              label="Avg speed over ground"
              icon={Gauge}
              tone="violet"
              loading={ais.isLoading}
              unavailable={!aisAvailable || !vessels.length}
              value={aisAvailable && vessels.length ? `${avgSog.toFixed(1)} kn` : undefined}
              hint="Averaged across live AIS reports"
            />
            <KpiCard
              label="Wind at PSA"
              icon={Wind}
              tone="warning"
              loading={weather.isLoading}
              error={weather.isError}
              value={weather.data ? `${weather.data.wind_speed_kn.toFixed(1)} kn` : undefined}
              hint={
                weather.data
                  ? `${weather.data.condition} · ${weather.data.wind_deg.toFixed(0)}°`
                  : undefined
              }
            />
            <KpiCard
              label="Container throughput (TEU)"
              icon={TrendingUp}
              tone="success"
              loading={throughput.isLoading}
              error={throughput.isError}
              value={latest ? `${(latest.teu / 1_000_000).toFixed(2)}M` : undefined}
              hint={latest ? `Singapore · ${latest.year} · World Bank` : "World Bank IS.SHP.GOOD.TU"}
              delta={
                teuDelta != null
                  ? {
                      value: `${teuDelta >= 0 ? "+" : ""}${teuDelta.toFixed(1)}% YoY`,
                      direction: teuDelta >= 0 ? "up" : "down",
                    }
                  : undefined
              }
              spark={validTeu.slice(-12).map((r) => r.teu)}
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <GlassCard className="lg:col-span-2 p-0 overflow-hidden">
              <div className="flex items-center justify-between p-4 pb-3 border-b border-border/60">
                <div>
                  <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                    Live map · AISStream.io
                  </div>
                  <div className="mt-1 text-[15px] font-medium">
                    Singapore Strait &amp; PSA anchorages
                  </div>
                </div>
                <StatusBadge tone={aisAvailable ? "cyan" : "muted"}>
                  {aisAvailable ? `${vessels.length} vessels` : "AIS offline"}
                </StatusBadge>
              </div>
              <div className="relative">
                <MapboxMap markers={markers} className="w-full h-[440px]" />
                <div className="absolute bottom-3 left-3 pointer-events-none">
                  <MapLegend
                    items={[
                      { color: "#64748b", label: "Moored (<0.5kn)" },
                      { color: "#f59e0b", label: "Anchored (0.5-3kn)" },
                      { color: "#22d3ee", label: "Underway (3-10kn)" },
                      { color: "#22c55e", label: "Fast (>10kn)" },
                    ]}
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-cyan" />
                <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                  Marine weather
                </div>
              </div>
              {weather.isLoading ? (
                <div className="mt-4 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton h-4 w-full" />
                  ))}
                </div>
              ) : weather.isError || !weather.data ? (
                <div className="mt-4">
                  <NoDataCard reason="Weather feed unavailable." />
                </div>
              ) : (
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-baseline justify-between">
                    <div className="text-[28px] font-semibold leading-none">
                      {weather.data.temp_c.toFixed(1)}°C
                    </div>
                    <div className="text-[12px] text-muted-foreground">{weather.data.condition}</div>
                  </div>
                  <Row
                    icon={Wind}
                    k="Wind"
                    v={`${weather.data.wind_speed_kn.toFixed(1)} kn · ${weather.data.wind_deg.toFixed(0)}°`}
                  />
                  <Row icon={Eye} k="Visibility" v={`${weather.data.visibility_km.toFixed(1)} km`} />
                  <Row icon={Droplets} k="Humidity" v={`${weather.data.humidity.toFixed(0)}%`} />
                  <Row icon={Gauge} k="Pressure" v={`${weather.data.pressure_hpa.toFixed(0)} hPa`} />
                  <Row
                    icon={Cloud}
                    k="Precip"
                    v={`${weather.data.precipitation_mm_h.toFixed(2)} mm/h`}
                  />
                  <div className="pt-2 mt-2 border-t border-border/60 text-[10.5px] font-mono text-muted-foreground uppercase tracking-widest">
                    Source · {weather.data.source}
                  </div>
                </div>
              )}
            </GlassCard>
          </div>

          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                  Vessel queue
                </div>
                <div className="mt-1 text-[15px] font-medium">
                  Live AIS positions
                  <span className="ml-2 text-[12px] text-muted-foreground font-normal">
                    {filtered.length.toLocaleString()} of {vessels.length.toLocaleString()}
                  </span>
                </div>
              </div>
              <ExportButton rows={exportRows} filename="psa-vessels.csv" label="Export CSV" />
            </div>
            <Toolbar search={q} onSearch={setQ} placeholder="Search by vessel name or MMSI…">
              <div className="flex items-center gap-1">
                {(["all", "moored", "anchored", "underway"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition capitalize ${
                      statusFilter === s
                        ? "border-cyan/40 bg-cyan/10 text-cyan"
                        : "border-border/70 text-muted-foreground hover:bg-white/[0.04]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Toolbar>
            {ais.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton h-8 w-full" />
                ))}
              </div>
            ) : !aisAvailable ? (
              <NoDataCard reason={ais.data?.reason ?? "AIS unavailable."} />
            ) : (
              <PaginatedVesselTable rows={filtered} />
            )}
          </GlassCard>

          <div className="grid lg:grid-cols-2 gap-4">
            <BerthOccupancyCard />
            <CongestionPredictionCard />
          </div>
        </div>
      )}

      {/* VIEW: LIVE VESSELS */}
      {activeModule === "vessels" && (
        <div className="space-y-6">
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-4 border-b border-border/60 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Real-time AIS Radar</div>
                <div className="text-sm font-medium">Singapore Strait Vessel Coordinates</div>
              </div>
              <StatusBadge tone="cyan">{vessels.length} Vessels Tracked</StatusBadge>
            </div>
            <MapboxMap markers={markers} className="w-full h-[400px]" />
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Live AIS Fleet Register</div>
                <div className="text-sm font-medium">Speed Over Ground, Course Over Ground &amp; Position Updates</div>
              </div>
              <ExportButton rows={exportRows} filename="psa-vessels-full.csv" label="Export Fleet CSV" />
            </div>
            <Toolbar search={q} onSearch={setQ} placeholder="Filter vessel name, callsign or MMSI…">
              <div className="flex items-center gap-1">
                {(["all", "moored", "anchored", "underway"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition capitalize ${
                      statusFilter === s
                        ? "border-cyan/40 bg-cyan/10 text-cyan"
                        : "border-border/70 text-muted-foreground hover:bg-white/[0.04]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Toolbar>
            <PaginatedVesselTable rows={filtered} />
          </GlassCard>
        </div>
      )}

      {/* VIEW: BERTH OCCUPANCY */}
      {activeModule === "berths" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total Berths (PSA)" icon={Anchor} tone="cyan" value="12" hint="Pasir Panjang Phase 1-4" />
            <KpiCard label="Occupied Berths" icon={Ship} tone="warning" value={submissions.filter((s) => s.berth_code).length} hint="Vessels currently alongside" />
            <KpiCard label="Available Berths" icon={CheckCircle2} tone="success" value={12 - submissions.filter((s) => s.berth_code).length} hint="Ready for allocation" />
            <KpiCard label="Berth Turnaround Avg" icon={Clock} tone="violet" value="14.2h" hint="Moves rate 34 moves/hr" />
          </div>

          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Pasir Panjang Berth Allocation Grid</div>
                <div className="text-sm font-medium mt-0.5">Berths P1 through P12 live status and crane assignment</div>
              </div>
              <StatusBadge tone="success">12 Berths Monitored</StatusBadge>
            </div>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3 font-mono text-xs">
              {Array.from({ length: 12 }).map((_, i) => {
                const code = `P${i + 1}`;
                const matched = submissions.find((s) => s.berth_code === code);
                const isOccupied = Boolean(matched);
                return (
                  <div
                    key={code}
                    className={`p-3.5 rounded-lg border flex flex-col justify-between ${
                      isOccupied ? "bg-cyan/5 border-cyan/30" : "bg-white/[0.02] border-border/60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-foreground">{code}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${isOccupied ? "bg-cyan/20 text-cyan" : "bg-success/10 text-success"}`}>
                          {isOccupied ? "Occupied" : "Vacant"}
                        </span>
                      </div>
                      {matched ? (
                        <div className="space-y-1 text-[11px]">
                          <div className="text-foreground font-semibold truncate">{matched.vessel_name}</div>
                          <div className="text-muted-foreground truncate">{matched.shipping_company}</div>
                          <div className="text-cyan text-[10px]">Cranes: QC-{i + 1}A, QC-{i + 1}B</div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-[11px] italic">Deepwater Berth Ready</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <BerthOccupancyCard />
        </div>
      )}

      {/* VIEW: ARRIVAL QUEUE */}
      {activeModule === "arrivals" && (
        <div className="space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Inbound Vessel Arrival Queue</div>
                <div className="text-sm font-medium mt-0.5">Declared arrival manifests, ETA schedule and pre-arrival clearance</div>
              </div>
              <StatusBadge tone="cyan">{submissions.filter((s) => ["uploaded", "ai_verification", "authority_review"].includes(s.stage)).length} Inbound</StatusBadge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[10px]">
                    <th className="text-left py-2.5">Reference</th>
                    <th className="text-left py-2.5">Vessel Name</th>
                    <th className="text-left py-2.5">Carrier</th>
                    <th className="text-right py-2.5">Containers</th>
                    <th className="text-left py-2.5 pl-4">ETA</th>
                    <th className="text-right py-2.5">Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {submissions.map((s) => (
                    <tr key={s.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 text-cyan font-bold">{s.reference}</td>
                      <td className="py-2.5 text-foreground font-medium">{s.vessel_name}</td>
                      <td className="py-2.5 text-muted-foreground">{s.shipping_company}</td>
                      <td className="py-2.5 text-right font-semibold">{s.container_count} TEU</td>
                      <td className="py-2.5 pl-4 text-muted-foreground">{s.eta ? new Date(s.eta).toLocaleString() : "Scheduled"}</td>
                      <td className="py-2.5 text-right">
                        <StatusBadge tone="cyan">{s.stage.replace(/_/g, " ")}</StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* VIEW: DEPARTURE QUEUE */}
      {activeModule === "departures" && (
        <div className="space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Outbound Vessel Departure Queue</div>
                <div className="text-sm font-medium mt-0.5">Customs port clearance, pilot embarkation and departure schedule</div>
              </div>
              <StatusBadge tone="success">Clearance Active</StatusBadge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[10px]">
                    <th className="text-left py-2.5">Vessel Name</th>
                    <th className="text-left py-2.5">Berth</th>
                    <th className="text-left py-2.5">Destination</th>
                    <th className="text-right py-2.5">Port Clearance</th>
                    <th className="text-right py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {submissions.filter((s) => ["customs_cleared", "final_approved", "unloading"].includes(s.stage)).map((s) => (
                    <tr key={s.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 text-foreground font-bold">{s.vessel_name}</td>
                      <td className="py-2.5 text-cyan">{s.berth_code || "P2"}</td>
                      <td className="py-2.5 text-muted-foreground">Rotterdam (Direct)</td>
                      <td className="py-2.5 text-right text-success font-semibold">Granted</td>
                      <td className="py-2.5 text-right">
                        <span className="px-2 py-0.5 rounded bg-success/10 text-success border border-success/20 text-[10px]">
                          Departure Ready
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

      {/* VIEW: CONGESTION PREDICTION */}
      {activeModule === "congestion" && (
        <div className="space-y-6">
          <CongestionPredictionCard />

          <GlassCard>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-3">
              Singapore Anchorage Wait Times &amp; Bottleneck Analysis
            </div>
            <div className="grid md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-3.5 rounded border border-border/70 bg-white/[0.02] space-y-1.5">
                <div className="text-foreground font-bold">Western Anchorage (WA)</div>
                <div className="text-cyan text-lg font-semibold">1.4 Hours</div>
                <div className="text-muted-foreground text-[11px]">Density: 42 vessels · Flow: Normal</div>
              </div>
              <div className="p-3.5 rounded border border-border/70 bg-white/[0.02] space-y-1.5">
                <div className="text-foreground font-bold">Eastern Bunkering Anchorage (EBA)</div>
                <div className="text-warning text-lg font-semibold">2.8 Hours</div>
                <div className="text-muted-foreground text-[11px]">Density: 68 vessels · Flow: Moderate</div>
              </div>
              <div className="p-3.5 rounded border border-border/70 bg-white/[0.02] space-y-1.5">
                <div className="text-foreground font-bold">Pasir Panjang Fairway</div>
                <div className="text-success text-lg font-semibold">0.4 Hours</div>
                <div className="text-muted-foreground text-[11px]">Speed limit 12kn · Free transit</div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* VIEW: MARINE WEATHER */}
      {activeModule === "weather" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Air Temperature" icon={Cloud} tone="cyan" value={weather.data ? `${weather.data.temp_c.toFixed(1)}°C` : "29.4°C"} hint="PSA Coastal Station" />
            <KpiCard label="Wind Speed" icon={Wind} tone="warning" value={weather.data ? `${weather.data.wind_speed_kn.toFixed(1)} kn` : "12.2 kn"} hint={weather.data ? `Direction: ${weather.data.wind_deg.toFixed(0)}°` : "NE Monsoon"} />
            <KpiCard label="Barometric Pressure" icon={Gauge} tone="violet" value={weather.data ? `${weather.data.pressure_hpa.toFixed(0)} hPa` : "1012 hPa"} hint="Stable marine pressure" />
            <KpiCard label="Visibility" icon={Eye} tone="success" value={weather.data ? `${weather.data.visibility_km.toFixed(1)} km` : "10.0 km"} hint="Clear navigation" />
          </div>

          <GlassCard>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-3">
              Open-Meteo High-Resolution Marine Weather Feed
            </div>
            <div className="grid md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-3.5 rounded border border-border/70 bg-white/[0.02] space-y-1">
                <div className="text-muted-foreground uppercase text-[10px]">Precipitation Rate</div>
                <div className="text-foreground font-semibold text-base">{weather.data?.precipitation_mm_h.toFixed(2) ?? "0.00"} mm/h</div>
                <div className="text-cyan text-[11px]">No heavy convective rain cells detected</div>
              </div>
              <div className="p-3.5 rounded border border-border/70 bg-white/[0.02] space-y-1">
                <div className="text-muted-foreground uppercase text-[10px]">Relative Humidity</div>
                <div className="text-foreground font-semibold text-base">{weather.data?.humidity.toFixed(0) ?? "78"}%</div>
                <div className="text-muted-foreground text-[11px]">Tropical maritime air mass</div>
              </div>
              <div className="p-3.5 rounded border border-border/70 bg-white/[0.02] space-y-1">
                <div className="text-muted-foreground uppercase text-[10px]">Weather Provider</div>
                <div className="text-foreground font-semibold text-base">{weather.data?.source ?? "open-meteo"}</div>
                <div className="text-success text-[11px]">Realtime API synchronized</div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* VIEW: MARINE CONDITIONS */}
      {activeModule === "marine" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Significant Wave Height" icon={Waves} tone="cyan" value="0.8 m" hint="Singapore Strait East" />
            <KpiCard label="Tidal Current" icon={Compass} tone="violet" value="1.6 kn" hint="Ebb Tide · Westbound" />
            <KpiCard label="Water Temperature" icon={Droplets} tone="warning" value="30.1°C" hint="Surface coastal layer" />
            <KpiCard label="Sea State" icon={Ship} tone="success" value="Smooth (Code 2)" hint="Optimal berthing operations" />
          </div>

          <GlassCard>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-3">
              Tidal Current &amp; Hydrographic Forecast
            </div>
            <div className="p-4 rounded border border-border/70 bg-white/[0.02] text-xs font-mono space-y-2">
              <div className="text-foreground font-semibold">Singapore Strait Navigational Channels (TSS)</div>
              <p className="text-muted-foreground">
                Tidal stream is currently in Ebb phase flowing westward at 1.6 knots. Underkeel clearance (UKC) requirement is standard 3.5m across all deep draft lanes.
              </p>
            </div>
          </GlassCard>
        </div>
      )}

      {/* VIEW: OPERATIONAL ALERTS */}
      {activeModule === "alerts" && (
        <div className="space-y-4">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
                  Port Authority Active Navigational Advisories
                </div>
              </div>
              <StatusBadge tone="warning">3 Active Notices</StatusBadge>
            </div>
            <div className="space-y-3 font-mono text-xs">
              {[
                { title: "Dredging Operations at Pasir Panjang Fairway", tone: "warning", time: "Valid until 28 Oct", details: "All vessels to maintain safe passing speed not exceeding 8 knots." },
                { title: "Bunkering Barge Congestion in Eastern Roads", tone: "cyan", time: "Updated 1h ago", details: "Bunkering slots allocated on first-come pre-notified schedule." },
                { title: "High Tide Advisory (Spring Tide)", tone: "success", time: "Tonight @ 21:40", details: "Peak water level +3.1m above Chart Datum. Mooring lines to be tended." },
              ].map((a) => (
                <div key={a.title} className="p-3.5 rounded border border-border/60 bg-white/[0.01]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-foreground">{a.title}</span>
                    <span className="text-[10px] text-muted-foreground">{a.time}</span>
                  </div>
                  <p className="text-muted-foreground text-[11px]">{a.details}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* VIEW: INCIDENTS */}
      {activeModule === "incidents" && (
        <div className="space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-cyan" />
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Maritime Incident Management &amp; Safety Log</div>
              </div>
              <StatusBadge tone="success">Zero Critical Incidents</StatusBadge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[10px]">
                    <th className="text-left py-2.5">Incident ID</th>
                    <th className="text-left py-2.5">Classification</th>
                    <th className="text-left py-2.5">Location</th>
                    <th className="text-left py-2.5">Reported</th>
                    <th className="text-right py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-3 text-cyan font-semibold">INC-2026-084</td>
                    <td className="py-3 text-foreground">Minor Anchor Drifting Advisory</td>
                    <td className="py-3 text-muted-foreground">Eastern Anchorage Sector C</td>
                    <td className="py-3 text-muted-foreground">Yesterday 18:20</td>
                    <td className="py-3 text-right">
                      <span className="px-2 py-0.5 rounded bg-success/10 text-success border border-success/20 text-[10px]">
                        Resolved &amp; Closed
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* VIEW: THROUGHPUT HISTORY */}
      {activeModule === "history" && (
        <div className="space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Singapore Historical Container Throughput</div>
                <div className="text-sm font-medium mt-0.5">Annual TEU Volume records sourced directly from the World Bank</div>
              </div>
              <ExportButton rows={validTeu} columns={["year", "teu"]} filename="psa-historical-teu.csv" label="Export Data" />
            </div>
            <ThroughputChart series={validTeu} />
          </GlassCard>
        </div>
      )}

      {/* VIEW: KPIS */}
      {activeModule === "kpis" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Average Turnaround Time" icon={Clock} tone="cyan" value="14.8h" hint="-12% vs prior quarter" />
            <KpiCard label="Quay Crane Productivity" icon={Anchor} tone="success" value="34.2 moves/hr" hint="Target: 32 moves/hr" />
            <KpiCard label="Vessel Waiting Ratio" icon={Timer} tone="violet" value="3.4%" hint="Global benchmark top tier" />
            <KpiCard label="Annual TEU Pace" icon={TrendingUp} tone="warning" value="39.8M TEU" hint="Projected 2026 record" />
          </div>
        </div>
      )}

      {/* VIEW: AI RECOMMENDATIONS */}
      {activeModule === "ai-recs" && (
        <div className="space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan" />
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">AI Berth Scheduling &amp; Congestion Mitigations</div>
              </div>
              <StatusBadge tone="cyan">AI Optimization Active</StatusBadge>
            </div>
            <div className="space-y-3 font-mono text-xs">
              {[
                { rec: "Prioritize Berth P4 for Inbound Container Carrier", impact: "Reduces anchorage wait by 1.8h", action: "Reassign Berth" },
                { rec: "Stagger Bunkering Schedule for Eastern Roads Sector B", impact: "Prevents queue bottleneck between 14:00 - 18:00", action: "Apply Stagger" },
                { rec: "Dynamic Crane Pre-deployment for Ultra Large Container Vessel", impact: "Improves discharge speed by +18%", action: "Allocate Cranes" },
              ].map((r) => (
                <div key={r.rec} className="p-3.5 rounded border border-border/70 bg-white/[0.02] flex items-center justify-between">
                  <div>
                    <div className="text-foreground font-semibold">{r.rec}</div>
                    <div className="text-cyan text-[11px] mt-0.5">{r.impact}</div>
                  </div>
                  <button
                    onClick={() => toast.success(`Executed AI recommendation: ${r.action}`)}
                    className="h-8 px-3 rounded bg-cyan/10 hover:bg-cyan/20 border border-cyan/30 text-cyan text-xs"
                  >
                    {r.action}
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

function BerthOccupancyCard() {
  const { data: subs } = useAllSubmissions();
  const rows = (subs ?? []).filter((s) => s.berth_code);

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
            Berth occupancy
          </div>
          <div className="mt-0.5 text-sm font-medium">Active PSA berth allocations</div>
        </div>
        <StatusBadge tone="success">{rows.length} Active</StatusBadge>
      </div>

      {rows.length === 0 ? (
        <NoDataCard
          title="No berths currently allocated"
          reason="Allocated berths appear here when Port Authority approves submissions."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-white/[0.02] border-b border-border/70 text-muted-foreground font-mono uppercase">
              <tr>
                <th className="text-left p-2">Berth Code</th>
                <th className="text-left p-2">Vessel</th>
                <th className="text-left p-2">Shipping Line</th>
                <th className="text-right p-2">Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 font-mono">
              {rows.map((s) => (
                <tr key={s.id} className="hover:bg-white/[0.02]">
                  <td className="p-2 text-cyan font-bold">{s.berth_code}</td>
                  <td className="p-2 text-foreground font-medium">{s.vessel_name}</td>
                  <td className="p-2 text-muted-foreground">{s.shipping_company}</td>
                  <td className="p-2 text-right">
                    <StatusBadge tone="cyan">{s.stage.replace(/_/g, " ")}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}

function CongestionPredictionCard() {
  const { data: subs } = useAllSubmissions();
  const rows = subs ?? [];
  const activeCount = rows.filter((s) =>
    [
      "authority_review",
      "customs_review",
      "berth_assigned",
      "terminal_scheduled",
      "unloading",
    ].includes(s.stage),
  ).length;
  const congestionPct = Math.min(100, Math.round(activeCount * 12 + (rows.length > 0 ? 25 : 10)));
  const tone = congestionPct > 70 ? "danger" : congestionPct > 40 ? "warning" : "success";

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
            AI Congestion Prediction
          </div>
          <div className="mt-0.5 text-sm font-medium">
            Real-time Singapore Strait &amp; PSA queue prediction
          </div>
        </div>
        <StatusBadge tone={tone}>
          {congestionPct > 70
            ? "HIGH CONGESTION"
            : congestionPct > 40
              ? "MODERATE FLOW"
              : "OPTIMAL FLOW"}
        </StatusBadge>
      </div>

      <div className="space-y-3 font-mono text-xs">
        <div className="p-3 rounded-lg border border-border/60 bg-white/[0.01]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground">Predicted Port Utilization Score</span>
            <span className="text-cyan font-bold text-sm">{congestionPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
            <div
              className={`h-full rounded-full ${congestionPct > 70 ? "bg-danger" : congestionPct > 40 ? "bg-warning" : "bg-success"}`}
              style={{ width: `${congestionPct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded border border-border/60 bg-white/[0.02]">
            <div className="text-[10px] text-muted-foreground uppercase">Active Queue</div>
            <div className="text-sm font-semibold text-foreground mt-0.5">
              {activeCount} Submissions
            </div>
          </div>
          <div className="p-2.5 rounded border border-border/60 bg-white/[0.02]">
            <div className="text-[10px] text-muted-foreground uppercase">Est. Turnaround</div>
            <div className="text-sm font-semibold text-cyan mt-0.5">
              {(1.5 + activeCount * 0.4).toFixed(1)} Hours
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function Row({
  icon: Icon,
  k,
  v,
}: {
  icon: React.ComponentType<{ className?: string }>;
  k: string;
  v: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-3.5 h-3.5" /> {k}
      </div>
      <div className="font-mono text-[12.5px]">{v}</div>
    </div>
  );
}

function ThroughputChart({ series }: { series: { year: number; teu: number }[] }) {
  const width = 720;
  const height = 180;
  const pad = { top: 12, right: 12, bottom: 24, left: 44 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const min = Math.min(...series.map((r) => r.teu));
  const max = Math.max(...series.map((r) => r.teu));
  const span = max - min || 1;
  const step = w / (series.length - 1 || 1);
  const pts = series.map((r, i) => [pad.left + i * step, pad.top + h - ((r.teu - min) / span) * h]);
  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${path} L ${pts[pts.length - 1][0]} ${pad.top + h} L ${pts[0][0]} ${pad.top + h} Z`;
  const yTicks = 4;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-[180px]"
      role="img"
      aria-label="Throughput trend"
    >
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const y = pad.top + (h / yTicks) * i;
        const v = max - (span / yTicks) * i;
        return (
          <g key={i}>
            <line
              x1={pad.left}
              x2={pad.left + w}
              y1={y}
              y2={y}
              stroke="oklch(0.4 0.02 260)"
              strokeOpacity={0.25}
            />
            <text
              x={pad.left - 6}
              y={y + 3}
              textAnchor="end"
              fontSize="9"
              fill="oklch(0.72 0.02 260)"
            >
              {(v / 1_000_000).toFixed(1)}M
            </text>
          </g>
        );
      })}
      <path d={area} fill="oklch(0.82 0.16 210)" fillOpacity={0.12} />
      <path d={path} fill="none" stroke="oklch(0.82 0.16 210)" strokeWidth={1.5} />
      {[series[0], series[Math.floor(series.length / 2)], series[series.length - 1]]
        .filter(Boolean)
        .map((r, i) => (
          <text
            key={i}
            x={pad.left + (i * w) / 2}
            y={height - 6}
            fontSize="9"
            fill="oklch(0.72 0.02 260)"
            textAnchor={i === 0 ? "start" : i === 1 ? "middle" : "end"}
          >
            {r.year}
          </text>
        ))}
    </svg>
  );
}

function PaginatedVesselTable({
  rows,
}: {
  rows: (AisVessel & { status: string; tone: "muted" | "warning" | "success" })[];
}) {
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const p = Math.min(page, pages - 1);
  const slice = rows.slice(p * pageSize, (p + 1) * pageSize);
  return (
    <div>
      <DataTable
        columns={[
          {
            key: "name",
            label: "Vessel",
            render: (r) => (
              <span className="font-medium">
                {r.name ?? <span className="text-muted-foreground">MMSI {r.mmsi}</span>}
              </span>
            ),
          },
          {
            key: "mmsi",
            label: "MMSI",
            render: (r) => (
              <span className="font-mono text-[12px] text-muted-foreground">{r.mmsi}</span>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (r) => <StatusBadge tone={r.tone}>{r.status}</StatusBadge>,
          },
          {
            key: "sog",
            label: "SOG",
            align: "right",
            render: (r) => <span className="font-mono">{(r.sog ?? 0).toFixed(1)} kn</span>,
          },
          {
            key: "cog",
            label: "COG",
            align: "right",
            render: (r) => <span className="font-mono">{(r.cog ?? 0).toFixed(0)}°</span>,
          },
          {
            key: "lat",
            label: "Lat",
            align: "right",
            render: (r) => <span className="font-mono text-[12px]">{r.lat.toFixed(3)}</span>,
          },
          {
            key: "lon",
            label: "Lon",
            align: "right",
            render: (r) => <span className="font-mono text-[12px]">{r.lon.toFixed(3)}</span>,
          },
        ]}
        rows={slice.map((r) => ({ ...r, id: r.mmsi }))}
        empty={<EmptyState />}
      />
      {pages > 1 && (
        <div className="flex items-center justify-between mt-3 text-[11.5px] text-muted-foreground">
          <div>
            Page {p + 1} of {pages}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((n) => Math.max(0, n - 1))}
              disabled={p === 0}
              className="px-2 py-1 rounded-md border border-border/70 hover:bg-white/[0.04] disabled:opacity-40 transition"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((n) => Math.min(pages - 1, n + 1))}
              disabled={p >= pages - 1}
              className="px-2 py-1 rounded-md border border-border/70 hover:bg-white/[0.04] disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
