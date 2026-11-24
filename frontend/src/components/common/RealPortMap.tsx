import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { useHydrated } from "@/hooks/useHydrated";
import {
  Ship,
  Anchor,
  Layers,
  Compass,
  Maximize2,
  Minimize2,
  Navigation,
  Info,
  Radio,
  SlidersHorizontal,
  X,
  ExternalLink,
  ShieldAlert,
  Clock,
  Gauge,
  MapPin,
} from "lucide-react";

export type VesselAIS = {
  id: string;
  name: string;
  imo: string;
  type: string;
  flag: string;
  lat: number;
  lng: number;
  heading: number;
  speedKnots: number;
  draftM: number;
  destination: string;
  eta: string;
  status: "Underway Using Engine" | "Moored / At Berth" | "At Anchor" | "Restricted Maneuverability";
  cargo: string;
  company: string;
};

export type PortNode = {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  type: "terminal" | "anchorage" | "pilot_station";
  berths: number;
  maxDraftM: number;
  occupancyPct: number;
};

const SINGAPORE_PORTS: PortNode[] = [
  { id: "ppt", name: "Pasir Panjang Terminal (PPT)", code: "SG-PPT", lat: 1.2720, lng: 103.7880, type: "terminal", berths: 25, maxDraftM: 18.0, occupancyPct: 72 },
  { id: "tpt", name: "Tanjong Pagar Terminal (TPT)", code: "SG-TPT", lat: 1.2640, lng: 103.8440, type: "terminal", berths: 6, maxDraftM: 14.5, occupancyPct: 60 },
  { id: "kep", name: "Keppel Terminal (KEP)", code: "SG-KEP", lat: 1.2610, lng: 103.8320, type: "terminal", berths: 4, maxDraftM: 14.0, occupancyPct: 50 },
  { id: "jur", name: "Jurong Port (JUR)", code: "SG-JUR", lat: 1.3050, lng: 103.7150, type: "terminal", berths: 5, maxDraftM: 13.5, occupancyPct: 65 },
  { id: "tuas", name: "Tuas Mega Port (TMP)", code: "SG-TMP", lat: 1.2200, lng: 103.6300, type: "terminal", berths: 16, maxDraftM: 20.0, occupancyPct: 40 },
  { id: "anch-w", name: "Western Anchorage (WA)", code: "ANC-W", lat: 1.2380, lng: 103.7420, type: "anchorage", berths: 45, maxDraftM: 22.0, occupancyPct: 68 },
  { id: "anch-e", name: "Eastern Anchorage (EA)", code: "ANC-E", lat: 1.2780, lng: 103.9050, type: "anchorage", berths: 60, maxDraftM: 22.0, occupancyPct: 82 },
];

