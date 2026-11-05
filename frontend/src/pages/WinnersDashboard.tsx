import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Award, RefreshCw, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import API_BASE_URL from "@/config/api";
import { authenticatedFetch } from "@/lib/auth";

 type WinnerPosition = "1st Place" | "2nd Place" | "3rd Place";
 interface Winner {
  _id: string;
  studentName: string;
  department: string;
  eventName: string;
  position: WinnerPosition;
  achievementDate?: string;
  photoUrl?: string;
  eventId?: string;
 }
 interface EventData {
  _id: string;
  title: string;
  winners?: Winner[];
 }
 interface Props { mode: "organizer" | "public"; }

const positionStyles: Record<WinnerPosition, string> = {
  "1st Place": "bg-amber-100 text-amber-800",
  "2nd Place": "bg-slate-100 text-slate-700",
  "3rd Place": "bg-orange-100 text-orange-800",
};
const positionEmojis: Record<WinnerPosition, string> = {
  "1st Place": "🥇", "2nd Place": "🥈", "3rd Place": "🥉",
};

export default function WinnersDashboard({ mode }: Props) {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventData | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [department, setDepartment] = useState("");
  const [eventName, setEventName] = useState("");
  const [position, setPosition] = useState<WinnerPosition>("1st Place");
  const [achievementDate, setAchievementDate] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (mode === "public") {
        const response = await fetch(`${API_BASE_URL}/events/winners`);
        if (!response.ok) throw new Error("Could not load winners");
        const data = await response.json();
        setWinners(Array.isArray(data) ? data : data.winners ?? []);
      } else if (eventId) {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`);
        if (!response.ok) throw new Error("Could not load this event");
        const data: EventData = await response.json();
        setEvent(data);
        setEventName(data.title);
        setWinners(data.winners ?? []);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load winners");
    } finally {
      setLoading(false);
    }
  }, [eventId, mode]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddWinner = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!eventId) return;
    setSaving(true);
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/events/${eventId}/winners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName: studentName.trim(), department: department.trim(), eventName: eventName.trim() || event?.title || "", position, achievementDate, photoUrl: photoUrl.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || result.message || "Unable to add winner");
      toast.success("Winner added successfully");
      setStudentName(""); setDepartment(""); setPosition("1st Place"); setAchievementDate(""); setPhotoUrl("");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add winner");
    } finally { setSaving(false); }
  };

  const handleDelete = async (winnerId: string) => {
    if (!eventId || !window.confirm("Delete this winner entry?")) return;
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/events/${eventId}/winners/${winnerId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to delete winner");
      setWinners(current => current.filter(winner => winner._id !== winnerId));
      toast.success("Winner deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete winner");
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdfb]">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link to={mode === "public" ? "/events" : "/organizer-dashboard"} className="inline-flex items-center gap-2 text-sm font-semibold text-[#8d2028] hover:underline">
            <ArrowLeft className="h-4 w-4" /> {mode === "public" ? "Back to events" : "Back to dashboard"}
          </Link>
          <button onClick={loadData} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><RefreshCw className="h-4 w-4" /> Refresh</button>
        </div>

        <header className="mb-7 rounded-2xl bg-white p-6 shadow-sm border border-[#f0dfd8]">
          <div className="flex items-center gap-3 text-[#8d2028]"><Trophy className="h-8 w-8" /><div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c29b27]">TCE Connect</p>
            <h1 className="text-2xl font-extrabold sm:text-3xl">{mode === "public" ? "Campus Winners" : "Manage Event Winners"}</h1>
          </div></div>
          <p className="mt-2 text-sm text-slate-500">{mode === "public" ? "Celebrating student achievements across TCE events." : `Add and manage winners for ${event?.title ?? "your event"}.`}</p>
        </header>

        {mode === "organizer" && (
          <section className="mb-8 rounded-2xl border border-[#f0dfd8] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 text-xl font-bold text-[#8d2028]">Add Winner Details</h2>
            <form onSubmit={handleAddWinner} className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">Student name *<input required value={studentName} onChange={e => setStudentName(e.target.value)} className="mt-1 block w-full rounded-lg border p-3" placeholder="Winner's full name" /></label>
              <label className="text-sm font-medium">Department *<input required value={department} onChange={e => setDepartment(e.target.value)} className="mt-1 block w-full rounded-lg border p-3" placeholder="e.g. CSE, ECE" /></label>
              <label className="text-sm font-medium">Event name *<input required value={eventName} onChange={e => setEventName(e.target.value)} className="mt-1 block w-full rounded-lg border p-3" /></label>
              <label className="text-sm font-medium">Position *<select value={position} onChange={e => setPosition(e.target.value as WinnerPosition)} className="mt-1 block w-full rounded-lg border bg-white p-3"><option>1st Place</option><option>2nd Place</option><option>3rd Place</option></select></label>
              <label className="text-sm font-medium">Achievement date<input type="date" value={achievementDate} onChange={e => setAchievementDate(e.target.value)} className="mt-1 block w-full rounded-lg border p-3" /></label>
              <label className="text-sm font-medium">Photo URL (optional)<input type="url" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} className="mt-1 block w-full rounded-lg border p-3" placeholder="https://..." /></label>
              <div className="sm:col-span-2"><button disabled={saving || !eventId} className="rounded-lg bg-[#8d2028] px-5 py-3 font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : "Add Winner"}</button></div>
            </form>
          </section>
        )}

        <section>
          <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-[#8d2028]">{mode === "public" ? "Our Achievers" : "Winners for this event"}</h2><span className="text-sm text-slate-500">{winners.length} winner(s)</span></div>
          {loading ? <div className="rounded-xl bg-white p-10 text-center text-slate-500">Loading winners...</div> : winners.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-white p-10 text-center"><Award className="mx-auto h-10 w-10 text-[#c29b27]" /><h3 className="mt-3 font-semibold text-[#8d2028]">No winners added yet</h3><p className="mt-1 text-sm text-slate-500">Winner details will appear here after the organizer publishes them.</p></div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {winners.map((winner, index) => <article key={winner._id || `${winner.studentName}-${index}`} className="flex flex-col gap-4 rounded-2xl border border-[#f0dfd8] bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#fff4dc] text-2xl font-bold text-[#8d2028]">{winner.photoUrl ? <img src={winner.photoUrl} alt={winner.studentName} className="h-full w-full object-cover" /> : winner.studentName?.charAt(0)?.toUpperCase() || "🏆"}</div>
                <div className="min-w-0 flex-1"><div className="mb-1 flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold ${positionStyles[winner.position] || "bg-slate-100"}`}>{positionEmojis[winner.position] || "🏆"} {winner.position}</span>{winner.achievementDate && <span className="text-xs text-slate-500">{winner.achievementDate}</span>}</div><h3 className="text-lg font-bold text-[#8d2028]">{winner.studentName}</h3><p className="text-sm text-slate-500">{winner.department}</p><p className="mt-1 text-sm font-semibold text-slate-700">{winner.eventName}</p></div>
                {mode === "organizer" && <button onClick={() => handleDelete(winner._id)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Delete</button>}
              </article>)}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
