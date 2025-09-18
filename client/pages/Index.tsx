import { useEffect, useMemo, useRef, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Battery,
  Signal,
  AlertTriangle,
  Thermometer,
  Cog,
  Camera,
  Palette,
  Play,
  Upload,
  Siren,
  TriangleAlert,
  Download,
  Volume2,
  VolumeX,
  RefreshCcw,
  Shield,
  Lock,
  Sun,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Types
type Detection = { t: string; type: string; conf: number; src: string };
type Station = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  capacity: number;
  status: "Active" | "Offline";
};
type Bot = {
  id: string;
  species: "Langur" | "Civet" | "Owl" | "BirdBot" | "RainMimic";
  terrain: "Day" | "Night" | "Rain" | "Fog" | "Forest" | "Border";
  threat: "Low" | "Medium" | "High";
  stealth: boolean;
  battery: number;
  lat: number;
  lon: number;
  routingTo?: string | null; // station id
  charging?: boolean;
};

export default function Index() {
  // Webhook config
  const [webhookUrl, setWebhookUrl] = useState<string>(
    () => localStorage.getItem("vanara:webhook") || "",
  );
  useEffect(
    () => localStorage.setItem("vanara:webhook", webhookUrl || ""),
    [webhookUrl],
  );

  // Global controls
  const [species, setSpecies] = useState("Langur");
  const [terrain, setTerrain] = useState("Forest");
  const [stealth, setStealth] = useState(true);

  // Bot health (VNR-07 spotlight for Overview/Live Feed)
  const [temp, setTemp] = useState(42);
  const [motor, setMotor] = useState("Stable");
  const [cameraHealth, setCameraHealth] = useState("Optimal");
  const [camoSync, setCamoSync] = useState(97);
  const [signal, setSignal] = useState(76);
  const [threatLevel, setThreatLevel] = useState<"Low" | "Medium" | "High">(
    "Low",
  );
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // Power Stations
  const stations: Station[] = [
    {
      id: "Alpha",
      name: "Station Alpha – Pahalgam Sector",
      lat: 34.01,
      lon: 75.31,
      capacity: 120,
      status: "Active",
    },
    {
      id: "Bravo",
      name: "Station Bravo – Ladakh Ridge",
      lat: 34.1526,
      lon: 77.5771,
      capacity: 150,
      status: "Active",
    },
    {
      id: "Delta",
      name: "Station Delta – Arunachal Valley",
      lat: 27.586,
      lon: 91.8766,
      capacity: 110,
      status: "Active",
    },
    {
      id: "Echo",
      name: "Station Echo – Siachen Perimeter",
      lat: 35.3716,
      lon: 77.2368,
      capacity: 140,
      status: "Offline",
    },
  ];

  // Fleet across northern borders
  const [bots, setBots] = useState<Bot[]>([
    {
      id: "VNR-01",
      species: "Langur",
      terrain: "Day",
      threat: "Low",
      stealth: true,
      battery: 88,
      lat: 33.9,
      lon: 75.0,
    },
    {
      id: "VNR-02",
      species: "Civet",
      terrain: "Night",
      threat: "Low",
      stealth: true,
      battery: 64,
      lat: 34.3,
      lon: 76.8,
    },
    {
      id: "VNR-03",
      species: "Owl",
      terrain: "Fog",
      threat: "Medium",
      stealth: true,
      battery: 73,
      lat: 32.9,
      lon: 77.2,
    },
    {
      id: "VNR-04",
      species: "BirdBot",
      terrain: "Rain",
      threat: "Low",
      stealth: true,
      battery: 59,
      lat: 28.1,
      lon: 92.1,
    },
    {
      id: "VNR-05",
      species: "RainMimic",
      terrain: "Forest",
      threat: "Low",
      stealth: true,
      battery: 91,
      lat: 27.7,
      lon: 91.2,
    },
    {
      id: "VNR-06",
      species: "Langur",
      terrain: "Border",
      threat: "Medium",
      stealth: true,
      battery: 35,
      lat: 34.9,
      lon: 74.5,
    },
    {
      id: "VNR-07",
      species: "Civet",
      terrain: "Forest",
      threat: "Low",
      stealth: true,
      battery: 87,
      lat: 34.0876,
      lon: 74.7973,
    },
  ]);

  // Spotlight bot helpers
  const vnr07 = useMemo(() => bots.find((b) => b.id === "VNR-07")!, [bots]);
  const battery = vnr07?.battery ?? 0;

  // Detections
  const [detections, setDetections] = useState<Detection[]>([
    { t: new Date().toISOString(), type: "Motion", conf: 0.62, src: "LIDAR" },
    {
      t: new Date(Date.now() - 120000).toISOString(),
      type: "Thermal",
      conf: 0.71,
      src: "IR-Cam",
    },
  ]);
  const [detFilter, setDetFilter] = useState<string>("All");
  const [confRange, setConfRange] = useState<number[]>([50, 95]);

  // Alerts
  const [alertOn, setAlertOn] = useState(true);
  const [threshold, setThreshold] = useState(80);
  const [soundOn, setSoundOn] = useState(true);
  const [alerts, setAlerts] = useState<
    { id: string; msg: string; t: string }[]
  >([
    {
      id: "a1",
      msg: "Boundary breach in Sector 3",
      t: new Date().toLocaleTimeString(),
    },
  ]);
  const [captured, setCaptured] = useState(false);
  const [selfDestruct, setSelfDestruct] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Live Feed Simulation
  const defaultVideo =
    "https://assets.mixkit.co/videos/preview/mixkit-trees-in-the-forest-woods-1181-large.mp4";
  const [simVideo, setSimVideo] = useState<string>(defaultVideo);
  const [simRunning, setSimRunning] = useState(true);
  const [anomaly, setAnomaly] = useState(false);
  const simTimer = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liveAlert, setLiveAlert] = useState(false);
  const [threatLogs, setThreatLogs] = useState<{id:string; botId:string; ts:string; location?:string; confidence:number; seek:number}[]>([]);
  const scanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastImage = useRef<ImageData | null>(null);
  const lastTriggerRef = useRef<number>(0);

  // Webhook helper (validate + safe send)
  const canSend = useMemo(() => {
    try {
      if (!webhookUrl) return false;
      const u = new URL(webhookUrl);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch {
      return false;
    }
  }, [webhookUrl]);

  function safeSend(url: string, body: any) {
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
        navigator.sendBeacon(url, blob);
        return;
      }
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }

  async function sendEvent(event: string, payload: Record<string, any>) {
    if (!canSend) return;
    const body = { event, payload, ts: new Date().toISOString() };
    safeSend(webhookUrl, body);
  }
  function onSyncLogs() {
    if (!canSend) {
      toast("Add a valid webhook URL (https) to sync logs.");
      return;
    }
    sendEvent("sync_logs", { bots, stations, detections, alerts });
    toast.success("Synced");
  }

  // Control changes
  useEffect(() => {
    sendEvent("controls_changed", { species, terrain, stealth });
  }, [species, terrain, stealth]);

  // 1s: health/telemetry glow
  useEffect(() => {
    const id = setInterval(() => {
      setTemp((t) =>
        Math.max(37, Math.min(62, +(t + (Math.random() * 2 - 1)).toFixed(1))),
      );
      setSignal((s) =>
        Math.max(20, Math.min(100, s + Math.floor(Math.random() * 5 - 2))),
      );
      setCamoSync((c) =>
        Math.max(90, Math.min(100, c + Math.floor(Math.random() * 3 - 1))),
      );
      if (Math.random() < 0.05)
        setMotor((m) => (m === "Stable" ? "Surge" : "Stable"));
      if (Math.random() < 0.05)
        setCameraHealth((c) => (c === "Optimal" ? "Calibrating" : "Optimal"));
      setThreatLevel((prev) =>
        anomaly
          ? "High"
          : Math.random() < 0.06
            ? prev === "Low"
              ? "Medium"
              : "Low"
            : prev,
      );
    }, 1000);
    return () => clearInterval(id);
  }, [anomaly]);

  // 5s: fleet movement, routing and charging updates
  useEffect(() => {
    const id = setInterval(() => {
      setBots((prev) => {
        return prev.map((b) => {
          // drift
          const lat = +(b.lat + (Math.random() * 0.01 - 0.005)).toFixed(4);
          const lon = +(b.lon + (Math.random() * 0.01 - 0.005)).toFixed(4);

          // nearest active station
          const active = stations.filter((s) => s.status === "Active");
          const nearest = active.length
            ? active.reduce(
                (mn, s) =>
                  dist(b.lat, b.lon, s.lat, s.lon) <
                  dist(b.lat, b.lon, mn.lat, mn.lon)
                    ? s
                    : mn,
                active[0],
              )
            : undefined;

          // battery/charging
          let battery = b.battery;
          let charging = b.charging || false;
          let routingTo = b.routingTo || null;
          if (battery < 20 && nearest) {
            routingTo = nearest.id;
          }
          if (routingTo) {
            // arrive & charge
            if (nearest && dist(lat, lon, nearest.lat, nearest.lon) < 5) {
              charging = true;
            }
          }
          if (charging) {
            battery = Math.min(100, battery + 10);
            if (battery >= 100) {
              charging = false;
              routingTo = null;
              sendEvent("charging_complete", { botId: b.id });
            } else {
              sendEvent("charging_tick", { botId: b.id, battery });
            }
          } else {
            battery = Math.max(0, battery - 3);
          }

          // threat fluctuate lightly
          const threat: Bot["threat"] =
            b.threat === "High"
              ? "High"
              : Math.random() < 0.05
                ? b.threat === "Low"
                  ? "Medium"
                  : "Low"
                : b.threat;

          // log move
          sendEvent("bot_move", {
            botId: b.id,
            lat,
            lon,
            battery,
            routingTo,
            charging,
          });

          return { ...b, lat, lon, battery, routingTo, charging, threat };
        });
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Spot-light bot anomaly after 10s
  useEffect(() => {
    if (!simRunning) return;
    if (simTimer.current) window.clearTimeout(simTimer.current);
    setAnomaly(false);
    simTimer.current = window.setTimeout(() => {
      setAnomaly(true);
      const det = {
        t: new Date().toISOString(),
        type: "Ammunition Transport",
        conf: 0.92,
        src: "Drone-Cam",
      } as Detection;
      setDetections((d) => [det, ...d]);
      setAlerts((a) => [
        {
          id: crypto.randomUUID(),
          msg: "Anomaly: Ammunition Transport",
          t: new Date().toLocaleTimeString(),
        },
        ...a,
      ]);
      if (soundOn && alertOn) beep();
      sendEvent("detection", det);
    }, 10000);
    return () => {
      if (simTimer.current) window.clearTimeout(simTimer.current);
    };
  }, [simRunning]);

  // AI human presence scanning for uploaded video (confidence > 0.75)
  useEffect(() => {
    if (!previewSrc) return;
    const cvs = document.createElement("canvas");
    scanCanvasRef.current = cvs;
    const ctx = cvs.getContext("2d");
    const id = setInterval(() => {
      const v = videoRef.current;
      if (!v || !ctx || v.readyState < 2) return;
      const w = 160;
      const h = Math.max(90, Math.floor((v.videoHeight / (v.videoWidth || 1)) * w) || 90);
      cvs.width = w;
      cvs.height = h;
      ctx.drawImage(v, 0, 0, w, h);
      const frame = ctx.getImageData(0, 0, w, h);
      if (lastImage.current) {
        let diffSum = 0;
        let count = 0;
        const a = frame.data;
        const b = lastImage.current.data;
        for (let i = 0; i < a.length; i += 16) {
          const dr = a[i] - b[i];
          const dg = a[i + 1] - b[i + 1];
          const db = a[i + 2] - b[i + 2];
          diffSum += Math.abs(dr) + Math.abs(dg) + Math.abs(db);
          count++;
        }
        const diffAvg = diffSum / (count * 255 * 3);
        const confidence = Math.min(0.98, Math.max(0.5, diffAvg * 2));
        if (confidence > 0.75) triggerHuman(confidence);
      }
      lastImage.current = frame;
    }, 500);
    return () => {
      clearInterval(id);
      lastImage.current = null;
    };
  }, [previewSrc]);

  // Detections stream (probabilistic)
  useEffect(() => {
    const id = setInterval(() => {
      const conf = +(0.55 + Math.random() * 0.2).toFixed(2);
      const types = ["Motion", "Thermal", "Acoustic", "Unknown"];
      const det = {
        t: new Date().toISOString(),
        type: types[Math.floor(Math.random() * types.length)],
        conf,
        src: "SensorNet",
      } as Detection;
      setDetections((d) => [det, ...d.slice(0, 30)]);
      sendEvent("detection", det);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  // Self-destruct countdown
  useEffect(() => {
    if (!selfDestruct) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [selfDestruct]);
  useEffect(() => {
    if (selfDestruct && countdown <= 0) {
      setSelfDestruct(false);
      setCountdown(5);
      const b = vnr07;
      const payload = {
        botId: b.id,
        location: `${b.lat.toFixed(4)} N, ${b.lon.toFixed(4)} E`,
        timestamp: new Date().toISOString(),
        reason: "Compromised",
      };
      setAlerts((a) => [
        {
          id: crypto.randomUUID(),
          msg: `${b.id} self-destruct executed`,
          t: new Date().toLocaleTimeString(),
        },
        ...a,
      ]);
      sendEvent("self_destruct", payload);
    }
  }, [countdown, selfDestruct]);

  function beep() {
    try {
      const ctx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = "square";
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      o.start();
      setTimeout(() => {
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
        o.stop(ctx.currentTime + 0.12);
      }, 120);
    } catch {}
  }

  function triggerHuman(conf: number) {
    const now = Date.now();
    if (now - lastTriggerRef.current < 5000) return;
    lastTriggerRef.current = now;
    setLiveAlert(true);
    setTimeout(() => setLiveAlert(false), 2500);
    const ts = new Date().toISOString();
    const seek = videoRef.current?.currentTime ?? 0;
    const location = `${vnr07.lat.toFixed(4)}° N, ${vnr07.lon.toFixed(4)}° E`;
    const entry = { id: crypto.randomUUID(), botId: vnr07.id, ts, location, confidence: +conf.toFixed(2), seek };
    setThreatLogs((l) => [entry, ...l].slice(0, 12));
    const det: Detection = { t: ts, type: "Human Presence", conf: +conf.toFixed(2), src: "AI-Scan" };
    setDetections((d) => [det, ...d]);
    setAlerts((a) => [{ id: crypto.randomUUID(), msg: `Human Presence detected (${(conf * 100).toFixed(0)}%)`, t: new Date().toLocaleTimeString() }, ...a]);
    sendEvent("human_presence_detected", { botId: vnr07.id, ts, location, confidence: +conf.toFixed(2), seek });
  }

  function replayAt(seek: number) {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, seek - 0.3);
      videoRef.current.play();
    }
  }

  function exportJSON() {
    const data = JSON.stringify(detections, null, 2);
    downloadFile(data, "detections.json", "application/json");
  }
  function exportCSV() {
    const rows = [
      ["Timestamp", "Detection Type", "Confidence", "Source"],
      ...detections.map((d) => [d.t, d.type, d.conf.toFixed(2), d.src]),
    ];
    const csv = rows.map((r) => r.map(escapeCSV).join(",")).join("\n");
    downloadFile(csv, "detections.csv", "text/csv");
  }
  function escapeCSV(s: any) {
    const v = String(s);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function downloadFile(content: string, name: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredDetections = useMemo(
    () =>
      detections.filter(
        (d) =>
          (detFilter === "All" || d.type === detFilter) &&
          d.conf * 100 >= confRange[0] &&
          d.conf * 100 <= confRange[1],
      ),
    [detections, detFilter, confRange],
  );

  // Satellite filters
  const [satSpecies, setSatSpecies] = useState<string>("All");
  const [satTerrain, setSatTerrain] = useState<string>("All");
  const [satThreat, setSatThreat] = useState<string>("All");
  const satFilteredBots = useMemo(
    () =>
      bots.filter(
        (b) =>
          (satSpecies === "All" || b.species === satSpecies) &&
          (satTerrain === "All" ||
            (satTerrain === "Border"
              ? b.terrain === "Border"
              : b.terrain === satTerrain)) &&
          (satThreat === "All" || b.threat === satThreat),
      ),
    [bots, satSpecies, satTerrain, satThreat],
  );

  return (
    <Shell
      onSync={onSyncLogs}
      webhookUrl={webhookUrl}
      setWebhookUrl={setWebhookUrl}
    >
      {/* Header ribbon */}
      <section className="mb-6">
        <div className="soft-panel p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md grid place-items-center neon-ring bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="font-display text-xl sm:text-2xl neon-text">
              Vanara System — Futuristic Surveillance Dashboard
            </h1>
          </div>
          <div className="hud-line" />
          <p className="text-sm text-muted-foreground">
            Dark mode, neon green glow, cinematic HUD transitions. Modular and
            responsive across devices.
          </p>
        </div>
      </section>

      {/* Overview */}
      <section id="overview" className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Overview
          </div>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Controls */}
          <div className="soft-panel p-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">Controls</div>
              <Tooltip>
                <TooltipTrigger className="text-xs text-primary">
                  ℹ
                </TooltipTrigger>
                <TooltipContent>
                  Vanara operates in real-time—every second counts.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <div className="text-xs mb-1">Select Species</div>
                <Select value={species} onValueChange={(v) => setSpecies(v)}>
                  <SelectTrigger className="bg-background/60">
                    <SelectValue placeholder="Species" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Langur", "Civet", "Owl", "BirdBot", "RainMimic"].map(
                      (s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-xs mb-1">Select Terrain</div>
                <Select value={terrain} onValueChange={(v) => setTerrain(v)}>
                  <SelectTrigger className="bg-background/60">
                    <SelectValue placeholder="Terrain" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Day", "Night", "Rain", "Fog", "Forest"].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-secondary/60">
              <div className="text-sm">Stealth Mode</div>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    stealth
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {stealth ? "ON" : "OFF"}
                </div>
                <Switch
                  checked={stealth}
                  onCheckedChange={(v) => {
                    setStealth(v);
                    sendEvent("stealth", { on: v });
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Metric
                live
                label="Battery"
                value={battery + "%"}
                icon={<Battery className="h-4 w-4" />}
              />
              <Metric
                live
                label="Signal"
                value={signal + "%"}
                icon={<Signal className="h-4 w-4" />}
              />
              <Metric
                live
                label="Threat Level"
                value={threatLevel}
                icon={<AlertTriangle className="h-4 w-4" />}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Metric
                live
                label="Temp"
                value={`${temp}°C`}
                icon={<Thermometer className="h-4 w-4" />}
              />
              <Metric
                live
                label="Motor"
                value={motor}
                icon={<Cog className="h-4 w-4" />}
              />
              <Metric
                live
                label="Camera"
                value={cameraHealth}
                icon={<Camera className="h-4 w-4" />}
              />
              <Metric
                live
                label="Camo Sync"
                value={`${camoSync}%`}
                icon={<Palette className="h-4 w-4" />}
              />
            </div>
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="neon-ring">
                    <Play className="mr-2 h-4 w-4" />
                    Start Bot
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="font-display">
                      Drone Camera Online
                    </DialogTitle>
                  </DialogHeader>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                    <div className="absolute inset-0 grid place-items-center text-muted-foreground">
                      Live feed initializing…
                    </div>
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-x-8 top-8 h-px hud-line" />
                      <div className="absolute inset-x-8 bottom-8 h-px hud-line" />
                      <div className="absolute inset-y-8 left-8 w-px hud-line" />
                      <div className="absolute inset-y-8 right-8 w-px hud-line" />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const url = URL.createObjectURL(f);
                      setPreviewSrc(url);
                      setSimVideo(url);
                      setSimRunning(true);
                    }
                  }}
                />
                <span className="px-3 py-2 rounded-md border border-border bg-background/60 text-sm inline-flex items-center gap-2 hover:bg-accent/60">
                  <Upload className="h-4 w-4" />
                  Upload Feed
                </span>
              </label>
              <ThreatSimulation
                onTrigger={() => {
                  setThreatLevel("High");
                  setAlerts((a) => [
                    {
                      id: crypto.randomUUID(),
                      msg: "Threat Simulation Triggered",
                      t: new Date().toLocaleTimeString(),
                    },
                    ...a,
                  ]);
                  if (soundOn && alertOn) beep();
                  sendEvent("threat_simulation", { species, terrain, stealth });
                }}
              />
            </div>
          </div>

          {/* Live Bot Preview (VNR-07) */}
          <div className="lg:col-span-2 soft-panel p-4 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-muted-foreground">
                Live Bot Preview
              </div>
              <div className="text-xs text-muted-foreground">
                Camouflage overlay active
              </div>
            </div>
            <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-background/50">
              {previewSrc ? (
                <video
                  src={previewSrc}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                />
              ) : (
                <img
                  src="/placeholder.svg"
                  className="h-full w-full object-cover opacity-70"
                  alt="Bot"
                />
              )}
              {vnr07?.charging && (
                <div className="absolute bottom-3 left-3 right-3 bg-background/80 rounded-md p-2 border border-border">
                  <div className="text-xs mb-1">
                    {vnr07.id} Charging at {vnr07.routingTo} · Battery{" "}
                    {vnr07.battery}%
                  </div>
                  <Progress value={vnr07.battery} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Power Stations Panel */}
        <div className="soft-panel p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="text-sm">Power Stations</div>
            <Tooltip>
              <TooltipTrigger className="text-xs text-primary">
                ℹ
              </TooltipTrigger>
              <TooltipContent>
                Vanara bots recharge autonomously via solar stations placed in
                strategic, secure zones.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="relative aspect-video overflow-hidden rounded-md border border-border">
            <iframe
              title="stations"
              className="absolute inset-0 h-full w-full"
              src={`https://maps.google.com/maps?q=34.5,78&z=5&output=embed`}
            />
            {/* Overlay layers */}
            <MapOverlays />
            <StationPins stations={stations} />
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Station</TableHead>
                  <TableHead>Lat/Long</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Nearby Bots (ETA)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stations.map((s) => {
                  const nearby = bots
                    .map((b) => ({ b, d: dist(b.lat, b.lon, s.lat, s.lon) }))
                    .sort((a, b) => a.d - b.d)
                    .slice(0, 3)
                    .map(
                      ({ b, d }) => `${b.id} (${Math.round((d / 40) * 60)}m)`,
                    )
                    .join(", ");
                  return (
                    <TableRow key={s.id}>
                      <TableCell>{s.name}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {s.lat.toFixed(4)}, {s.lon.toFixed(4)}
                      </TableCell>
                      <TableCell>{s.capacity} kWh</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            s.status === "Active"
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {s.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{nearby || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* Detections */}
      <section id="detections" className="space-y-4 mt-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Detections
          </div>
          <div className="flex-1 h-px bg-border/50" />
        </div>
        <div className="soft-panel p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Tooltip>
                <TooltipTrigger className="text-xs text-primary">
                  ℹ
                </TooltipTrigger>
                <TooltipContent>
                  In real-world conditions, anomaly identification is
                  probabilistic. Vanara reflects this with realistic detection
                  confidence.
                </TooltipContent>
              </Tooltip>
              <div className="text-xs">Type</div>
              <Select value={detFilter} onValueChange={setDetFilter}>
                <SelectTrigger className="w-[180px] bg-background/60">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "All",
                    "Motion",
                    "Thermal",
                    "Ammunition Transport",
                    "Acoustic",
                    "Unknown",
                  ].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs ml-2">
                Confidence {confRange[0]}–{confRange[1]}%
              </div>
              <div className="w-48">
                <Slider
                  value={confRange}
                  min={50}
                  max={95}
                  step={1}
                  onValueChange={setConfRange}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button onClick={exportJSON}>
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Detection Type</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDetections.map((d, i) => (
                  <TableRow key={i} className="hover:bg-primary/5">
                    <TableCell className="font-mono text-xs">{d.t}</TableCell>
                    <TableCell>{d.type}</TableCell>
                    <TableCell>{(d.conf * 100).toFixed(0)}%</TableCell>
                    <TableCell>
                      {d.conf < 0.7 ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                          Uncertain
                        </span>
                      ) : (
                        <span className="text-xs">OK</span>
                      )}
                    </TableCell>
                    <TableCell>{d.src}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs">Enable Human Review</div>
            <Switch
              onCheckedChange={(v) =>
                toast(v ? "Human review enabled" : "Human review disabled")
              }
            />
          </div>
        </div>
      </section>

      {/* Alerts */}
      <section id="alerts" className="space-y-4 mt-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Alerts
          </div>
          <div className="flex-1 h-px bg-border/50" />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="soft-panel p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">Alert System</div>
              <Switch checked={alertOn} onCheckedChange={setAlertOn} />
            </div>
            <div>
              <div className="text-xs mb-1">
                Confidence Threshold: {threshold}%
              </div>
              <Slider
                value={[threshold]}
                min={50}
                max={95}
                step={1}
                onValueChange={(v) => setThreshold(v[0])}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={soundOn ? "default" : "secondary"}
                onClick={() => setSoundOn(!soundOn)}
                className="gap-2"
              >
                {soundOn ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
                Sound {soundOn ? "ON" : "OFF"}
              </Button>
              <div
                className={cn(
                  "h-3 w-3 rounded-full animate-pulse",
                  alertOn
                    ? "bg-destructive shadow-[0_0_16px_2px_rgba(255,0,0,0.6)]"
                    : "bg-muted",
                )}
              />
              <span className="text-xs text-muted-foreground">
                Flashing indicator
              </span>
            </div>
            {/* Final Protocol */}
            <div className="rounded-lg border border-border p-3 bg-background/60 space-y-3">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium">Final Protocol</div>
                <Tooltip>
                  <TooltipTrigger className="text-xs text-primary">
                    ℹ
                  </TooltipTrigger>
                  <TooltipContent>
                    To prevent reverse-engineering or diplomatic fallout, Vanara
                    bots erase all traces when compromised.
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Activate Self-Destruct Mode
                </div>
                <Switch
                  checked={selfDestruct}
                  onCheckedChange={(v) => {
                    if (!captured) {
                      toast("Set Captured/Exposed before arming.");
                      return;
                    }
                    setSelfDestruct(v);
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm">Captured / Exposed</div>
                <Switch checked={captured} onCheckedChange={setCaptured} />
              </div>
              <Dialog
                open={selfDestruct}
                onOpenChange={(o) => {
                  if (!o) {
                    setSelfDestruct(false);
                    setCountdown(5);
                  }
                }}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-destructive">
                      Confirm Destruction
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 text-sm">
                    <p>
                      Bot VNR-07 will self-destruct in{" "}
                      <span className="font-mono">{countdown}s</span>. This is
                      irreversible.
                    </p>
                    <Progress value={((5 - countdown) / 5) * 100} />
                    <div className="text-muted-foreground">
                      Conditions: bot captured or exposed. Reason: Compromise.
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSelfDestruct(false);
                        setCountdown(5);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="md:col-span-2 soft-panel p-4">
            <div className="text-sm text-muted-foreground mb-2">
              Recent Alerts
            </div>
            <ul className="space-y-2">
              {alerts.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 bg-background/60"
                >
                  <div className="flex items-center gap-2">
                    <Siren className="h-4 w-4 text-destructive" />{" "}
                    <span>{a.msg}</span>{" "}
                    <span className="text-xs text-muted-foreground">{a.t}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setAlerts((prev) => prev.filter((x) => x.id !== a.id))
                    }
                  >
                    Acknowledge
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Satellite View */}
      <section id="satellite" className="space-y-4 mt-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Satellite View
          </div>
          <div className="flex-1 h-px bg-border/50" />
        </div>
        <div className="soft-panel p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Tooltip>
              <TooltipTrigger className="text-xs text-primary">
                ℹ
              </TooltipTrigger>
              <TooltipContent>
                Vanara’s bot fleet adapts to terrain and mission—each unit is
                autonomous, stealth-enabled, and region-aware.
              </TooltipContent>
            </Tooltip>
            <div className="text-xs">Species</div>
            <Select value={satSpecies} onValueChange={setSatSpecies}>
              <SelectTrigger className="w-[140px] bg-background/60">
                <SelectValue placeholder="Species" />
              </SelectTrigger>
              <SelectContent>
                {["All", "Langur", "Civet", "Owl", "BirdBot", "RainMimic"].map(
                  (r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <div className="text-xs">Terrain</div>
            <Select value={satTerrain} onValueChange={setSatTerrain}>
              <SelectTrigger className="w-[140px] bg-background/60">
                <SelectValue placeholder="Terrain" />
              </SelectTrigger>
              <SelectContent>
                {["All", "Day", "Night", "Rain", "Fog", "Forest", "Border"].map(
                  (r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <div className="text-xs">Threat</div>
            <Select value={satThreat} onValueChange={setSatThreat}>
              <SelectTrigger className="w-[120px] bg-background/60">
                <SelectValue placeholder="Threat" />
              </SelectTrigger>
              <SelectContent>
                {["All", "Low", "Medium", "High"].map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="ml-auto flex items-center gap-2">
              <input
                placeholder="Search Bot ID"
                className="h-9 px-3 rounded-md bg-background/60 border border-border text-sm"
              />
              <Button variant="secondary" onClick={() => toast("Searching…")}>
                Locate
              </Button>
              <Button
                onClick={() => toast("Location refreshed")}
                className="gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border">
            <iframe
              title="map"
              className="absolute inset-0 h-full w-full"
              src="https://maps.google.com/maps?q=34.5,78&z=5&output=embed"
            />
            <MapOverlays />
            <StationPins stations={stations} />
            <BotPins bots={satFilteredBots} />
          </div>
        </div>
      </section>

      {/* Live Feed Simulation */}
      <section id="live" className="space-y-4 mt-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Live Feed
          </div>
          <div className="flex-1 h-px bg-border/50" />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 soft-panel p-3 sm:p-4">
            <div className="relative rounded-lg overflow-hidden border border-border">
              <video
                ref={videoRef}
                src={simVideo}
                className={cn(
                  "h-full w-full object-cover transition-transform duration-500",
                  anomaly ? "scale-[1.06]" : "scale-100",
                )}
                autoPlay
                muted
                loop
              ></video>
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 transition",
                  anomaly ? "bg-red-500/20" : "bg-transparent",
                )}
              />
              <div className="absolute left-3 top-3 text-xs px-2 py-1 rounded bg-background/70 border border-border">
                {vnr07.id} · {vnr07.terrain} · Stealth{" "}
                {vnr07.stealth ? "ON" : "OFF"}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button
                onClick={() => {
                  setSimRunning(true);
                  setAnomaly(false);
                  videoRef.current?.play();
                }}
              >
                <Play className="h-4 w-4 mr-2" />
                Replay Feed
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setSimRunning(false);
                  setAnomaly(false);
                  videoRef.current?.pause();
                }}
              >
                Pause
              </Button>
              <Button
                onClick={() => {
                  const payload = {
                    threatType: "Ammunition Transport",
                    confidence: 0.92,
                    location: `${vnr07.lat.toFixed(4)}° N, ${vnr07.lon.toFixed(4)}° E`,
                    timestamp: new Date().toISOString(),
                    botId: vnr07.id,
                    terrain: vnr07.terrain,
                    stealth: vnr07.stealth,
                  };
                  if (!webhookUrl) {
                    toast("Add webhook URL to register");
                    return;
                  }
                  sendEvent("register_threat", payload);
                }}
                className="gap-2"
              >
                <TriangleAlert className="h-4 w-4" />
                Register Threat
              </Button>
            </div>
          </div>
          <div className="soft-panel p-4 space-y-3">
            <div className="text-sm text-muted-foreground">Detection Logs</div>
            <div className="rounded-md border border-border p-3 bg-background/60 text-sm space-y-1">
              <div>
                Threat Type:{" "}
                <span className="text-primary">Ammunition Transport</span>
              </div>
              <div>
                Confidence Score: <span className="text-primary">0.92</span>
              </div>
              <div>
                Location: {vnr07.lat.toFixed(4)}° N, {vnr07.lon.toFixed(4)}° E
              </div>
              <div>Timestamp: {new Date().toISOString()}</div>
              <div>Bot ID: {vnr07.id}</div>
              <div>Terrain: {vnr07.terrain}</div>
              <div>Stealth Mode: {vnr07.stealth ? "ON" : "OFF"}</div>
              <Tooltip>
                <TooltipTrigger className="mt-2 text-xs text-primary">
                  ℹ
                </TooltipTrigger>
                <TooltipContent>
                  Vanara integrates with no-code backend tools for real-time
                  logging and ethical transparency.
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}

function Metric({
  label,
  value,
  icon,
  live,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  live?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 p-3 bg-background/60",
        live && "animate-[pulse_2s_ease-in-out_infinite]",
      )}
    >
      <div className="text-xs text-muted-foreground flex items-center gap-2">
        {icon}
        {label}
      </div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}

function ThreatSimulation({ onTrigger }: { onTrigger: () => void }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <AlertTriangle className="h-4 w-4" />
          Threat Simulation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">Threat Simulation</DialogTitle>
        </DialogHeader>
        <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
          <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-3xl font-display neon-text">ALERT</div>
              <div className="text-sm text-muted-foreground mt-2">
                System status freeze. Cinematic lock-on engaged.
              </div>
            </div>
          </div>
        </div>
        <Button onClick={onTrigger} className="w-full">
          Trigger
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function BotPins({ bots }: { bots: Bot[] }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {bots.map((b, i) => (
        <div
          key={b.id}
          className="absolute"
          style={{
            left: `${40 + (b.lon - 78) * 12}%`,
            top: `${50 - (b.lat - 34.5) * 12}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="text-xs px-2 py-1 rounded bg-background/80 border border-border neon-ring whitespace-nowrap">
            {b.id} · {b.species} · {b.battery}% · {b.threat} ·{" "}
            {b.stealth ? "S" : "NS"}
          </div>
        </div>
      ))}
    </div>
  );
}

function StationPins({ stations }: { stations: Station[] }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {stations.map((s) => (
        <div
          key={s.id}
          className="absolute"
          style={{
            left: `${40 + (s.lon - 78) * 12}%`,
            top: `${50 - (s.lat - 34.5) * 12}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="text-xs px-2 py-1 rounded bg-background/90 border border-border flex items-center gap-1 whitespace-nowrap">
            <Sun className="h-3.5 w-3.5 text-primary" /> {s.id}
          </div>
        </div>
      ))}
    </div>
  );
}

function MapOverlays() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Border fence line */}
      <div className="absolute left-[10%] right-[10%] top-[30%] h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-60"></div>
      {/* Forest zone */}
      <div className="absolute left-[15%] top-[50%] w-[20%] h-[18%] bg-green-500/10 border border-green-500/30 rounded-sm" />
      {/* Snow zone */}
      <div className="absolute right-[12%] top-[22%] w-[18%] h-[16%] bg-slate-100/10 border border-slate-100/30 rounded-sm" />
      {/* Rain zone */}
      <div className="absolute left-[40%] bottom-[18%] w-[22%] h-[16%] bg-cyan-500/10 border border-cyan-500/30 rounded-sm" />
      <div className="absolute left-2 bottom-2 text-[10px] px-2 py-1 rounded bg-background/70 border border-border">
        Overlays: Forest / Snow / Rain · Border Fence
      </div>
    </div>
  );
}

// Utilities
function dist(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
