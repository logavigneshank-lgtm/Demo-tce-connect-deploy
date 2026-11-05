import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Users, Plus, Edit, Trash2, BarChart3, Eye, Mail, User, Trophy } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import API_BASE_URL from "@/config/api";

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("tce_user_email");
  const token = localStorage.getItem("tce_token");
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [department, setDepartment] = useState("");
  const [type, setType] = useState("technical");
  const [club, setClub] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("100");

  // Fetch organizer's events
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/events`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const userId = localStorage.getItem("tce_user_id");
        const myEvents = data.filter((event: any) => 
          event.organizer?._id === userId || event.organizer === userId
        );
        setEvents(myEvents);
        setLoading(false);
      })
      .catch((err) => {
        toast.error("Failed to load events", {
          description: err.message || "Please try refreshing the page.",
        });
        setLoading(false);
      });
  }, [token]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Authentication required", {
        description: "Please login to create events.",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title, 
          description, 
          date,
          time,
          venue,
          department,
          type,
          club,
          maxParticipants: parseInt(maxParticipants) || 100
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create event");
      }

      // Clear form and refresh events
      setTitle("");
      setDescription("");
      setDate("");
      setTime("");
      setVenue("");
      setDepartment("");
      setType("technical");
      setClub("");
      setMaxParticipants("100");
      setShowCreateEvent(false);
      
      // Show success toast
      toast.success("Event created successfully!", {
        description: `${title} has been created.`,
      });
      
      // Refresh events list
      const eventsRes = await fetch(`${API_BASE_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const eventsData = await eventsRes.json();
      const userId = localStorage.getItem("tce_user_id");
      const myEvents = eventsData.filter((event: any) => 
        event.organizer?._id === userId || event.organizer === userId
      );
      setEvents(myEvents);
    } catch (err: any) {
      toast.error("Failed to create event", {
        description: err.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingEvent) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/events/${editingEvent._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title, 
          description, 
          date,
          time,
          venue,
          department,
          type,
          club,
          maxParticipants: parseInt(maxParticipants) || 100
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update event");
      }

      // Clear form and refresh events
      setTitle("");
      setDescription("");
      setDate("");
      setTime("");
      setVenue("");
      setDepartment("");
      setType("technical");
      setClub("");
      setMaxParticipants("100");
      setShowEditEvent(false);
      setEditingEvent(null);
      
      // Show success toast
      toast.success("Event updated successfully!", {
        description: "Your changes have been saved.",
      });
      
      // Refresh events list
      const eventsRes = await fetch(`${API_BASE_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const eventsData = await eventsRes.json();
      const userId = localStorage.getItem("tce_user_id");
      const myEvents = eventsData.filter((event: any) => 
        event.organizer?._id === userId || event.organizer === userId
      );
      setEvents(myEvents);
    } catch (err: any) {
      toast.error("Failed to update event", {
        description: err.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete event");
      }

      // Remove event from list
      setEvents(events.filter(event => event._id !== eventId));
      
      // Show success toast
      toast.success("Event deleted successfully", {
        description: "The event has been removed.",
      });
    } catch (err: any) {
      toast.error("Failed to delete event", {
        description: err.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditForm = (event: any) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description);
    setDate(event.date.split('T')[0]); // Format date for input
    setTime(event.time || "");
    setVenue(event.venue || "");
    setDepartment(event.department || "");
    setType(event.type || "technical");
    setClub(event.club || "");
    setMaxParticipants(event.maxParticipants?.toString() || "100");
    setShowEditEvent(true);
    setShowCreateEvent(false);
  };

  const openParticipantsList = (event: any) => {
    setSelectedEvent(event);
    setShowParticipants(true);
  };

  const calculateStats = () => {
    const activeEvents = events.filter(e => new Date(e.date) >= new Date()).length;
    const pastEvents = events.filter(e => new Date(e.date) < new Date()).length;
    const totalRegistrations = events.reduce((sum, e) => sum + (e.participants?.length || 0), 0);
    return { activeEvents, pastEvents, totalRegistrations };
  };

  const stats = calculateStats();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white border-b border-border p-4 lg:p-6 animate-fade-in shadow-md">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Event Organizer Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back, {userEmail}
            </p>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-6">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeEvents}</p>
                  <p className="text-sm text-muted-foreground">Active Events</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalRegistrations}</p>
                  <p className="text-sm text-muted-foreground">Total Registrations</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pastEvents}</p>
                  <p className="text-sm text-muted-foreground">Past Events</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Create Event Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Events</h2>
            <Button
              onClick={() => setShowCreateEvent(!showCreateEvent)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create New Event
            </Button>
          </div>

          {/* Create Event Form */}
          {showCreateEvent && (
            <Card className="p-6 animate-slide-up">
              <h3 className="text-lg font-semibold mb-4">Create New Event</h3>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="eventTitle">Event Title</Label>
                  <Input
                    id="eventTitle"
                    placeholder="Enter event title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventDate">Event Date</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventTime">Event Time</Label>
                  <Input
                    id="eventTime"
                    type="time"
                    placeholder="e.g., 10:00 AM"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventVenue">Venue</Label>
                  <Input
                    id="eventVenue"
                    placeholder="Enter venue location"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventDepartment">Department</Label>
                  <Input
                    id="eventDepartment"
                    placeholder="e.g., Computer Science, Cultural Committee"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventType">Event Type</Label>
                  <select
                    id="eventType"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-10 border border-border rounded-md px-3 bg-background"
                  >
                    <option value="technical">Technical</option>
                    <option value="cultural">Cultural</option>
                    <option value="sports">Sports</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventClub">Club/Organization</Label>
                  <Input
                    id="eventClub"
                    placeholder="e.g., Coding Club, Dance Club"
                    value={club}
                    onChange={(e) => setClub(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxParticipants">Maximum Participants</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    min="1"
                    placeholder="e.g., 100"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventDescription">Description</Label>
                  <Textarea
                    id="eventDescription"
                    placeholder="Enter event description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "Creating..." : "Create Event"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateEvent(false);
                      setTitle("");
                      setDescription("");
                      setDate("");
                      setTime("");
                      setVenue("");
                      setDepartment("");
                      setType("technical");
                      setClub("");
                      setMaxParticipants("100");
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Edit Event Form */}
          {showEditEvent && editingEvent && (
            <Card className="p-6 animate-slide-up">
              <h3 className="text-lg font-semibold mb-4">Edit Event</h3>
              <form onSubmit={handleEditEvent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editEventTitle">Event Title</Label>
                  <Input
                    id="editEventTitle"
                    placeholder="Enter event title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editEventDate">Event Date</Label>
                  <Input
                    id="editEventDate"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editEventTime">Event Time</Label>
                  <Input
                    id="editEventTime"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editEventVenue">Venue</Label>
                  <Input
                    id="editEventVenue"
                    placeholder="Enter venue location"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editEventDepartment">Department</Label>
                  <Input
                    id="editEventDepartment"
                    placeholder="e.g., Computer Science, Cultural Committee"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editEventType">Event Type</Label>
                  <select
                    id="editEventType"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-10 border border-border rounded-md px-3 bg-background"
                  >
                    <option value="technical">Technical</option>
                    <option value="cultural">Cultural</option>
                    <option value="sports">Sports</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editEventClub">Club</Label>
                  <Input
                    id="editEventClub"
                    placeholder="e.g., Coding Club"
                    value={club}
                    onChange={(e) => setClub(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editMaxParticipants">Maximum Participants</Label>
                  <Input
                    id="editMaxParticipants"
                    type="number"
                    min="1"
                    placeholder="100"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editEventDescription">Description</Label>
                  <Textarea
                    id="editEventDescription"
                    placeholder="Enter event description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "Updating..." : "Update Event"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditEvent(false);
                      setEditingEvent(null);
                      setTitle("");
                      setDescription("");
                      setDate("");
                      setVenue("");
                      setDepartment("");
                      setType("technical");
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Events List */}
          <div className="grid grid-cols-1 gap-4">
            {events.map((event) => {
              const isPastEvent = new Date(event.date) < new Date();
              const participantCount = event.participants?.length || 0;
              
              return (
                <Card key={event._id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {event.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {participantCount} {participantCount === 1 ? 'registration' : 'registrations'}
                        </div>
                        {event.venue && (
                          <div className="text-xs">
                            📍 {event.venue}
                          </div>
                        )}
                        <span 
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            isPastEvent 
                              ? 'bg-gray-100 text-gray-700' 
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {isPastEvent ? 'Past' : 'Active'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/organizer/events/${event._id}/winners`)}
                        disabled={loading}
                        title="Manage winners for this event"
                      >
                        <Trophy className="h-4 w-4 mr-1" /> Winners
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => openParticipantsList(event)}
                        disabled={loading}
                        title="View participants"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => openEditForm(event)}
                        disabled={loading}
                        title="Edit event"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleDeleteEvent(event._id)}
                        disabled={loading}
                        title="Delete event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {events.length === 0 && (
            <Card className="p-12 text-center">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No Events Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first event to get started
              </p>
              <Button onClick={() => setShowCreateEvent(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Participants Dialog */}
      <Dialog open={showParticipants} onOpenChange={setShowParticipants}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Registered Participants</DialogTitle>
            <DialogDescription>
              {selectedEvent?.title} - {selectedEvent?.participants?.length || 0} {selectedEvent?.participants?.length === 1 ? 'participant' : 'participants'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-6 space-y-4">
            {selectedEvent?.participants?.length > 0 ? (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Card className="p-4 bg-blue-50">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {selectedEvent.participants.length}
                        </p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 bg-green-50">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Event Date</p>
                        <p className="text-sm font-semibold text-green-600">
                          {new Date(selectedEvent.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 bg-purple-50">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <p className="text-sm font-semibold text-purple-600 capitalize">
                          {selectedEvent.type || 'General'}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Participants List */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg mb-3">Participant List</h4>
                  {selectedEvent.participants.map((participant: any, index: number) => (
                    <Card key={participant._id || index} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <p className="font-semibold text-base">
                                {participant.name || 'No name'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                {participant.email || 'No email'}
                              </p>
                            </div>
                            {participant.role && (
                              <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                {participant.role}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Export Options */}
                <div className="mt-6 pt-6 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // Create CSV content
                      const csvContent = [
                        ['No.', 'Name', 'Email', 'Role'],
                        ...selectedEvent.participants.map((p: any, i: number) => [
                          i + 1,
                          p.name || '',
                          p.email || '',
                          p.role || ''
                        ])
                      ].map(row => row.join(',')).join('\n');
                      
                      // Download CSV
                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedEvent.title.replace(/\s+/g, '_')}_participants.csv`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                      
                      toast.success("Participants list exported", {
                        description: "CSV file has been downloaded.",
                      });
                    }}
                  >
                    Export to CSV
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No Participants Yet</h3>
                <p className="text-muted-foreground">
                  No one has registered for this event yet.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
