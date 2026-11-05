import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API_BASE_URL from "@/config/api";
import { Search, Trophy, Trash2, Upload, RefreshCw, CalendarDays, Users, Medal } from "lucide-react";

type Position = "1st Place" | "2nd Place" | "3rd Place";
interface Winner {
  id: string;
  eventId: string;
  studentName: string;
  department: string;
  eventName: string;
  position: Position;
  achievementDate: string;
  photoUrl?: string;
}
interface EventOption { _id: string; title: string; }

const styles: Record<Position, string> = {
  "1st Place": "bg-amber-100 text-amber-800 ring-amber-200",
  "2nd Place": "bg-slate-100 text-slate-700 ring-slate-200",
  "3rd Place": "bg-orange-100 text-orange-800 ring-orange-200",
};
const medals: Record<Position, string> = {
  "1st Place": "🥇", "2nd Place": "🥈", "3rd Place": "🥉",
};

export default function WinnersDashboard({ mode = "student" }: { mode: "admin" | "student" }) {
  const isAdmin = mode === "admin";
  const [winners, setWinners] = useState<Winner[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [eventId, setEventId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [department, setDepartment] = useState("");
  const [eventName, setEventName] = useState("");
  const [position, setPosition] = useState<Position>("1st Place");
  const [achievementDate, setAchievementDate] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const adminHeaders = (): HeadersInit => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const [winnerResponse, eventResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/events/winners`),
        isAdmin ? fetch(`${API_BASE_URL}/events`) : Promise.resolve(null),
      ]);
      if (!winnerResponse.ok) throw new Error("Unable to load winners. Please refresh.");
      const raw = await winnerResponse.json();
      const rows = Array.isArray(raw) ? raw : raw.winners ?? raw.data ?? [];
      setWinners(rows.map((w: any) => ({
        ...w,
        id: String(w.id || w._id),
        eventId: String(w.eventId || ""),
      })));
      if (eventResponse) {
        if (!eventResponse.ok) throw new Error("Unable to load events.");
        const eventRows = await eventResponse.json();
        setEvents(Array.isArray(eventRows) ? eventRows : []);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { void loadData(); }, [loadData]);

  const filteredWinners = useMemo(() => {
    const term = search.trim().toLowerCase();
    return winners.filter((w) => {
      const matches = !term || [w.studentName, w.department, w.eventName].some(v => (v || "").toLowerCase().includes(term));
      return matches && (filter === "All" || w.position === filter);
    });
  }, [winners, search, filter]);

  function choosePhoto(file?: File) {
    setMessage("");
    if (!file) { setPhotoUrl(""); return; }
    if (!file.type.startsWith("image/")) { setMessage("Please select an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { setMessage("Photo must be smaller than 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  async function addWinner(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!eventId) { setMessage("Please select the event."); return; }
    setSaving(true); setMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/admin/winners`, {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({ eventId, studentName: studentName.trim(), department: department.trim(), eventName: eventName.trim(), position, achievementDate, photoUrl }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.message || "Could not save winner. Check admin login.");
      setStudentName(""); setDepartment(""); setEventName(""); setPosition("1st Place");
      setAchievementDate(""); setPhotoUrl("");
      setMessage("Winner published successfully!");
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save winner.");
    } finally { setSaving(false); }
  }

  async function deleteWinner(winner: Winner) {
    if (!window.confirm(`Delete ${winner.studentName}'s winner record?`)) return;
    setMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/admin/winners/${winner.eventId}/${winner.id}`, {
        method: "DELETE", headers: adminHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not delete winner.");
      setWinners(current => current.filter(w => w.id !== winner.id));
      setMessage("Winner deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
    }
  }

  return (
    <main className="min-h-screen bg-[#fffdfb] px-4 py-8 text-slate-800 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col items-center text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-amber-600">TCE Connect</p>
          <h1 className="text-3xl font-black text-[#8d2028] sm:text-4xl">{isAdmin ? "Winner Management" : "Campus Hall of Fame"}</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-500 sm:text-base">
            {isAdmin ? "Publish and manage student achievements across campus events." : "Celebrating the talent, dedication and achievements of TCE students."}
          </p>
          <div className="mt-5 h-1 w-20 rounded-full bg-amber-400" />
          {isAdmin && <Link to="/admin/dashboard" className="mt-4 text-sm font-semibold text-[#8d2028] hover:underline">← Back to Admin Dashboard</Link>}
        </header>

        {isAdmin && (
          <section className="mb-9 rounded-2xl border border-rose-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-3 text-amber-700"><Trophy /></div>
              <div><h2 className="text-xl font-bold text-[#8d2028]">Upload Winner Details</h2><p className="text-sm text-slate-500">Saved winners will appear below and on the student page.</p></div>
            </div>
            <form onSubmit={addWinner} className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">Select event *
                <select value={eventId} onChange={e => { setEventId(e.target.value); const ev = events.find(x => x._id === e.target.value); setEventName(ev?.title || ""); }} required className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 font-normal">
                  <option value="">Choose an existing event</option>
                  {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Student name *
                <input value={studentName} onChange={e => setStudentName(e.target.value)} required placeholder="Enter student name" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-3 font-normal" />
              </label>
              <label className="text-sm font-semibold">Department *
                <input value={department} onChange={e => setDepartment(e.target.value)} required placeholder="e.g. CSE, IT, ECE" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-3 font-normal" />
              </label>
              <label className="text-sm font-semibold">Event / achievement name *
                <input value={eventName} onChange={e => setEventName(e.target.value)} required placeholder="Competition or event name" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-3 font-normal" />
              </label>
              <label className="text-sm font-semibold">Position *
                <select value={position} onChange={e => setPosition(e.target.value as Position)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 font-normal">
                  <option>1st Place</option><option>2nd Place</option><option>3rd Place</option>
                </select>
              </label>
              <label className="text-sm font-semibold">Achievement date *
                <input type="date" value={achievementDate} onChange={e => setAchievementDate(e.target.value)} required className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-3 font-normal" />
              </label>
              <label className="text-sm font-semibold">Student photo (optional)
                <input type="file" accept="image/*" onChange={e => choosePhoto(e.target.files?.[0])} className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal" />
              </label>
              {photoUrl && <div className="flex items-center gap-3"><img src={photoUrl} alt="Photo preview" className="h-16 w-16 rounded-full object-cover" /><button type="button" onClick={() => setPhotoUrl("")} className="text-sm text-red-600">Remove photo</button></div>}
              <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                <button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-lg bg-[#8d2028] px-6 py-3 font-semibold text-white hover:bg-[#711820] disabled:opacity-60"><Upload size={17} />{saving ? "Publishing..." : "Add Winner"}</button>
                {message && <p role="status" className="text-sm text-slate-600">{message}</p>}
              </div>
            </form>
          </section>
        )}

        <section>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 className="text-xl font-bold text-[#8d2028]">Our Achievers</h2><p className="mt-1 text-sm text-slate-500">{winners.length} winner(s) published</p></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search winners..." className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm sm:w-64" /></div>
              <select value={filter} onChange={e => setFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"><option>All</option><option>1st Place</option><option>2nd Place</option><option>3rd Place</option></select>
              <button onClick={() => void loadData()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><RefreshCw size={15} /> Refresh</button>
            </div>
          </div>
          {message && !isAdmin && <p role="status" className="mb-4 text-sm text-slate-600">{message}</p>}
          {loading ? <div className="py-16 text-center text-slate-500">Loading winners...</div> :
            filteredWinners.length === 0 ? <div className="rounded-2xl border border-dashed border-rose-200 bg-white px-5 py-16 text-center"><div className="text-5xl">🏆</div><h3 className="mt-3 font-bold text-[#8d2028]">No winners published yet</h3><p className="mt-1 text-sm text-slate-500">{search || filter !== "All" ? "Try another search or filter." : "Winner announcements will appear here once published by the admin."}</p></div> :
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredWinners.map(w => <article key={w.id} className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-white px-5 py-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${styles[w.position] || styles["1st Place"]}`}>{medals[w.position] || "🏅"} {w.position}</span><span className="text-xs text-slate-500">{w.achievementDate ? new Date(w.achievementDate).toLocaleDateString() : ""}</span></div>
                <div className="p-6 text-center">
                  {w.photoUrl ? <img src={w.photoUrl} alt={w.studentName} className="mx-auto h-24 w-24 rounded-full border-4 border-amber-100 object-cover" /> : <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-amber-100 bg-amber-50 text-3xl font-black text-[#8d2028]">{(w.studentName || "?").slice(0,1).toUpperCase()}</div>}
                  <h3 className="mt-4 text-lg font-bold text-[#8d2028]">{w.studentName}</h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">{w.department}</p>
                  <div className="my-4 h-px bg-rose-50" />
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Achievement</p><p className="mt-1 font-semibold text-slate-700">{w.eventName}</p>
                  {isAdmin && <button onClick={() => void deleteWinner(w)} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"><Trash2 size={14} /> Delete winner</button>}
                </div>
              </article>)}
            </div>}
        </section>
        <footer className="mt-12 flex items-center justify-center gap-5 border-t border-rose-100 pt-5 text-xs text-slate-400"><span className="inline-flex items-center gap-1"><Medal size={14}/> TCE Connect</span><span className="inline-flex items-center gap-1"><CalendarDays size={14}/> Student Achievements</span><span className="inline-flex items-center gap-1"><Users size={14}/> Campus Community</span></footer>
      </div>
    </main>
  );
}
