import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Sparkles
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
      case 'exam': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'admission': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'scholarship': return <Bell className="w-5 h-5 text-yellow-500" />;
      case 'counseling': return <Info className="w-5 h-5 text-blue-500" />;
      case 'deadline': return <Clock className="w-5 h-5 text-purple-500" />;
      default: return <Calendar className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 hover:scale-105 transition-transform duration-200"
              >
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                  <Sparkles className="w-6 h-6 text-white animate-pulse" />
                </div>
                <span className="text-lg font-semibold text-gray-800 hover:text-indigo-600 transition-colors">Zariya</span>
              </button>
              <div className="hidden md:block h-8 w-px bg-gray-300"></div>
              <h1 className="text-3xl font-bold text-gray-900 hover:text-indigo-700 transition-colors cursor-pointer">
                Timeline Manager
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Filter className="w-5 h-5 mr-2" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
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
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Events</h2>
                  <div className="space-y-4">
                    {upcomingEvents.map(event => {
                      const daysUntil = getDaysUntil(event.date);
                      return (
                        <div
                          key={event._id || event.id}
                          className={`border-l-4 rounded-r-lg p-4 ${getPriorityColor(event.priority)} cursor-pointer hover:shadow-md transition-shadow`}
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              {getEventTypeIcon(event.type)}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="font-semibold text-gray-900">{event.title}</h3>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(event.priority)}`}>{event.priority}</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {formatDate(event.date)}
                                  </div>
                                  <div className={`flex items-center ${daysUntil <= 3 ? 'text-red-600 font-medium' : daysUntil <= 7 ? 'text-yellow-600 font-medium' : ''}`}>
                                    <Clock className="w-4 h-4 mr-1" />
                                    {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days left`}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleComplete(event._id || event.id);
                                }}
                                className={`p-1 rounded ${event.isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEvent(event._id || event.id);
                                }}
                                className="p-1 rounded bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {pastEvents.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Events</h2>
                    <div className="space-y-4">
                      {pastEvents.map(event => (
                        <div
                          key={event._id || event.id}
                          className="border border-gray-200 rounded-lg p-4 bg-gray-50 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              {getEventTypeIcon(event.type)}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="font-semibold text-gray-700">{event.title}</h3>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(event.priority)}`}>{event.priority}</span>
                                  {event.isCompleted && <CheckCircle className="w-4 h-4 text-green-500" />}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                                <div className="flex items-center text-xs text-gray-500">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  {formatDate(event.date)}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(event._id || event.id);
                              }}
                              className="p-1 rounded bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
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
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
                      <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-gray-600">×</button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        {getEventTypeIcon(selectedEvent.type)}
                        <div>
                          <h4 className="font-medium text-gray-900">{selectedEvent.title}</h4>
                          <p className="text-sm text-gray-600 capitalize">{selectedEvent.type}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-700">{selectedEvent.description}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          {formatDate(selectedEvent.date)}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          {getDaysUntil(selectedEvent.date) >= 0 ? `${getDaysUntil(selectedEvent.date)} days remaining` : `${Math.abs(getDaysUntil(selectedEvent.date))} days ago`}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Priority:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(selectedEvent.priority)}`}>{selectedEvent.priority}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedEvent.isCompleted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {selectedEvent.isCompleted ? 'Completed' : 'Pending'}
                        </span>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleComplete(selectedEvent._id || selectedEvent.id)}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${selectedEvent.isCompleted ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                          >
                            {selectedEvent.isCompleted ? 'Mark Pending' : 'Mark Complete'}
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(selectedEvent._id || selectedEvent.id)}
                            className="p-2 bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : showAddForm ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Add New Event</h3>
                      <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">×</button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
                          value={newEvent.title}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Event title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={newEvent.description}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          rows="3"
                          placeholder="Event description"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                          value={newEvent.type}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="admission">Admission</option>
                          <option value="exam">Exam</option>
                          <option value="scholarship">Scholarship</option>
                          <option value="counseling">Counseling</option>
                          <option value="deadline">Deadline</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          value={newEvent.date}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select
                          value={newEvent.priority}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, priority: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>

                      <div className="flex space-x-2 pt-4">
                        <button
                          onClick={handleAddEvent}
                          disabled={submitting}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                        >
                          {submitting ? 'Creating...' : 'Add Event'}
                        </button>
                        <button
                          onClick={() => setShowAddForm(false)}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-8 text-center">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Event</h3>
                    <p className="text-gray-600">Click on any event to view details and manage it.</p>
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