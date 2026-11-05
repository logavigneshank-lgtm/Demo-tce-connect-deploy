import { FormEvent, useEffect, useMemo, useState } from "react";
import API_BASE_URL from "@/config/api";
import { authenticatedFetch } from "@/lib/auth";

export type WinnerPosition = "1st Place" | "2nd Place" | "3rd Place";

export interface Winner {
  id: string;
  studentName: string;
  department: string;
  eventName: string;
  position: WinnerPosition;
  achievementDate: string;
  photoUrl?: string;
}

type NewWinner = Omit<Winner, "id">;

interface WinnersDashboardProps {
  mode: "admin" | "student";
  winners?: Winner[];
  onAddWinner?: (winner: NewWinner) => void;
  onDeleteWinner?: (winnerId: string) => void;
}

const positionStyle: Record<WinnerPosition, string> = {
  "1st Place": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "2nd Place": "bg-slate-100 text-slate-700 border-slate-300",
  "3rd Place": "bg-orange-100 text-orange-800 border-orange-300",
};

const positionIcon: Record<WinnerPosition, string> = {
  "1st Place": "🥇",
  "2nd Place": "🥈",
  "3rd Place": "🥉",
};

export default function WinnersDashboard({
  mode,
  winners: suppliedWinners,
  onAddWinner,
  onDeleteWinner,
}: WinnersDashboardProps) {
  // Local state is only a preview fallback. Connect onAddWinner/onDeleteWinner
  // and pass winners from the backend for shared, permanent data.
  const [localWinners, setLocalWinners] = useState<Winner[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const winners = suppliedWinners ?? localWinners;

  const [studentName, setStudentName] = useState("");
  const [department, setDepartment] = useState("");
  const [eventName, setEventName] = useState("");
  const [position, setPosition] = useState<WinnerPosition>("1st Place");
  const [achievementDate, setAchievementDate] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [message, setMessage] = useState("");
  useEffect(() => {
  const loadWinners = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/events/winners`
      );

      if (!response.ok) {
        throw new Error("Failed to load winners");
      }

      const data = await response.json();

      const list = Array.isArray(data)
        ? data
        : data.winners ?? data.data ?? [];

      setLocalWinners(
        list.map((winner: any) => ({
          ...winner,
          id: winner.id ?? winner._id,
        }))
      );
    } catch (error) {
      console.error("Winner loading error:", error);
    }
  };

  if (!suppliedWinners) {
    loadWinners();
  }
}, [suppliedWinners]);

  const visibleWinners = useMemo(() => {
    const term = search.trim().toLowerCase();
    return winners.filter((winner) => {
      const matchesSearch =
        !term ||
        winner.studentName.toLowerCase().includes(term) ||
        winner.eventName.toLowerCase().includes(term) ||
        winner.department.toLowerCase().includes(term);
      const matchesPosition = filter === "All" || winner.position === filter;
      return matchesSearch && matchesPosition;
    });
  }, [winners, search, filter]);

  function handlePhotoChange(file?: File) {
    if (!file) {
      setPhotoUrl("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setMessage("Please choose an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const newWinner: NewWinner = {
      studentName: studentName.trim(),
      department: department.trim(),
      eventName: eventName.trim(),
      position,
      achievementDate,
      photoUrl,
    };

    if (!newWinner.studentName || !newWinner.department || !newWinner.eventName || !achievementDate) {
      setMessage("Please fill in all required fields.");
      return;
    }

    if (onAddWinner) {
      onAddWinner(newWinner);
    } else {
      setLocalWinners((current) => [
        { ...newWinner, id: `${Date.now()}` },
        ...current,
      ]);
    }

    setStudentName("");
    setDepartment("");
    setEventName("");
    setPosition("1st Place");
    setAchievementDate("");
    setPhotoUrl("");
    setMessage("Winner details added.");
  }

  function handleDelete(winnerId: string) {
    if (onDeleteWinner) {
      onDeleteWinner(winnerId);
    } else {
      setLocalWinners((current) => current.filter((winner) => winner.id !== winnerId));
    }
  }

  return (
    <main className="min-h-screen bg-[#fffdfb] px-4 py-8 text-slate-800 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-[#d5ad35]">
            TCE Connect
          </p>
          <h1 className="text-3xl font-extrabold text-[#8d2028] sm:text-4xl">
            {mode === "admin" ? "Winner Management" : "Campus Hall of Fame"}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            {mode === "admin"
              ? "Add and manage student achievements across campus events."
              : "Celebrating the talent, dedication and achievements of TCE students."}
          </p>
          <div className="mx-auto mt-5 h-1 w-20 rounded-full bg-[#e2bf4b]" />
        </header>

        {mode === "admin" && (
          <section className="mb-8 rounded-2xl border border-[#f0dfd8] bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-[#8d2028]">Upload Winner Details</h2>
              <p className="mt-1 text-sm text-slate-500">
                Enter the achievement details. Every winner will appear in the same card format.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Student name *
                <input
                  value={studentName}
                  onChange={(event) => setStudentName(event.target.value)}
                  placeholder="Enter student name"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-[#9a2930]"
                  required
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Department *
                <input
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                  placeholder="e.g. CSE, IT, ECE"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-[#9a2930]"
                  required
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Event name *
                <input
                  value={eventName}
                  onChange={(event) => setEventName(event.target.value)}
                  placeholder="Enter competition or event name"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-[#9a2930]"
                  required
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Position *
                <select
                  value={position}
                  onChange={(event) => setPosition(event.target.value as WinnerPosition)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-[#9a2930]"
                >
                  <option>1st Place</option>
                  <option>2nd Place</option>
                  <option>3rd Place</option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Achievement date *
                <input
                  type="date"
                  value={achievementDate}
                  onChange={(event) => setAchievementDate(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-[#9a2930]"
                  required
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Student photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handlePhotoChange(event.target.files?.[0])}
                  className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </label>

              {photoUrl && (
                <div className="sm:col-span-2">
                  <img src={photoUrl} alt="Selected student" className="h-24 w-24 rounded-xl object-cover" />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                <button
                  type="submit"
                  className="rounded-lg bg-[#8d2028] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#711820]"
                >
                  + Add Winner
                </button>
                {message && <p role="status" className="text-sm text-slate-600">{message}</p>}
              </div>
            </form>
          </section>
        )}

        <section>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#8d2028]">Our Achievers</h2>
              <p className="mt-1 text-sm text-slate-500">{winners.length} winner(s) listed</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, event, department"
                className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#9a2930] sm:w-64"
              />
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#9a2930]"
              >
                <option>All</option>
                <option>1st Place</option>
                <option>2nd Place</option>
                <option>3rd Place</option>
              </select>
            </div>
          </div>

          {visibleWinners.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#e8d4ce] bg-white px-5 py-14 text-center">
              <div className="text-4xl">🏆</div>
              <h3 className="mt-3 font-semibold text-[#8d2028]">No winners published yet</h3>
              <p className="mt-1 text-sm text-slate-500">
                {mode === "admin"
                  ? "Add the first winner using the form above."
                  : "Winner announcements will appear here once published by the admin."}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleWinners.map((winner) => (
                <article key={winner.id} className="overflow-hidden rounded-2xl border border-[#f0dfd8] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                  <div className="flex items-center justify-between bg-gradient-to-r from-[#fff8e7] to-[#fffdfb] px-5 py-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${positionStyle[winner.position]}`}>
                      {positionIcon[winner.position]} {winner.position}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      {winner.achievementDate}
                    </span>
                  </div>
                  <div className="p-5 text-center">
                    {winner.photoUrl ? (
                      <img src={winner.photoUrl} alt={winner.studentName} className="mx-auto h-24 w-24 rounded-full border-4 border-[#fff1d1] object-cover" />
                    ) : (
                      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#fff1d1] bg-[#fff8e7] text-3xl font-bold text-[#8d2028]">
                        {winner.studentName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <h3 className="mt-4 text-lg font-bold text-[#8d2028]">{winner.studentName}</h3>
                    <p className="mt-1 text-sm font-medium text-slate-500">{winner.department}</p>
                    <div className="my-4 h-px bg-[#f3e8e3]" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#c29b27]">Achievement</p>
                    <p className="mt-1 font-semibold text-slate-700">{winner.eventName}</p>
                    {mode === "admin" && (
                      <button
                        type="button"
                        onClick={() => handleDelete(winner.id)}
                        className="mt-4 rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        Delete winner
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
