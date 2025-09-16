import { useEffect, useMemo, useRef, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Battery, Signal, AlertTriangle, Thermometer, Cog, Camera, Palette, Play, Upload, Siren, TriangleAlert, Download, Volume2, VolumeX, RefreshCcw, Satellite, Shield } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Index() {
  // Global webhook config (persisted)
  const [webhookUrl, setWebhookUrl] = useState<string>(() => localStorage.getItem("vanara:webhook") || "");
  useEffect(() => {
    localStorage.setItem("vanara:webhook", webhookUrl || "");
  }, [webhookUrl]);

  // Overview state
  const [species, setSpecies] = useState("Langur");
  const [terrain, setTerrain] = useState("Forest");
  const [stealth, setStealth] = useState(true);
  const [battery, setBattery] = useState(87);
  const [signal, setSignal] = useState(76);
  const [threatLevel, setThreatLevel] = useState("Low");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // Detections
  type Detection = { t: string; type: string; conf: number; src: string };
  const [detections, setDetections] = useState<Detection[]>([
    { t: new Date().toISOString(), type: "Motion", conf: 0.72, src: "LIDAR" },
    { t: new Date(Date.now() - 120000).toISOString(), type: "Thermal", conf: 0.81, src: "IR-Cam" },
  ]);
  const [detFilter, setDetFilter] = useState<string>("All");
  const [confRange, setConfRange] = useState<number[]>([50, 95]);

  // Alerts
  const [alertOn, setAlertOn] = useState(true);
  const [threshold, setThreshold] = useState(80);
  const [soundOn, setSoundOn] = useState(true);
  const [alerts, setAlerts] = useState<{ id: string; msg: string; t: string }[]>([
    { id: "a1", msg: "Boundary breach in Sector 3", t: new Date().toLocaleTimeString() },
  ]);

  // Live Feed Simulation
  const defaultVideo = "https://assets.mixkit.co/videos/preview/mixkit-trees-in-the-forest-woods-1181-large.mp4";
  const [simVideo, setSimVideo] = useState<string>(defaultVideo);
  const [simRunning, setSimRunning] = useState(true);
  const [anomaly, setAnomaly] = useState(false);
  const simTimer = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Webhook helper
  async function sendEvent(event: string, payload: Record<string, any>) {
    if (!webhookUrl) return;
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, payload, ts: new Date().toISOString() }),
        keepalive: true,
      });
      toast.success("Synced: " + event);
    } catch (e) {
      toast.error("Webhook failed");
    }
  }

  function onSyncLogs() {
    if (!webhookUrl) {
      toast("Add a webhook URL to sync logs.");
      return;
    }
    sendEvent("sync_logs", { species, terrain, stealth, alerts, detections });
  }

  // React to controls
  useEffect(() => {
    sendEvent("controls_changed", { species, terrain, stealth });
  }, [species, terrain, stealth]);

  // Live feed anomaly trigger after 10s when running
  useEffect(() => {
    if (!simRunning) return;
    if (simTimer.current) window.clearTimeout(simTimer.current);
    setAnomaly(false);
    simTimer.current = window.setTimeout(() => {
      setAnomaly(true);
      const det = {
        t: new Date().toISOString(),
        type: "Ammunition Transport",
        conf: 92 / 100,
        src: "Drone-Cam",
      } as Detection;
      setDetections((d) => [det, ...d]);
      setAlerts((a) => [{ id: crypto.randomUUID(), msg: "Anomaly: Ammunition Transport", t: new Date().toLocaleTimeString() }, ...a]);
      if (soundOn && alertOn) beep();
    }, 10000);
    return () => {
      if (simTimer.current) window.clearTimeout(simTimer.current);
    };
  }, [simRunning]);

  function beep() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "square"; o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      o.start();
      setTimeout(() => { g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1); o.stop(ctx.currentTime + 0.12); }, 120);
    } catch {}
  }

  function exportJSON() {
    const data = JSON.stringify(detections, null, 2);
    downloadFile(data, "detections.json", "application/json");
  }
  function exportCSV() {
    const rows = [["Timestamp","Detection Type","Confidence","Source"], ...detections.map(d => [d.t, d.type, d.conf.toFixed(2), d.src])];
    const csv = rows.map(r => r.map(escapeCSV).join(",")).join("\n");
    downloadFile(csv, "detections.csv", "text/csv");
  }
  function escapeCSV(s: any){
    const v = String(s);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g,'""') + '"' : v;
  }
  function downloadFile(content: string, name: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }

  const filteredDetections = useMemo(() => {
    return detections.filter(d => (detFilter === "All" || d.type === detFilter) && d.conf * 100 >= confRange[0] && d.conf * 100 <= confRange[1]);
  }, [detections, detFilter, confRange]);

  return (
    <Shell onSync={onSyncLogs} webhookUrl={webhookUrl} setWebhookUrl={setWebhookUrl}>
      {/* Header ribbon */}
      <section className="mb-6">
        <div className="soft-panel p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md grid place-items-center neon-ring bg-primary/10 text-primary"><Shield className="h-5 w-5"/></div>
            <h1 className="font-display text-xl sm:text-2xl neon-text">Vanara System — Futuristic Surveillance Dashboard</h1>
          </div>
          <div className="hud-line" />
          <p className="text-sm text-muted-foreground">Dark mode, neon green glow, cinematic HUD transitions. Modular and responsive across devices.</p>
        </div>
      </section>

      {/* Overview */}
      <section id="overview" className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Overview</div>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Controls */}
          <div className="soft-panel p-4 space-y-4">
            <div className="text-sm text-muted-foreground">Controls</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <div className="text-xs mb-1">Select Species</div>
                <Select value={species} onValueChange={(v) => setSpecies(v)}>
                  <SelectTrigger className="bg-background/60">
                    <SelectValue placeholder="Species" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Langur','Civet','Owl','BirdBot','RainMimic'].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
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
                    {['Day','Night','Rain','Fog','Forest'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-secondary/60">
              <div className="text-sm">Stealth Mode</div>
              <div className="flex items-center gap-3">
                <div className={cn("text-xs px-2 py-0.5 rounded-full", stealth ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>{stealth ? "ON" : "OFF"}</div>
                <Switch checked={stealth} onCheckedChange={setStealth} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Battery" value={battery + "%"} icon={<Battery className="h-4 w-4"/>} />
              <Metric label="Signal" value={signal + "%"} icon={<Signal className="h-4 w-4"/>} />
              <Metric label="Threat Level" value={threatLevel} icon={<AlertTriangle className="h-4 w-4"/>} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Temp" value={"42°C"} icon={<Thermometer className="h-4 w-4"/>} />
              <Metric label="Motor" value={"Stable"} icon={<Cog className="h-4 w-4"/>} />
              <Metric label="Camera" value={"Optimal"} icon={<Camera className="h-4 w-4"/>} />
              <Metric label="Camo Sync" value={"97%"} icon={<Palette className="h-4 w-4"/>} />
            </div>
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="neon-ring"><Play className="mr-2 h-4 w-4"/>Start Bot</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="font-display">Drone Camera Online</DialogTitle>
                  </DialogHeader>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                    <div className="absolute inset-0 grid place-items-center text-muted-foreground">Live feed initializing…</div>
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-x-8 top-8 h-px hud-line"/>
                      <div className="absolute inset-x-8 bottom-8 h-px hud-line"/>
                      <div className="absolute inset-y-8 left-8 w-px hud-line"/>
                      <div className="absolute inset-y-8 right-8 w-px hud-line"/>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="file" accept="video/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { const url = URL.createObjectURL(f); setPreviewSrc(url); setSimVideo(url); setSimRunning(true); }
                }} />
                <span className="px-3 py-2 rounded-md border border-border bg-background/60 text-sm inline-flex items-center gap-2 hover:bg-accent/60"><Upload className="h-4 w-4"/>Upload Feed</span>
              </label>
              <ThreatSimulation onTrigger={() => {
                setThreatLevel("High");
                setAlerts((a) => [{ id: crypto.randomUUID(), msg: "Threat Simulation Triggered", t: new Date().toLocaleTimeString() }, ...a]);
                if (soundOn && alertOn) beep();
                sendEvent("threat_simulation", { species, terrain, stealth });
              }}/>
            </div>
          </div>

          {/* Live Bot Preview */}
          <div className="lg:col-span-2 soft-panel p-4 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-muted-foreground">Live Bot Preview</div>
              <div className="text-xs text-muted-foreground">Camouflage overlay active</div>
            </div>
            <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-background/50">
              {previewSrc ? (
                <video src={previewSrc} className="h-full w-full object-cover" autoPlay muted loop />
              ) : (
                <img src="/placeholder.svg" className="h-full w-full object-cover opacity-70" alt="Bot" />
              )}
              <div className="absolute inset-0 mix-blend-screen bg-[radial-gradient(circle_at_center,hsla(var(--primary)/0.15),transparent_60%)]" />
            </div>
          </div>
        </div>
      </section>

      {/* Detections */}
      <section id="detections" className="space-y-4 mt-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Detections</div>
          <div className="flex-1 h-px bg-border/50" />
        </div>
        <div className="soft-panel p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-xs">Type</div>
              <Select value={detFilter} onValueChange={setDetFilter}>
                <SelectTrigger className="w-[180px] bg-background/60"><SelectValue placeholder="Type"/></SelectTrigger>
                <SelectContent>
                  {['All','Motion','Thermal','Ammunition Transport'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="text-xs ml-2">Confidence {confRange[0]}–{confRange[1]}%</div>
              <div className="w-48"><Slider value={confRange} min={50} max={95} step={1} onValueChange={setConfRange} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={exportCSV}><Download className="h-4 w-4 mr-2"/>CSV</Button>
              <Button onClick={exportJSON}><Download className="h-4 w-4 mr-2"/>JSON</Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Detection Type</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDetections.map((d, i) => (
                  <TableRow key={i} className="hover:bg-primary/5">
                    <TableCell className="font-mono text-xs">{d.t}</TableCell>
                    <TableCell>{d.type}</TableCell>
                    <TableCell>{(d.conf * 100).toFixed(0)}%</TableCell>
                    <TableCell>{d.src}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* Alerts */}
      <section id="alerts" className="space-y-4 mt-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Alerts</div>
          <div className="flex-1 h-px bg-border/50" />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="soft-panel p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">Alert System</div>
              <Switch checked={alertOn} onCheckedChange={setAlertOn} />
            </div>
            <div>
              <div className="text-xs mb-1">Confidence Threshold: {threshold}%</div>
              <Slider value={[threshold]} min={50} max={95} step={1} onValueChange={(v)=>setThreshold(v[0])} />
            </div>
            <div className="flex items-center gap-3">
              <Button variant={soundOn ? "default" : "secondary"} onClick={() => setSoundOn(!soundOn)} className="gap-2">
                {soundOn ? <Volume2 className="h-4 w-4"/> : <VolumeX className="h-4 w-4"/>}
                Sound {soundOn ? "ON" : "OFF"}
              </Button>
              <div className={cn("h-3 w-3 rounded-full animate-pulse", alertOn ? "bg-destructive shadow-[0_0_16px_2px_rgba(255,0,0,0.6)]" : "bg-muted")}/>
              <span className="text-xs text-muted-foreground">Flashing indicator</span>
            </div>
          </div>
          <div className="md:col-span-2 soft-panel p-4">
            <div className="text-sm text-muted-foreground mb-2">Recent Alerts</div>
            <ul className="space-y-2">
              {alerts.map(a => (
                <li key={a.id} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 bg-background/60">
                  <div className="flex items-center gap-2"><Siren className="h-4 w-4 text-destructive"/> <span>{a.msg}</span> <span className="text-xs text-muted-foreground">{a.t}</span></div>
                  <Button size="sm" variant="secondary" onClick={() => setAlerts(prev => prev.filter(x => x.id !== a.id))}>Acknowledge</Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Satellite View */}
      <section id="satellite" className="space-y-4 mt-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Satellite View</div>
          <div className="flex-1 h-px bg-border/50" />
        </div>
        <div className="soft-panel p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs">Filters</div>
            <Select value={species} onValueChange={setSpecies}>
              <SelectTrigger className="w-[160px] bg-background/60"><SelectValue placeholder="Species"/></SelectTrigger>
              <SelectContent>
                {['Langur','Civet','Owl','BirdBot','RainMimic'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={terrain} onValueChange={setTerrain}>
              <SelectTrigger className="w-[160px] bg-background/60"><SelectValue placeholder="Terrain"/></SelectTrigger>
              <SelectContent>
                {['Day','Night','Rain','Fog','Forest'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="ml-auto flex items-center gap-2">
              <input placeholder="Search Bot ID" className="h-9 px-3 rounded-md bg-background/60 border border-border text-sm" />
              <Button variant="secondary" onClick={()=>toast("Searching…")}>Locate</Button>
              <Button onClick={()=>toast("Location refreshed") } className="gap-2"><RefreshCcw className="h-4 w-4"/>Refresh</Button>
            </div>
          </div>
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border">
            <iframe title="map" className="absolute inset-0 h-full w-full" src="https://maps.google.com/maps?q=34.0876,74.7973&z=6&output=embed" />
            <div className="absolute inset-0 pointer-events-none">
              {/* Mock pins */}
              <div className="absolute left-[35%] top-[45%] -translate-x-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded bg-background/80 border border-border neon-ring">VNR-07 · {species} · {terrain} · {battery}%</div>
              <div className="absolute left-[62%] top-[30%] -translate-x-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded bg-background/80 border border-border">VNR-02 · Civet · Night · 64%</div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Feed Simulation */}
      <section id="live" className="space-y-4 mt-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Live Feed</div>
          <div className="flex-1 h-px bg-border/50" />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 soft-panel p-3 sm:p-4">
            <div className="relative rounded-lg overflow-hidden border border-border">
              <video ref={videoRef} src={simVideo} className={cn("h-full w-full object-cover transition-transform duration-500", anomaly ? "scale-[1.06]" : "scale-100")} autoPlay muted loop></video>
              {/* Red alert overlay on anomaly */}
              <div className={cn("pointer-events-none absolute inset-0 transition", anomaly ? "bg-red-500/20" : "bg-transparent")} />
              <div className="absolute left-3 top-3 text-xs px-2 py-1 rounded bg-background/70 border border-border">VNR-07 · {terrain} · Stealth {stealth ? "ON" : "OFF"}</div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button onClick={()=>{ setSimRunning(true); setAnomaly(false); videoRef.current?.play(); }}><Play className="h-4 w-4 mr-2"/>Replay Feed</Button>
              <Button variant="secondary" onClick={()=>{ setSimRunning(false); setAnomaly(false); videoRef.current?.pause(); }}>Pause</Button>
              <Button onClick={()=>{
                const payload = { threatType: "Ammunition Transport", confidence: 0.92, location: "34.0876° N, 74.7973° E", timestamp: "2025-09-16T13:55 IST", botId: "VNR-07", terrain: "Forest", stealth: true };
                if (!webhookUrl){ toast("Add webhook URL to register"); return; }
                sendEvent("register_threat", payload);
              }} className="gap-2"><TriangleAlert className="h-4 w-4"/>Register Threat</Button>
            </div>
          </div>
          <div className="soft-panel p-4 space-y-3">
            <div className="text-sm text-muted-foreground">Detection Logs</div>
            <div className="rounded-md border border-border p-3 bg-background/60 text-sm space-y-1">
              <div>Threat Type: <span className="text-primary">Ammunition Transport</span></div>
              <div>Confidence Score: <span className="text-primary">0.92</span></div>
              <div>Location: 34.0876° N, 74.7973° E</div>
              <div>Timestamp: 2025-09-16T13:55 IST</div>
              <div>Bot ID: VNR-07</div>
              <div>Terrain: Forest</div>
              <div>Stealth Mode: ON</div>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }){
  return (
    <div className="rounded-lg border border-border/60 p-3 bg-background/60">
      <div className="text-xs text-muted-foreground flex items-center gap-2">{icon}{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}

function ThreatSimulation({ onTrigger }: { onTrigger: () => void }){
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2"><AlertTriangle className="h-4 w-4"/>Threat Simulation</Button>
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
              <div className="text-sm text-muted-foreground mt-2">System status freeze. Cinematic lock-on engaged.</div>
            </div>
          </div>
        </div>
        <Button onClick={onTrigger} className="w-full">Trigger</Button>
      </DialogContent>
    </Dialog>
  );
}
