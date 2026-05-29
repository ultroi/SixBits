import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Sparkles,
  GraduationCap,
  Award,
  Users,
  FileText,
  Flame,
  TrendingUp
} from 'lucide-react';

import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { timelineService } from '../services/api';

const TimelineManager = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    priority: '',
    status: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'admission',
    date: '',
    priority: 'medium'
  });

  useEffect(() => {
      const fetchTimeline = async () => {
        if (!user?._id) {
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          setError(null);
          const data = await timelineService.getTimeline(user._id);
          setEvents(data);
          setFilteredEvents(data);
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to load timeline');
          toast.error('Failed to load timeline events');
          console.error('Timeline fetch error:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchTimeline();
    }, [user?._id]);
  useEffect(() => {
    let filtered = events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !filters.type || event.type === filters.type;
      const matchesPriority = !filters.priority || event.priority === filters.priority;
      const matchesStatus = !filters.status ||
        (filters.status === 'completed' && event.isCompleted) ||
        (filters.status === 'pending' && !event.isCompleted);

      return matchesSearch && matchesType && matchesPriority && matchesStatus;
    });

    // Sort by date
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

    setFilteredEvents(filtered);
  }, [events, searchTerm, filters]);

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date) {
      toast.warning('Please fill in title and date');
      return;
    }

    try {
      setSubmitting(true);
      const eventData = {
        ...newEvent,
        userId: user._id,
        date: new Date(newEvent.date)
      };
      const createdEvent = await timelineService.createTimelineEntry(eventData);
      setEvents(prev => [...prev, createdEvent]);
      setNewEvent({
        title: '',
        description: '',
        type: 'admission',
        date: '',
        priority: 'medium'
      });
      setShowAddForm(false);
      toast.success('Event created successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
      console.error('Create event error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleComplete = async (eventId) => {
    try {
      const event = events.find(e => e._id === eventId || e.id === eventId);
      if (!event) return;

      const updatedEvent = await timelineService.updateTimelineEntry(event._id || eventId, {
        isCompleted: !event.isCompleted
      });

      setEvents(prev => prev.map(e =>
        (e._id === eventId || e.id === eventId) ? updatedEvent : e
      ));
      toast.success(updatedEvent.isCompleted ? 'Event marked complete' : 'Event marked pending');
    } catch (err) {
      toast.error('Failed to update event');
      console.error('Update event error:', err);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const event = events.find(e => e._id === eventId || e.id === eventId);
      if (!event) return;

      await timelineService.deleteTimelineEntry(event._id || eventId);
      setEvents(prev => prev.filter(e => e._id !== eventId && e.id !== eventId));
      if (selectedEvent && (selectedEvent._id === eventId || selectedEvent.id === eventId)) {
        setSelectedEvent(null);
      }
      toast.success('Event deleted successfully');
    } catch (err) {
      toast.error('Failed to delete event');
      console.error('Delete event error:', err);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntil = (dateString) => {
    const today = new Date();
    const eventDate = new Date(dateString);
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'exam': return <Flame className="w-5 h-5 text-orange-500" />;
      case 'admission': return <GraduationCap className="w-5 h-5 text-blue-500" />;
      case 'scholarship': return <Award className="w-5 h-5 text-yellow-500" />;
      case 'counseling': return <Users className="w-5 h-5 text-emerald-500" />;
      case 'deadline': return <Clock className="w-5 h-5 text-red-500" />;
      default: return <FileText className="w-5 h-5 text-indigo-500" />;
    }
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'exam': return 'from-orange-50 to-red-50 border-orange-200';
      case 'admission': return 'from-blue-50 to-cyan-50 border-blue-200';
      case 'scholarship': return 'from-yellow-50 to-amber-50 border-yellow-200';
      case 'counseling': return 'from-emerald-50 to-teal-50 border-emerald-200';
      case 'deadline': return 'from-red-50 to-pink-50 border-red-200';
      default: return 'from-indigo-50 to-purple-50 border-indigo-200';
    }
  };

  const getEventTypeBadgeColor = (type) => {
    switch (type) {
      case 'exam': return 'bg-orange-100 text-orange-700';
      case 'admission': return 'bg-blue-100 text-blue-700';
      case 'scholarship': return 'bg-yellow-100 text-yellow-700';
      case 'counseling': return 'bg-emerald-100 text-emerald-700';
      case 'deadline': return 'bg-red-100 text-red-700';
      default: return 'bg-indigo-100 text-indigo-700';
    }
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700'
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  const upcomingEvents = filteredEvents.filter(event => !event.isCompleted && getDaysUntil(event.date) >= 0);
  const pastEvents = filteredEvents.filter(event => event.isCompleted || getDaysUntil(event.date) < 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-xl border-b-2 border-indigo-200/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 hover:scale-105 transition-transform duration-200 p-2 rounded-xl hover:bg-indigo-100"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Zariya</span>
              </button>
              <div className="hidden md:block h-8 w-px bg-indigo-300"></div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Timeline Manager
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative hidden sm:block">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-5 py-2.5 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all bg-indigo-50/50 focus:bg-white"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 rounded-xl transition-all font-medium text-gray-700"
              >
                <Filter className="w-5 h-5 mr-2" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl flex items-center font-bold transition-all shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Event
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800 text-lg">×</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin">
              <Calendar className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="ml-4 text-gray-600">Loading timeline events...</p>
          </div>
        ) : (
          <>
            {showFilters && (
              <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <select value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                  <option value="">All Types</option>
                  <option value="exam">Exam</option>
                  <option value="admission">Admission</option>
                  <option value="scholarship">Scholarship</option>
                  <option value="counseling">Counseling</option>
                  <option value="deadline">Deadline</option>
                </select>

                <select value={filters.priority} onChange={(e) => handleFilterChange('priority', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                  <option value="">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>

                <button onClick={() => setFilters({ type: '', priority: '', status: '' })} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                  Clear Filters
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-indigo-600" />
                    Upcoming Events
                  </h2>
                  <div className="space-y-4">
                    {upcomingEvents.map((event, idx) => {
                      const daysUntil = getDaysUntil(event.date);
                      const isUrgent = daysUntil <= 3;
                      const isWarning = daysUntil <= 7;
                      return (
                        <div
                          key={event._id || event.id}
                          className={`group bg-gradient-to-r ${getEventTypeColor(event.type)} border-2 rounded-xl p-5 cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden`}
                          onClick={() => setSelectedEvent(event)}
                        >
                          {/* Animated gradient background */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-r from-indigo-400 to-purple-400 transition-opacity duration-300"></div>
                          
                          <div className="relative z-10 flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              <div className={`p-3 rounded-xl bg-white/60 backdrop-blur-sm shadow-sm group-hover:shadow-md transition-all duration-300`}>
                                {getEventTypeIcon(event.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-3 mb-2 flex-wrap gap-2">
                                  <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-700 transition-colors">{event.title}</h3>
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadge(event.priority)} whitespace-nowrap`}>{event.priority}</span>
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEventTypeBadgeColor(event.type)} whitespace-nowrap capitalize`}>{event.type}</span>
                                </div>
                                <p className="text-sm text-gray-700 mb-3 line-clamp-2 group-hover:text-gray-800">{event.description}</p>
                                <div className="flex items-center space-x-6 text-sm flex-wrap gap-2">
                                  <div className="flex items-center text-gray-600 group-hover:text-gray-900">
                                    <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                                    <span className="font-medium">{formatDate(event.date)}</span>
                                  </div>
                                  <div className={`flex items-center font-bold whitespace-nowrap ${isUrgent ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'}`}>
                                    <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                                    {daysUntil === 0 ? '🔥 Today!' : daysUntil === 1 ? '⚡ Tomorrow' : `${daysUntil} days left`}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleComplete(event._id || event.id);
                                }}
                                className={`p-2 rounded-lg transition-all duration-300 ${event.isCompleted ? 'bg-green-100 text-green-600 shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'}`}
                                title={event.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEvent(event._id || event.id);
                                }}
                                className="p-2 rounded-lg bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600 transition-all duration-300"
                                title="Delete event"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {upcomingEvents.length === 0 && (
                      <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">No upcoming events</p>
                        <p className="text-gray-500 text-sm mt-1">Add one to get started!</p>
                      </div>
                    )}
                  </div>
                </div>

                {pastEvents.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      Past Events
                    </h2>
                    <div className="space-y-4">
                      {pastEvents.map(event => (
                        <div
                          key={event._id || event.id}
                          className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl p-5 cursor-pointer hover:shadow-lg hover:border-gray-400 transition-all duration-300 hover:-translate-y-1 relative group"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              <div className="p-3 rounded-xl bg-white/60 backdrop-blur-sm shadow-sm group-hover:shadow-md transition-all duration-300 opacity-60">
                                {getEventTypeIcon(event.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-3 mb-2 flex-wrap gap-2">
                                  <h3 className="font-bold text-gray-700 group-hover:text-gray-900 line-through opacity-75">{event.title}</h3>
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadge(event.priority)}`}>{event.priority}</span>
                                  {event.isCompleted && <CheckCircle className="w-4 h-4 text-green-600" />}
                                </div>
                                <p className="text-sm text-gray-600 mb-3 opacity-75">{event.description}</p>
                                <div className="flex items-center text-sm text-gray-500">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  {formatDate(event.date)}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(event._id || event.id);
                              }}
                              className="p-2 rounded-lg bg-gray-200 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-all duration-300 flex-shrink-0 ml-4"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-1">
                {selectedEvent ? (
                  <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl shadow-2xl border-2 border-indigo-200/50 p-6 sticky top-6 hover:shadow-3xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Event Details</h3>
                      <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg">
                        <span className="text-2xl font-bold">×</span>
                      </button>
                    </div>

                    <div className="space-y-5">
                      <div className="bg-white rounded-xl p-4 border-2 border-indigo-100/50">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100">
                            {getEventTypeIcon(selectedEvent.type)}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg">{selectedEvent.title}</h4>
                            <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">{selectedEvent.type}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 border-2 border-gray-100">
                        <p className="text-gray-700 leading-relaxed">{selectedEvent.description}</p>
                      </div>

                      <div className="space-y-3 bg-white rounded-xl p-4 border-2 border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 font-medium flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            Date
                          </span>
                          <span className="text-gray-900 font-bold">{formatDate(selectedEvent.date)}</span>
                        </div>
                        <div className="border-t border-gray-100"></div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 font-medium flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                            Time Left
                          </span>
                          <span className={`font-bold ${getDaysUntil(selectedEvent.date) <= 3 ? 'text-red-600' : getDaysUntil(selectedEvent.date) <= 7 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {getDaysUntil(selectedEvent.date) >= 0 ? `${getDaysUntil(selectedEvent.date)} days` : `${Math.abs(getDaysUntil(selectedEvent.date))} days ago`}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-3 border-2 border-purple-100">
                          <p className="text-xs text-gray-600 font-medium mb-1">Priority</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getPriorityBadge(selectedEvent.priority)}`}>{selectedEvent.priority.toUpperCase()}</span>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 border-2 border-blue-100">
                          <p className="text-xs text-gray-600 font-medium mb-1">Status</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${selectedEvent.isCompleted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {selectedEvent.isCompleted ? '✓ Done' : 'Pending'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t-2 border-gray-200">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleToggleComplete(selectedEvent._id || selectedEvent.id)}
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${selectedEvent.isCompleted ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/30'}`}
                          >
                            {selectedEvent.isCompleted ? '↺ Mark Pending' : '✓ Mark Complete'}
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(selectedEvent._id || selectedEvent.id)}
                            className="px-4 py-3 bg-gradient-to-r from-red-100 to-pink-100 text-red-600 hover:from-red-200 hover:to-pink-200 rounded-xl font-bold transition-all duration-300"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : showAddForm ? (
                  <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl shadow-2xl border-2 border-indigo-200/50 p-6 sticky top-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                        <Plus className="w-6 h-6 text-indigo-600" />
                        Add New Event
                      </h3>
                      <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg">
                        <span className="text-2xl font-bold">×</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Event Title</label>
                        <input
                          type="text"
                          value={newEvent.title}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all"
                          placeholder="e.g., JEE Exam"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Description</label>
                        <textarea
                          value={newEvent.description}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all"
                          rows="3"
                          placeholder="Add any important details..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Event Type</label>
                        <select
                          value={newEvent.type}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all"
                        >
                          <option value="admission">📚 Admission</option>
                          <option value="exam">🔥 Exam</option>
                          <option value="scholarship">🏆 Scholarship</option>
                          <option value="counseling">👥 Counseling</option>
                          <option value="deadline">⏰ Deadline</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Date</label>
                        <input
                          type="date"
                          value={newEvent.date}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Priority Level</label>
                        <select
                          value={newEvent.priority}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, priority: e.target.value }))}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all"
                        >
                          <option value="low">🟢 Low Priority</option>
                          <option value="medium">🟡 Medium Priority</option>
                          <option value="high">🔴 High Priority</option>
                        </select>
                      </div>

                      <div className="flex space-x-3 pt-2">
                        <button
                          onClick={handleAddEvent}
                          disabled={submitting}
                          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-indigo-400 disabled:to-purple-400 text-white py-3 px-4 rounded-xl font-bold transition-all disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        >
                          {submitting ? '⏳ Creating...' : '✨ Add Event'}
                        </button>
                        <button
                          onClick={() => setShowAddForm(false)}
                          className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 text-center border-2 border-dashed border-indigo-300 hover:border-indigo-400 transition-all sticky top-6">
                    <Calendar className="w-16 h-16 text-indigo-400 mx-auto mb-4 opacity-60" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Select an Event</h3>
                    <p className="text-gray-600 text-sm">Click on any event from the list to view details and manage it.</p>
                    <p className="text-gray-500 text-xs mt-4 font-medium">📌 Or create a new event to get started</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TimelineManager;