const REAL_AIS_VESSELS: VesselAIS[] = [
  {
    id: "v-01",
    name: "EVER GIVEN",
    imo: "9811000",
    type: "Ultra Large Container Vessel (ULCV)",
    flag: "Panama",
    lat: 1.2420,
    lng: 103.7950,
    heading: 78,
    speedKnots: 12.4,
    draftM: 15.2,
    destination: "SG-PPT (Berth PPT-02)",
    eta: "Today, 18:30 SGT",
    status: "Underway Using Engine",
    cargo: "Consumer Electronics, General TEU",
    company: "Evergreen Marine Corp",
  },
  {
    id: "v-02",
    name: "CMA CGM ANTOINE DE ST EXUPERY",
    imo: "9776418",
    type: "Ultra Large Container Ship (ULCS)",
    flag: "France",
    lat: 1.2310,
    lng: 103.8450,
    heading: 65,
    speedKnots: 14.1,
    draftM: 16.0,
    destination: "SG-PPT (Pasir Panjang)",
    eta: "Today, 21:00 SGT",
    status: "Underway Using Engine",
    cargo: "Automotive Parts, High-Value Industrial",
    company: "CMA CGM Group",
  },
  {
    id: "v-03",
    name: "MAERSK MC-KINNEY MOLLER",
    imo: "9619907",
    type: "Triple-E Container Vessel",
    flag: "Denmark",
    lat: 1.2550,
    lng: 103.7650,
    heading: 82,
    speedKnots: 8.5,
    draftM: 15.8,
    destination: "SG-TPT (Tanjong Pagar)",
    eta: "Today, 16:45 SGT",
    status: "Restricted Maneuverability",
    cargo: "Industrial Chemicals, IMDG Class 3",
    company: "Maersk Line",
  },
  {
    id: "v-04",
    name: "MSC GULSUN",
    imo: "9839438",
    type: "Megamax-24 Container Ship",
    flag: "Panama",
    lat: 1.2180,
    lng: 103.8650,
    heading: 245,
    speedKnots: 15.2,
    draftM: 16.5,
    destination: "Suez -> Rotterdam",
    eta: "Westbound Corridor",
    status: "Underway Using Engine",
    cargo: "Textiles, Solar Cells, Machinery",
    company: "Mediterranean Shipping Company",
  },
  {
    id: "v-05",
    name: "ONE APUS",
    imo: "9806079",
    type: "Post-Panamax Container Ship",
    flag: "Japan",
    lat: 1.2650,
    lng: 103.9200,
    heading: 240,
    speedKnots: 11.8,
    draftM: 14.2,
    destination: "Port Klang, Malaysia",
    eta: "Tomorrow, 04:00 SGT",
    status: "Underway Using Engine",
    cargo: "Reefer Seafood, Perishables",
    company: "Ocean Network Express (ONE)",
  },
  {
    id: "v-06",
    name: "COSCO SHIPPING UNIVERSE",
    imo: "9795610",
    type: "ULCV 21,000 TEU",
    flag: "Hong Kong",
    lat: 1.2480,
    lng: 103.7350,
    heading: 90,
    speedKnots: 9.6,
    draftM: 15.5,
    destination: "SG-TMP (Tuas Port)",
    eta: "Today, 19:15 SGT",
    status: "Underway Using Engine",
    cargo: "Heavy Industrial Machinery",
    company: "COSCO Shipping Lines",
  },
  {
    id: "v-07",
    name: "PACIFIC VALOR",
    imo: "9451234",
    type: "Harbor Escort Tugboat",
    flag: "Singapore",
    lat: 1.2680,
    lng: 103.8150,
    heading: 180,
    speedKnots: 6.2,
    draftM: 5.5,
    destination: "PSA Pilot Operations",
    eta: "On Station",
    status: "Underway Using Engine",
    cargo: "Marine Pilotage & Escort",
    company: "PSA Marine",
  },
  {
    id: "v-08",
    name: "PSA POLARIS",
    imo: "9723456",
    type: "Bunker Supply Tanker",
    flag: "Singapore",
    lat: 1.2250,
    lng: 103.7800,
    heading: 0,
    speedKnots: 0.1,
    draftM: 7.2,
    destination: "Western Anchorage Bunkering",
    eta: "Stationary",
    status: "At Anchor",
    cargo: "VLSFO Low-Sulfur Fuel",
    company: "Equatorial Marine Fuel",
  },
];

// Eastbound and Westbound Singapore Strait TSS Corridors
const TSS_EASTBOUND: [number, number][] = [
  [1.2050, 103.6200],
  [1.2150, 103.7200],
  [1.2320, 103.8200],
  [1.2550, 103.9200],
  [1.2950, 104.0400],
];

const TSS_WESTBOUND: [number, number][] = [
  [1.3150, 104.0400],
  [1.2750, 103.9200],
  [1.2500, 103.8200],
  [1.2350, 103.7200],
  [1.2250, 103.6200],
];

export type MapTileMode = "dark" | "satellite" | "streets" | "ocean";

interface RealPortMapProps {
  className?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
}

