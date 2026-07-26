"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient, type Session } from "@supabase/supabase-js";
import Link from "next/link";
import type { Category, Entry, Goal } from "@/types/entry";
import { categories } from "@/types/entry";
import { dayKey, elapsedMinutes, formatMinutes, totalMinutes } from "@/lib/format";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnon ? createClient(supabaseUrl, supabaseAnon) : null;

function localDateTime() {
  const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000);
  return now.toISOString().slice(0, 16);
}

export function Studio({ initialEntries }: { initialEntries: Entry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [category, setCategory] = useState<Category>("build"); const [planned, setPlanned] = useState(120);
  const [duration, setDuration] = useState(60); const [startedAt, setStartedAt] = useState(localDateTime());
  const [title, setTitle] = useState(""); const [detail, setDetail] = useState(""); const [reflection, setReflection] = useState("");
  const [evidence, setEvidence] = useState(""); const [status, setStatus] = useState(""); const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(Date.now()); const [manual, setManual] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]); const [goalTitle, setGoalTitle] = useState(""); const [goalTarget, setGoalTarget] = useState(80); const [goalMetric, setGoalMetric] = useState<Goal["metric"]>("minutes");

  const headers = useMemo(() => ({ "content-type": "application/json", ...(session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {}), ...(adminKey ? { "x-admin-key": adminKey } : {}) }), [session, adminKey]);

  useEffect(() => {
    supabase?.auth.getSession().then(({ data }) => setSession(data.session)).finally(() => setAuthReady(true));
    const listener = supabase?.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener?.data.subscription.unsubscribe();
  }, []);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { fetch("/api/goals").then((r)=>r.json()).then(setGoals).catch(()=>null); }, []);
  useEffect(() => {
    if (!session && !adminKey) return;
    fetch("/api/entries?private=1", { headers }).then((r) => r.ok ? r.json() : null).then((data) => data && setEntries(data));
  }, [session, adminKey, headers]);

  const active = entries.find((entry) => entry.status === "active");
  const todayEntries = entries.filter((entry) => dayKey(entry.startedAt) === dayKey(new Date()) && entry.status !== "active");
  const todayTotal = totalMinutes(todayEntries);
  const goalUnit = goalMetric === "minutes" ? "hours" : goalMetric === "streak" ? "days" : goalMetric === "checklist" ? "items" : "count";

  async function login(event: FormEvent) {
    event.preventDefault(); if (!supabase) { setStatus("Add Supabase environment variables, or use the local studio key."); return; }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setStatus(error ? error.message : "Authenticated. Private records unlocked.");
  }

  async function request(method: string, body?: unknown) {
    const response = await fetch("/api/entries", { method, headers, body: body ? JSON.stringify(body) : undefined });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || "Request failed."); return data;
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setStatus("");
    try {
      const data = await request("POST", { action: manual ? "manual" : "start", startedAt: manual ? new Date(startedAt).toISOString() : new Date().toISOString(),
        plannedMinutes: manual ? undefined : Math.min(planned, 120), durationMinutes: manual ? Math.min(duration, 120) : 0, category, title, detail, reflection,
        evidenceUrls: evidence ? [evidence] : [], isPublic: false });
      setEntries((current) => [data, ...current]); setTitle(""); setDetail(""); setReflection(""); setEvidence("");
      setStatus(manual ? "Saved privately. Approve it when ready." : "Focus block started. Stopping closes it—there is no pause.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not save."); } finally { setSaving(false); }
  }

  async function uploadScreenshot(file?: File) {
    if (!file) return; setSaving(true); setStatus("Uploading screenshot privately…");
    const form = new FormData(); form.append("file", file);
    const uploadHeaders = { ...(session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {}), ...(adminKey ? { "x-admin-key": adminKey } : {}) };
    const response = await fetch("/api/evidence", { method: "POST", headers: uploadHeaders, body: form }); const data = await response.json();
    setSaving(false); if (!response.ok) { setStatus(data.error || "Upload failed."); return; }
    setEvidence(data.path); setStatus("Screenshot stored privately. It becomes accessible only after this session is published.");
  }

  async function stop() {
    if (!active || !window.confirm("Stop this block? It cannot be resumed.")) return;
    try { const data = await request("PATCH", { id: active.id, action: "finish" }); setEntries((current) => current.map((entry) => entry.id === data.id ? data : entry)); setStatus("Block closed privately. Review it before publishing."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Could not stop session."); }
  }

  async function publish(entry: Entry) {
    try { const data = await request("PATCH", { id: entry.id, action: entry.isPublic ? "unpublish" : "publish" }); setEntries((current) => current.map((item) => item.id === data.id ? data : item)); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Could not update visibility."); }
  }

  async function addGoal(event: FormEvent) {
    event.preventDefault();
    const target = goalMetric === "minutes" ? goalTarget * 60 : goalTarget;
    const response=await fetch("/api/goals",{method:"POST",headers,body:JSON.stringify({title:goalTitle,metric:goalMetric,target,period:"week",category:goalMetric==="minutes"?category:undefined,isPublic:true})});
    const data=await response.json(); if(!response.ok){setStatus(data.error||"Could not create goal.");return;} setGoals((current)=>[data,...current]);setGoalTitle("");setStatus("Public accountability goal created.");
  }

  async function removeGoal(id: string) {
    if (!window.confirm("Remove this goal?")) return;
    try {
      const response = await fetch(`/api/goals?id=${id}`, { method: "DELETE", headers });
      if (!response.ok) throw new Error();
      setGoals((current) => current.filter((g) => g.id !== id));
      setStatus("Goal removed.");
    } catch {
      setStatus("Could not remove goal.");
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Permanently remove this private record?")) return;
    try { const response = await fetch(`/api/entries?id=${id}`, { method: "DELETE", headers }); if (!response.ok) throw new Error(); setEntries((current) => current.filter((entry) => entry.id !== id)); }
    catch { setStatus("Could not remove the record."); }
  }

  if (!authReady) return <div className="studio-lock"><span>VERIFYING OWNER SESSION</span><i /></div>;
  if (supabase && !session) return <div className="studio-login"><Link href="/" className="studio-login-home">S.</Link><form onSubmit={login}><span>PRIVATE WORKING SURFACE</span><h1>Owner<br/><em>access.</em></h1><p>This route contains drafts, interrupted sessions and unpublished evidence. Authentication is required.</p><label>Email<input type="email" autoComplete="email" value={email} onChange={(e)=>setEmail(e.target.value)} required/></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={(e)=>setPassword(e.target.value)} required/></label>{status&&<small>{status}</small>}<button>Enter studio ↗</button></form></div>;

  return (
    <div className="studio-shell shell">
      {!supabase && <section className="studio-access">
        <form onSubmit={login}><span>OWNER ACCESS</span><input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} /><input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} /><button>{session ? "Authenticated" : "Unlock"}</button></form>
        <label>LOCAL KEY<input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} placeholder="Development fallback" /></label>
      </section>}

      <section className="studio-intro"><div><p className="overline">DAY BEGINS / 00:00 PKT</p><h1>Give the time.<br /><em>Keep the proof.</em></h1></div><div className="studio-total"><div className="time-ring" style={{ "--progress": `${Math.min(todayTotal / 480, 1) * 360}deg` } as React.CSSProperties}><span>{formatMinutes(todayTotal)}</span><small>focused today</small></div></div></section>

      {active ? <section className="active-session"><div><span>FOCUS BLOCK / LIVE</span><i /></div><h2>{active.title}</h2><strong>{formatMinutes(elapsedMinutes(active.startedAt, new Date(now).toISOString()))}</strong><p>{formatMinutes(active.plannedMinutes || 0)} intention · {active.category}</p><button onClick={stop}>Stop and close block ↗</button><small>Stopping is final. The result stays private until approved.</small></section> :
      <section className="capture"><div className="capture-heading"><span>{manual ? "Manual private record" : "New focus block"}</span><button type="button" onClick={() => setManual(!manual)}>{manual ? "USE TIMER" : "LOG MANUALLY"}</button></div><form onSubmit={submit}>
        <div className="category-picker">{categories.map((item) => <button className={category === item ? "active" : ""} type="button" key={item} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <div className="field title-field"><label htmlFor="title">What will move?</label><input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A clear, honest sentence" required maxLength={100} /></div>
        <div className="capture-grid">{manual && <div className="field"><label>Started</label><input type="datetime-local" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} /></div>}<div className="field duration-field"><label>{manual ? "Focused time" : "Intended block"} / max 2h</label><input type="number" min="1" max="120" value={manual ? duration : planned} onChange={(e) => manual ? setDuration(Math.min(120, Number(e.target.value))) : setPlanned(Math.min(120, Number(e.target.value)))} /><span>minutes</span></div></div>
        <div className="field"><label>Notes / what are you doing?</label><textarea value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={1000} /></div>
        <div className="field"><label>Reflection</label><textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="Optional — what changed in your understanding?" maxLength={1200} /></div>
        <div className="capture-grid"><div className="field"><label>Evidence link</label><input type="text" value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="GitHub, lecture, note…" /></div><div className="field"><label>Optional screenshot / 5 MB max</label><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => uploadScreenshot(e.target.files?.[0])} /></div></div>
        <div className="form-submit"><p className={status ? "visible" : ""}>{status || "Private by default"}</p><button disabled={saving}>{saving ? "Saving…" : manual ? "Save private draft" : "Start focus block"}<span>↗</span></button></div>
      </form></section>}

      {status && <p className="studio-status">{status}</p>}
      <section className="goal-studio"><div><span>PUBLIC ACCOUNTABILITY</span><h2>Set the pressure.</h2><p>Goals become visible immediately. Their progress is backed by the record.</p></div><form onSubmit={addGoal}><input value={goalTitle} onChange={(e)=>setGoalTitle(e.target.value)} placeholder={goalMetric === "checklist" ? "Complete MIT Finance playlist" : goalMetric === "streak" ? "Build every day" : "Read one book this week"} required/><select value={goalMetric} onChange={(e)=>{const metric=e.target.value as Goal["metric"];setGoalMetric(metric);setGoalTarget(metric==="minutes"?10:metric==="streak"?7:1)}}><option value="minutes">Focused hours</option><option value="count">Completed count</option><option value="checklist">Checklist items</option><option value="streak">Daily streak</option></select><label className="goal-target"><span>Target / {goalUnit}</span><input type="number" min="1" value={goalTarget} onChange={(e)=>setGoalTarget(Number(e.target.value))}/></label><button>Create public goal ↗</button></form><aside>{goals.map((goal)=><div key={goal.id} className="goal-row"><div><span>{goal.period} / {goal.metric}</span><strong>{goal.title}</strong></div><button type="button" onClick={()=>removeGoal(goal.id)} className="goal-delete-btn" title="Remove goal">×</button></div>)}</aside></section>
      <section className="today-list"><div className="capture-heading"><span>Private review queue</span><span>{entries.length.toString().padStart(2, "0")} records</span></div>{entries.filter((e) => e.status !== "active").map((entry) => <article key={entry.id} className={entry.status === "interrupted" ? "is-interrupted" : ""}><time>{new Date(entry.startedAt).toLocaleDateString("en", { day: "2-digit", month: "short" })}</time><span className={`category category-${entry.category}`}>{entry.category}</span><div><h3>{entry.title}</h3><p>{entry.status}{entry.plannedMinutes ? ` · ${entry.durationMinutes}/${entry.plannedMinutes}m` : ""}</p></div><strong>{formatMinutes(entry.durationMinutes)}</strong><div className="review-actions"><button onClick={() => publish(entry)}>{entry.isPublic ? "Hide" : "Publish"}</button><button onClick={() => remove(entry.id)}>×</button></div></article>)}</section>
    </div>
  );
}
