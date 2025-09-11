import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  Filter,
  GraduationCap,
  Building,
  Wifi,
  BookOpen,
  Star,
  Phone,
  Mail,
  Globe,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const CollegeDirectory = () => {
  const [colleges, setColleges] = useState([]);
  const [filteredColleges, setFilteredColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    city: '',
    facilities: []
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Mock college data - in real app, fetch from API with location
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
        programs: [
          {
            name: 'B.A. Economics',
            degree: 'B.A.',
            duration: 3,
            cutOff: 95,
            eligibility: '12th pass with 85%',
            medium: 'English',
            fees: 15000
          },
          {
            name: 'B.Sc Mathematics',
            degree: 'B.Sc',
            duration: 3,
            cutOff: 92,
            eligibility: '12th pass with PCM',
            medium: 'English',
            fees: 18000
          }
        ],
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
      },
      {
        id: 2,
        name: 'Jawaharlal Nehru University',
        type: 'Government',
        location: {
          address: 'New Delhi, Delhi',
          city: 'Delhi',
          coordinates: { lat: 28.5402, lng: 77.1662 },
          distance: 8.2
        },
        programs: [
          {
            name: 'B.A. International Relations',
            degree: 'B.A.',
            duration: 3,
            cutOff: 88,
            eligibility: '12th pass',
            medium: 'English',
            fees: 12000
          }
        ],
        facilities: {
          hostel: true,
          library: true,
          lab: false,
          internet: true,
          sports: true
        },
        contact: {
          phone: '+91-9876543210',
          email: 'admissions@jnu.ac.in',
          website: 'https://www.jnu.ac.in'
        },
        rating: 4.3
      },
      {
        id: 3,
        name: 'Indian Institute of Technology Delhi',
        type: 'Government',
        location: {
          address: 'Hauz Khas, Delhi',
          city: 'Delhi',
          coordinates: { lat: 28.5448, lng: 77.1926 },
          distance: 6.8
        },
        programs: [
          {
            name: 'B.Tech Computer Science',
            degree: 'B.Tech',
            duration: 4,
            cutOff: 98,
            eligibility: 'JEE Advanced qualified',
            medium: 'English',
            fees: 250000
          },
          {
            name: 'B.Tech Mechanical',
            degree: 'B.Tech',
            duration: 4,
            cutOff: 95,
            eligibility: 'JEE Advanced qualified',
            medium: 'English',
            fees: 250000
          }
        ],
        facilities: {
          hostel: true,
          library: true,
          lab: true,
          internet: true,
          sports: true
        },
        contact: {
          phone: '+91-1126591502',
          email: 'admission@iitd.ac.in',
          website: 'https://www.iitd.ac.in'
        },
        rating: 4.8
      },
      {
        id: 4,
        name: 'Lady Shri Ram College',
        type: 'Government',
        location: {
          address: 'Lajpat Nagar, Delhi',
          city: 'Delhi',
          coordinates: { lat: 28.5700, lng: 77.2433 },
          distance: 4.1
        },
        programs: [
          {
            name: 'B.A. Psychology',
            degree: 'B.A.',
            duration: 3,
            cutOff: 96,
            eligibility: '12th pass',
            medium: 'English',
            fees: 20000
          }
        ],
        facilities: {
          hostel: true,
          library: true,
          lab: true,
          internet: true,
          sports: true
        },
        contact: {
          phone: '+91-1126410544',
          email: 'info@lsr.edu.in',
          website: 'https://www.lsr.edu.in'
        },
        rating: 4.6
      }
    ];

    setColleges(mockColleges);
    setFilteredColleges(mockColleges);
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

    // Sort by distance
    filtered.sort((a, b) => a.location.distance - b.location.distance);

    setFilteredColleges(filtered);
  }, [colleges, searchTerm, filters]);

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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">College Directory</h1>
              <p className="text-gray-600 mt-1">Find government colleges near you with detailed information</p>
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
              {filteredColleges.map(college => (
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
                    <div className="ml-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Building className="w-6 h-6 text-indigo-600" />
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
                      {college.programs.slice(0, 2).map((program, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <div className="font-medium text-sm text-gray-900 mb-1">{program.name}</div>
                          <div className="text-xs text-gray-600 mb-1">
                            Cut-off: {program.cutOff}% • Fees: {formatFees(program.fees)}
                          </div>
                          <div className="text-xs text-gray-600">{program.medium} medium</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
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
    </div>
  );
};

export default CollegeDirectory;