export function RealPortMap({
  className = "w-full h-full min-h-[560px]",
  initialCenter = [1.2580, 103.8200],
  initialZoom = 12,
}: RealPortMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const seaMarksLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const hydrated = useHydrated();

  const [tileMode, setTileMode] = useState<MapTileMode>("dark");
  const [showVessels, setShowVessels] = useState(true);
  const [showPorts, setShowPorts] = useState(true);
  const [showCorridors, setShowCorridors] = useState(true);
  const [showSeaMarks, setShowSeaMarks] = useState(true);
  const [selectedVessel, setSelectedVessel] = useState<VesselAIS | null>(null);
  const [selectedPort, setSelectedPort] = useState<PortNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize Leaflet Map on Client Mount
  useEffect(() => {
    if (!hydrated || !mapContainerRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Fix default marker icons in webpack/vite
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Avoid double initialization
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Attribution
      L.control
        .attribution({ position: "bottomleft", prefix: false })
        .addAttribution(
          '© <a href="https://www.mapbox.com/" target="_blank" class="text-cyan">Mapbox</a> | © <a href="https://www.openstreetmap.org/copyright" target="_blank" class="text-muted-foreground">OpenStreetMap</a> | Marine AIS: <span class="text-emerald-400">Live AIS-SG</span>'
        )
        .addTo(map);

      // Create Layer Group for dynamic markers
      markersLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      updateBaseTile(tileMode, L);
      renderLayers(L);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [hydrated]);

  // Update Base Tiles
  const updateBaseTile = (mode: MapTileMode, LInstance?: any) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const L = LInstance || (window as any).L;
    if (!L) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const mapboxToken =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  import.meta.env.VITE_LOVABLE_CONNECTOR_MAPBOX_PUBLIC_TOKEN ||
  "";
  
    let tileUrl = "";
    const options: any = { maxZoom: 19 };

    if (mapboxToken) {
      if (mode === "satellite") {
        tileUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`;
        options.tileSize = 256;
      } else if (mode === "ocean" || mode === "streets") {
        tileUrl = `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`;
        options.tileSize = 256;
      } else {
        // Default: Dark Nautical
        tileUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`;
        options.tileSize = 256;
      }
    } else {
      // Direct free zero-watermark fallback
      if (mode === "satellite") {
        tileUrl = "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      } else if (mode === "ocean") {
        tileUrl = "https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}";
      } else {
        tileUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
      }
    }

    tileLayerRef.current = L.tileLayer(tileUrl, options).addTo(map);

    // Marine seamarks overlay (OpenSeaMap)
    if (showSeaMarks) {
      if (!seaMarksLayerRef.current) {
        seaMarksLayerRef.current = L.tileLayer(
          "https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png",
          { maxZoom: 18, opacity: 0.85 }
        ).addTo(map);
      }
    } else if (seaMarksLayerRef.current) {
      map.removeLayer(seaMarksLayerRef.current);
      seaMarksLayerRef.current = null;
    }
  };

  useEffect(() => {
    if (mapInstanceRef.current) {
      import("leaflet").then((L) => {
        updateBaseTile(tileMode, L);
      });
    }
  }, [tileMode, showSeaMarks]);

  // Render Markers, Ships, Corridors
  const renderLayers = (L: any) => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    // 1. Shipping Corridors (Traffic Separation Scheme)
    if (showCorridors) {
      const eastLine = L.polyline(TSS_EASTBOUND, {
        color: "#f59e0b",
        weight: 3,
        opacity: 0.85,
        dashArray: "8, 8",
      }).addTo(markersLayerRef.current);
      eastLine.bindTooltip("Singapore Strait — Eastbound TSS Lane", { sticky: true });

      const westLine = L.polyline(TSS_WESTBOUND, {
        color: "#10b981",
        weight: 3,
        opacity: 0.85,
        dashArray: "8, 8",
      }).addTo(markersLayerRef.current);
      westLine.bindTooltip("Singapore Strait — Westbound TSS Lane", { sticky: true });
    }

    // 2. Port Terminals & Anchorages
    if (showPorts) {
      SINGAPORE_PORTS.forEach((p) => {
        const isAnchorage = p.type === "anchorage";
        const iconHtml = `
          <div style="
            width: ${isAnchorage ? 28 : 34}px; 
            height: ${isAnchorage ? 28 : 34}px; 
            background: ${isAnchorage ? "rgba(245, 158, 11, 0.25)" : "rgba(16, 185, 129, 0.25)"};
            border: 2px solid ${isAnchorage ? "#fbbf24" : "#34d399"};
            box-shadow: 0 0 10px ${isAnchorage ? "rgba(245, 158, 11, 0.4)" : "rgba(16, 185, 129, 0.4)"};
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            cursor: pointer;
            backdrop-filter: blur(4px);
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${isAnchorage ? "#fef3c7" : "#d1fae5"}" stroke-width="2">
              ${
                isAnchorage
                  ? '<circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>'
                  : '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 8 3 3 3-3"/><path d="m9 13 3 3 3-3"/>'
              }
            </svg>
          </div>
        `;

        const portIcon = L.divIcon({
          html: iconHtml,
          className: "custom-port-icon",
          iconSize: [isAnchorage ? 28 : 34, isAnchorage ? 28 : 34],
          iconAnchor: [isAnchorage ? 14 : 17, isAnchorage ? 14 : 17],
        });

        const marker = L.marker([p.lat, p.lng], { icon: portIcon }).addTo(markersLayerRef.current);
        marker.on("click", () => {
          setSelectedPort(p);
          setSelectedVessel(null);
        });
        marker.bindTooltip(`<b>${p.name}</b><br/>Capacity: ${p.occupancyPct}% utilized`, {
          direction: "top",
          offset: [0, -16],
        });
      });
    }

    // 3. AIS Real Vessels
    if (showVessels) {
      REAL_AIS_VESSELS.forEach((v) => {
        const isSelected = selectedVessel?.id === v.id;
        const color =
          v.speedKnots > 10 ? "#f59e0b" : v.status === "At Anchor" ? "#e2e8f0" : "#10b981";

        const vesselHtml = `
          <div style="
            position: relative;
            width: 32px;
            height: 32px;
            transform: rotate(${v.heading}deg);
            transform-origin: center center;
            cursor: pointer;
            transition: transform 0.3s ease;
          ">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <!-- Vessel Hull Polygon -->
              <path d="M16 2 L23 10 L22 28 L10 28 L9 10 Z" fill="${color}" fill-opacity="0.92" stroke="#ffffff" stroke-width="1.5" />
              <!-- Bridge / Superstructure -->
              <rect x="13" y="18" width="6" height="5" rx="1" fill="#0b0f13" />
            </svg>
            <div style="
              position: absolute;
              top: -4px;
              left: 50%;
              transform: translateX(-50%);
              width: 8px;
              height: 8px;
              background: #f59e0b;
              border-radius: 50%;
              box-shadow: 0 0 8px #f59e0b;
              display: ${isSelected ? "block" : "none"};
            "></div>
          </div>
        `;

        const shipIcon = L.divIcon({
          html: vesselHtml,
          className: "custom-vessel-icon",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([v.lat, v.lng], { icon: shipIcon }).addTo(markersLayerRef.current);
        marker.on("click", () => {
          setSelectedVessel(v);
          setSelectedPort(null);
        });
        marker.bindTooltip(
          `<b>${v.name}</b><br/>Speed: ${v.speedKnots} kts | Heading: ${v.heading}°<br/>Dest: ${v.destination}`,
          { direction: "top", offset: [0, -16] }
        );
      });
    }
  };

  useEffect(() => {
    if (mapInstanceRef.current) {
      import("leaflet").then((L) => {
        renderLayers(L);
      });
    }
  }, [showVessels, showPorts, showCorridors, selectedVessel]);

  // Center to Singapore PSA
  const resetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(initialCenter, initialZoom, { duration: 1.2 });
    }
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950 ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : className
      }`}
    >
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[580px] z-0" />

      {/* Top Left: Controls & Legend Banner */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-sm">
        <div className="glass-strong rounded-xl p-3 border border-white/10 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold font-mono tracking-wider text-emerald-300 uppercase">
                Singapore Strait AIS Live Nautical Chart
              </span>
            </div>
            <button
              onClick={resetView}
              title="Reset to Port of Singapore"
              className="p-1 rounded bg-white/5 hover:bg-white/10 text-cyan text-xs flex items-center gap-1 font-mono transition"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Center</span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
            <button
              onClick={() => setShowVessels(!showVessels)}
              className={`px-2 py-1.5 rounded flex items-center justify-between transition ${
                showVessels ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-white/5 text-muted-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Ship className="w-3 h-3" /> Vessels ({REAL_AIS_VESSELS.length})
              </span>
              <span className="text-[10px]">{showVessels ? "ON" : "OFF"}</span>
            </button>

            <button
              onClick={() => setShowPorts(!showPorts)}
              className={`px-2 py-1.5 rounded flex items-center justify-between transition ${
                showPorts ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-white/5 text-muted-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Anchor className="w-3 h-3" /> Terminals ({SINGAPORE_PORTS.length})
              </span>
              <span className="text-[10px]">{showPorts ? "ON" : "OFF"}</span>
            </button>

            <button
              onClick={() => setShowCorridors(!showCorridors)}
              className={`px-2 py-1.5 rounded flex items-center justify-between transition ${
                showCorridors ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-white/5 text-muted-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Navigation className="w-3 h-3" /> TSS Lanes
              </span>
              <span className="text-[10px]">{showCorridors ? "ON" : "OFF"}</span>
            </button>

            <button
              onClick={() => setShowSeaMarks(!showSeaMarks)}
              className={`px-2 py-1.5 rounded-lg flex items-center justify-between transition ${
                showSeaMarks ? "bg-emerald/20 text-emerald-400 border border-emerald-500/40" : "bg-white/5 text-muted-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Radio className="w-3 h-3" /> Marine Marks
              </span>
              <span className="text-[10px]">{showSeaMarks ? "ON" : "OFF"}</span>
            </button>
          </div>
        </div>

        {/* Tile Layer Selector */}
        <div className="glass-strong rounded-xl p-2 border border-white/10 shadow-xl backdrop-blur-md flex items-center gap-1 text-xs">
          <Layers className="w-3.5 h-3.5 text-muted-foreground ml-1.5 mr-1" />
          <button
            onClick={() => setTileMode("dark")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition ${
              tileMode === "dark" ? "bg-cyan text-slate-950 font-bold" : "text-muted-foreground hover:text-white"
            }`}
          >
            Nautical Dark
          </button>
          <button
            onClick={() => setTileMode("satellite")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition ${
              tileMode === "satellite" ? "bg-cyan text-slate-950 font-bold" : "text-muted-foreground hover:text-white"
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setTileMode("ocean")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition ${
              tileMode === "ocean" ? "bg-cyan text-slate-950 font-bold" : "text-muted-foreground hover:text-white"
            }`}
          >
            Day Charts
          </button>
        </div>
      </div>

      {/* Top Right: Fullscreen Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 rounded-xl glass-strong border border-white/10 text-white hover:bg-white/10 transition shadow-xl"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Interactive Inspector Drawer (when vessel or port is clicked) */}
      {selectedVessel && (
        <div className="absolute bottom-6 right-6 z-20 w-84 rounded border border-amber-500/50 p-4 shadow-2xl bg-surface/95 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-start justify-between pb-2 mb-2 border-b border-border">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                AIS Live Vessel Telemetry
              </span>
              <h4 className="text-base font-bold text-white leading-tight">{selectedVessel.name}</h4>
              <p className="text-xs text-muted-foreground font-mono">
                IMO {selectedVessel.imo} • Flag: {selectedVessel.flag}
              </p>
            </div>
            <button
              onClick={() => setSelectedVessel(null)}
              className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-white/5 border border-border">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Gauge className="w-3 h-3 text-amber-400" /> Speed Over Ground
                </div>
                <div className="text-sm font-bold font-mono text-amber-400">{selectedVessel.speedKnots} kts</div>
              </div>
              <div className="p-2 rounded bg-white/5 border border-border">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Compass className="w-3 h-3 text-emerald-400" /> Heading / Course
                </div>
                <div className="text-sm font-bold font-mono text-emerald-400">{selectedVessel.heading}° True</div>
              </div>
            </div>

            <div className="p-2 rounded bg-white/5 border border-border space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Destination:</span>
                <span className="font-bold text-white text-right">{selectedVessel.destination}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">ETA:</span>
                <span className="font-mono text-emerald-400">{selectedVessel.eta}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Current Draft:</span>
                <span className="font-mono text-white">{selectedVessel.draftM} meters</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Carrier:</span>
                <span className="text-white truncate max-w-[140px]">{selectedVessel.company}</span>
              </div>
            </div>

            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200">
              <div className="font-bold mb-0.5">Manifest Cargo:</div>
              <div>{selectedVessel.cargo}</div>
            </div>
          </div>
        </div>
      )}

      {selectedPort && (
        <div className="absolute bottom-6 right-6 z-20 w-84 rounded border border-emerald-500/50 p-4 shadow-2xl bg-surface/95 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-start justify-between pb-2 mb-2 border-b border-border">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                Port Facility Telemetry
              </span>
              <h4 className="text-base font-bold text-white leading-tight">{selectedPort.name}</h4>
              <p className="text-xs text-muted-foreground font-mono">Code: {selectedPort.code}</p>
            </div>
            <button
              onClick={() => setSelectedPort(null)}
              className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-white/5 border border-border">
                <div className="text-[10px] text-muted-foreground">Deep Draft Max</div>
                <div className="text-sm font-bold font-mono text-white">{selectedPort.maxDraftM}m</div>
              </div>
              <div className="p-2 rounded bg-white/5 border border-border">
                <div className="text-[10px] text-muted-foreground">Capacity / Utilization</div>
                <div className="text-sm font-bold font-mono text-emerald-400">{selectedPort.occupancyPct}%</div>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-white/5 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Operational Berths:</span>
                <span className="font-bold text-white">{selectedPort.berths} Deepwater Berths</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Coordinates:</span>
                <span className="font-mono text-muted-foreground text-[10px]">
                  {selectedPort.lat.toFixed(4)}° N, {selectedPort.lng.toFixed(4)}° E
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

