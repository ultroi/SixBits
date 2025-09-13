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

const TimelineManager = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    priority: '',
    status: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'admission',
    date: '',
    priority: 'medium'
  });

  useEffect(() => {
    // Mock timeline events - in real app, fetch from API
    const mockEvents = [
      {
        id: 1,
        title: 'JEE Main 2025 Registration',
        description: 'Register for JEE Main 2025 examination',
        type: 'exam',
        date: '2025-01-15',
        priority: 'high',
        isCompleted: false,
        reminderSent: false
      },
      {
        id: 2,
        title: 'Scholarship Application Deadline',
        description: 'Last date to apply for merit-based scholarships',
        type: 'scholarship',
        date: '2025-01-20',
        priority: 'medium',
        isCompleted: false,
        reminderSent: false
      },
      {
        id: 3,
        title: 'College Admission Counseling',
        description: 'Attend counseling session for college admissions',
        type: 'counseling',
        date: '2025-01-25',
        priority: 'high',
        isCompleted: false,
        reminderSent: false
      },
      {
        id: 4,
        title: 'Document Verification',
        description: 'Submit and verify admission documents',
        type: 'admission',
        date: '2025-02-01',
        priority: 'high',
        isCompleted: false,
        reminderSent: false
      },
      {
        id: 5,
        title: 'Fee Payment Deadline',
        description: 'Pay college admission fees',
        type: 'deadline',
        date: '2025-02-10',
        priority: 'high',
        isCompleted: false,
        reminderSent: false
      },
      {
        id: 6,
        title: 'Hostel Application',
        description: 'Apply for college hostel accommodation',
        type: 'admission',
        date: '2025-02-15',
        priority: 'medium',
        isCompleted: false,
        reminderSent: false
      }
    ];

    setEvents(mockEvents);
    setFilteredEvents(mockEvents);
  }, []);

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

  const handleAddEvent = () => {
    if (newEvent.title && newEvent.date) {
      const event = {
        id: Date.now(),
        ...newEvent,
        isCompleted: false,
        reminderSent: false
      };
      setEvents(prev => [...prev, event]);
      setNewEvent({
        title: '',
        description: '',
        type: 'admission',
        date: '',
        priority: 'medium'
      });
      setShowAddForm(false);
    }
  };

  const handleToggleComplete = (eventId) => {
    setEvents(prev => prev.map(event =>
      event.id === eventId
        ? { ...event, isCompleted: !event.isCompleted }
        : event
    ));
  };

  const handleDeleteEvent = (eventId) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
    if (selectedEvent && selectedEvent.id === eventId) {
      setSelectedEvent(null);
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
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Zariya</h1>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Timeline Manager</h1>
                <p className="text-gray-600 mt-1">Track important dates and stay on top of deadlines</p>
              </div>
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

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="exam">Exam</option>
                <option value="admission">Admission</option>
                <option value="scholarship">Scholarship</option>
                <option value="counseling">Counseling</option>
                <option value="deadline">Deadline</option>
              </select>

              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>

              <button
                onClick={() => setFilters({ type: '', priority: '', status: '' })}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timeline */}
          <div className="lg:col-span-2">
            {/* Upcoming Events */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Events</h2>
              <div className="space-y-4">
                {upcomingEvents.map(event => {
                  const daysUntil = getDaysUntil(event.date);
                  return (
                    <div
                      key={event.id}
                      className={`border-l-4 rounded-r-lg p-4 ${getPriorityColor(event.priority)} cursor-pointer hover:shadow-md transition-shadow`}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getEventTypeIcon(event.type)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{event.title}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(event.priority)}`}>
                                {event.priority}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {formatDate(event.date)}
                              </div>
                              <div className={`flex items-center ${
                                daysUntil <= 3 ? 'text-red-600 font-medium' :
                                daysUntil <= 7 ? 'text-yellow-600 font-medium' : ''
                              }`}>
                                <Clock className="w-4 h-4 mr-1" />
                                {daysUntil === 0 ? 'Today' :
                                 daysUntil === 1 ? 'Tomorrow' :
                                 `${daysUntil} days left`}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleComplete(event.id);
                            }}
                            className={`p-1 rounded ${
                              event.isCompleted
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event.id);
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

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Events</h2>
                <div className="space-y-4">
                  {pastEvents.map(event => (
                    <div
                      key={event.id}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getEventTypeIcon(event.type)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-gray-700">{event.title}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(event.priority)}`}>
                                {event.priority}
                              </span>
                              {event.isCompleted && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
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
                            handleDeleteEvent(event.id);
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

          {/* Event Details Sidebar */}
          <div className="lg:col-span-1">
            {selectedEvent ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
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
                      {getDaysUntil(selectedEvent.date) >= 0
                        ? `${getDaysUntil(selectedEvent.date)} days remaining`
                        : `${Math.abs(getDaysUntil(selectedEvent.date))} days ago`
                      }
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Priority:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(selectedEvent.priority)}`}>
                      {selectedEvent.priority}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedEvent.isCompleted
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {selectedEvent.isCompleted ? 'Completed' : 'Pending'}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleComplete(selectedEvent.id)}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                          selectedEvent.isCompleted
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {selectedEvent.isCompleted ? 'Mark Pending' : 'Mark Complete'}
                      </button>
                      <button className="p-2 bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 rounded-lg">
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
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
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
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      Add Event
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
      </div>
    </div>
  );
};

export default TimelineManager;