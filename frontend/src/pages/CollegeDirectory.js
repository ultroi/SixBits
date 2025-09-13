import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Search,
  Filter,
  GraduationCap,
  Building,
  Wifi,
  BookOpen,
  Star,
  Users,
  Phone,
  Mail,
  Globe,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { collegeService } from '../services/api';

const CollegeDirectory = () => {
  const [colleges, setColleges] = useState([]);
  const [filteredColleges, setFilteredColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [expandedPrograms, setExpandedPrograms] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  // Default to showing government colleges
  const [filters, setFilters] = useState({
    type: 'Government',
    city: '',
    facilities: []
  });
  const [sortBy, setSortBy] = useState('distance');
  const [applyModalCollege, setApplyModalCollege] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchColleges = async () => {
        setLoading(true);
      try {
        const data = await collegeService.getColleges();
        // Add mock distance and id for display
        const collegesWithExtras = data.map((college, index) => ({
          ...college,
          id: college._id || index + 1,
          location: {
            ...college.location,
            distance: Math.random() * 50 + 1 // Mock distance
          }
        }));
        setColleges(collegesWithExtras);
        setFilteredColleges(collegesWithExtras);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching colleges:', error);
        // Fallback to mock data if API fails
        const mockColleges = [
          {
            id: 1,
            name: 'Delhi University',
            type: 'Government',
            location: {
              address: 'New Delhi, Delhi',
              city: 'Delhi',
              coordinates: { lat: 28.6139, lng: 77.2090 },
              distance: 2.5
            },
            programs: [],
            facilities: {
              hostel: true,
              library: true,
              lab: true,
              internet: true,
              sports: true
            },
            contact: {
              phone: '+91-1234567890',
              email: 'info@du.ac.in',
              website: 'https://www.du.ac.in'
            },
            rating: 4.5
          }
        ];
        setColleges(mockColleges);
        setFilteredColleges(mockColleges);
        setLoading(false);
      }
    };

    fetchColleges();
  }, []);

  useEffect(() => {
    let filtered = colleges.filter(college => {
      const matchesSearch = college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           college.location.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !filters.type || college.type === filters.type;
      const matchesCity = !filters.city || college.location.city === filters.city;

      const matchesFacilities = filters.facilities.length === 0 ||
        filters.facilities.every(facility => college.facilities[facility]);

      return matchesSearch && matchesType && matchesCity && matchesFacilities;
    });

    // Sort according to sortBy
    if (sortBy === 'distance') {
      filtered.sort((a, b) => a.location.distance - b.location.distance);
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredColleges(filtered);
  }, [colleges, searchTerm, filters, sortBy]);

  const toggleCompare = (college) => {
    setCompareList(prev => {
      if (prev.find(c => c.id === college.id)) return prev.filter(c => c.id !== college.id);
      if (prev.length >= 3) return prev; // limit compare to 3
      return [...prev, college];
    });
  };

  const toggleProgramExpand = (collegeId) => {
    setExpandedPrograms(prev => ({ ...prev, [collegeId]: !prev[collegeId] }));
  };

  const openApplyModal = (college) => setApplyModalCollege(college);
  const closeApplyModal = () => setApplyModalCollege(null);

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'facilities') {
      setFilters(prev => ({
        ...prev,
        facilities: prev.facilities.includes(value)
          ? prev.facilities.filter(f => f !== value)
          : [...prev.facilities, value]
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [filterType]: value
      }));
    }
  };

  const formatFees = (fees) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(fees);
  };

  const getFacilityIcon = (facility) => {
    switch (facility) {
      case 'hostel': return <Building className="w-4 h-4" />;
      case 'library': return <BookOpen className="w-4 h-4" />;
      case 'lab': return <GraduationCap className="w-4 h-4" />;
      case 'internet': return <Wifi className="w-4 h-4" />;
      case 'sports': return <Users className="w-4 h-4" />;
      default: return null;
    }
  };

  const uniqueCities = [...new Set(colleges.map(college => college.location.city))];
  const facilities = ['hostel', 'library', 'lab', 'internet', 'sports'];

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
                <h1 className="text-3xl font-bold text-gray-900">College Directory</h1>
                <p className="text-gray-600 mt-1">Find government colleges near you with detailed information</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search colleges..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
                <option value="distance">Sort: Nearest</option>
                <option value="rating">Sort: Rating</option>
                <option value="name">Sort: Name</option>
              </select>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Filter className="w-5 h-5 mr-2" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
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
                <option value="Government">Government</option>
                <option value="Private">Private</option>
              </select>

              <select
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Cities</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              <div className="md:col-span-2">
                <div className="text-sm text-gray-600 mb-2">Facilities:</div>
                <div className="flex flex-wrap gap-2">
                  {facilities.map(facility => (
                    <button
                      key={facility}
                      onClick={() => handleFilterChange('facilities', facility)}
                      className={`flex items-center px-3 py-1 rounded-full text-sm transition-colors ${
                        filters.facilities.includes(facility)
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {getFacilityIcon(facility)}
                      <span className="ml-1 capitalize">{facility}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* College List */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {loading ? (
                // show 4 skeleton cards
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-3" />
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-1/4" />
                      </div>
                      <div className="ml-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                      </div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded mb-3" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="h-16 bg-gray-200 rounded" />
                      <div className="h-16 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))
              ) : (
                filteredColleges.map(college => (
                  <div
                    key={college.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedCollege(college)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-xl font-semibold text-gray-900 mr-3">{college.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            college.type === 'Government'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {college.type}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600 mb-3">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span className="text-sm">{college.location.address}</span>
                          <span className="mx-2">•</span>
                          <span className="text-sm">{college.location.distance} km away</span>
                        </div>
                        <div className="flex items-center mb-3">
                          <div className="flex items-center mr-4">
                            <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                            <span className="text-sm font-medium">{college.rating}</span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {college.programs.length} programs available
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end space-y-2">
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <Building className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleCompare(college); }}
                            aria-pressed={compareList.find(c => c.id === college.id) ? 'true' : 'false'}
                            className={`px-2 py-1 text-xs rounded ${compareList.find(c => c.id === college.id) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          >
                            {compareList.find(c => c.id === college.id) ? 'In Compare' : 'Compare'}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openApplyModal(college); }}
                            className="px-2 py-1 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Facilities */}
                    <div className="flex items-center space-x-4 mb-4">
                      {Object.entries(college.facilities).map(([facility, available]) => (
                        available && (
                          <div key={facility} className="flex items-center text-green-600">
                            {getFacilityIcon(facility)}
                            <span className="ml-1 text-xs capitalize">{facility}</span>
                          </div>
                        )
                      ))}
                    </div>

                    {/* Top Programs Preview */}
                    <div className="border-t border-gray-100 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Top Programs:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {college.programs.slice(0, expandedPrograms[college.id] ? 10 : 2).map((program, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3 transform transition hover:scale-[1.01]">
                            <div className="font-medium text-sm text-gray-900 mb-1">{program.name}</div>
                            <div className="text-xs text-gray-600 mb-1">
                              Cut-off: {program.cutOff}% • Fees: {formatFees(program.fees)}
                            </div>
                            <div className="text-xs text-gray-600">{program.medium} medium</div>
                          </div>
                        ))}
                        {college.programs.length > 2 && (
                          <button
                            onClick={() => toggleProgramExpand(college.id)}
                            className="col-span-full text-xs text-indigo-600 hover:underline mt-1"
                          >
                            {expandedPrograms[college.id] ? 'Show less' : `Show ${college.programs.length - 2} more`}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* College Details Sidebar */}
          <div className="lg:col-span-1">
            {selectedCollege ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">College Details</h3>
                  <button
                    onClick={() => setSelectedCollege(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{selectedCollege.name}</h4>
                    <div className="flex items-center mb-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                      <span className="text-sm font-medium">{selectedCollege.rating}</span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedCollege.type === 'Government'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {selectedCollege.type}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-1" />
                      {selectedCollege.location.distance} km away
                    </div>
                  </div>

                  {/* Programs */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Available Programs</h4>
                    <div className="space-y-3">
                      {selectedCollege.programs.map((program, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <div className="font-medium text-sm text-gray-900 mb-2">{program.name}</div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div>Degree: {program.degree}</div>
                            <div>Duration: {program.duration} years</div>
                            <div>Cut-off: {program.cutOff}%</div>
                            <div>Medium: {program.medium}</div>
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            <strong>Eligibility:</strong> {program.eligibility}
                          </div>
                          <div className="mt-1 text-xs text-gray-600">
                            <strong>Fees:</strong> {formatFees(program.fees)}/year
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Facilities */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Facilities</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedCollege.facilities).map(([facility, available]) => (
                        <div key={facility} className="flex items-center">
                          {available ? (
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          ) : (
                            <X className="w-4 h-4 text-red-500 mr-2" />
                          )}
                          <span className={`text-sm capitalize ${available ? 'text-gray-900' : 'text-gray-500'}`}>
                            {facility}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contact */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {selectedCollege.contact.phone}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {selectedCollege.contact.email}
                      </div>
                      <a
                        href={selectedCollege.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Visit Website
                      </a>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                      Apply Now
                    </button>
                    <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                      Add to Compare
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a College</h3>
                <p className="text-gray-600">Click on any college to view detailed information about programs, facilities, and contact details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Apply Modal */}
      {applyModalCollege && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Apply to {applyModalCollege.name}</h3>
              <button onClick={closeApplyModal} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div className="space-y-3">
              <div className="text-sm text-gray-700">Choose a program and we'll take you to the college website to complete your application.</div>
              <select className="w-full p-2 border rounded">
                {applyModalCollege.programs.map((p, i) => (
                  <option key={i} value={p.name}>{p.name} — {p.degree}</option>
                ))}
              </select>
              <div className="flex justify-end space-x-2">
                <button onClick={closeApplyModal} className="px-4 py-2 rounded bg-gray-100">Cancel</button>
                <a href={applyModalCollege.contact.website} target="_blank" rel="noreferrer" className="px-4 py-2 rounded bg-indigo-600 text-white">Go to Website</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeDirectory;