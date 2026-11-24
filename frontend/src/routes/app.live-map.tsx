import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { RealPortMap } from "@/components/common/RealPortMap";
import { Radio, Ship, Anchor, Gauge, Compass } from "lucide-react";

export const Route = createFileRoute("/app/live-map")({
  head: () => ({ meta: [{ title: "Live Nautical AIS Map — SmartPort AI" }] }),
  component: LiveMap,
});

function LiveMap() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Global Maritime Operations"
        title="Singapore Strait AIS & Port Infrastructure"
        subtitle="Real-time navigational tracking, Traffic Separation Schemes (TSS), deepwater terminals, and live vessel positions."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              AIS Receiver: Active (Station SG-01)
            </div>
          </div>
        }
      />

      {/* Real Interactive Map Canvas */}
      <div className="w-full h-[640px] rounded-2xl overflow-hidden shadow-2xl">
        <RealPortMap className="w-full h-full" />
      </div>

      {/* Operational Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-lg space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Ship className="w-4 h-4 text-amber-400" /> Monitored Inbound Fleet
          </div>
          <div className="text-2xl font-bold font-mono text-white">8 Active ULCV</div>
          <p className="text-[11px] text-muted-foreground">Ever Given, CMA CGM Antoine, Maersk Mc-Kinney</p>
        </div>

        <div className="glass p-4 rounded-lg space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Anchor className="w-4 h-4 text-emerald-400" /> PSA Terminals Connected
          </div>
          <div className="text-2xl font-bold font-mono text-white">7 Port Hubs</div>
          <p className="text-[11px] text-muted-foreground">Pasir Panjang, Tanjong Pagar, Tuas Megaport, Jurong</p>
        </div>

        <div className="glass p-4 rounded-xl space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Gauge className="w-4 h-4 text-emerald-400" /> Strait Traffic Velocity
          </div>
          <div className="text-2xl font-bold font-mono text-white">12.1 kts Avg</div>
          <p className="text-[11px] text-muted-foreground">Eastbound / Westbound TSS lanes clear</p>
        </div>

        <div className="glass p-4 rounded-xl space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Radio className="w-4 h-4 text-amber-400" /> Sea Chart Layers
          </div>
          <div className="text-2xl font-bold font-mono text-white">OpenSeaMap + CARTO</div>
          <p className="text-[11px] text-muted-foreground">Satellite, Nautical Dark & Maritime Buoy overlays</p>
        </div>
      </div>
    </div>
  );
}
