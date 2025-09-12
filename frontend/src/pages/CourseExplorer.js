import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Clock,
  BookOpen,
  Award,
  MapPin,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';

const CourseExplorer = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    stream: '',
    degree: '',
    duration: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Mock course data - in real app, fetch from API
    const mockCourses = [
      {
        id: 1,
        name: 'Bachelor of Technology (B.Tech)',
        degree: 'B.Tech',
        stream: 'Engineering',
        duration: 4,
        description: 'Comprehensive engineering program covering core concepts and practical applications.',
        careerPaths: [
          {
            jobTitle: 'Software Engineer',
            industry: 'Technology',
            averageSalary: 800000,
            growthRate: 15,
            requiredSkills: ['Programming', 'Data Structures', 'Algorithms']
          },
          {
            jobTitle: 'Mechanical Engineer',
            industry: 'Manufacturing',
            averageSalary: 600000,
            growthRate: 8,
            requiredSkills: ['CAD', 'Thermodynamics', 'Materials Science']
          }
        ],
        entranceExams: [
          {
            name: 'JEE Main',
            conductingBody: 'NTA',
            frequency: 'Twice a year',
            eligibility: '12th pass with PCM'
          },
          {
            name: 'JEE Advanced',
            conductingBody: 'IITs',
            frequency: 'Once a year',
            eligibility: 'JEE Main qualified'
          }
        ],
        higherEducation: [
          {
            degree: 'M.Tech',
            specializations: ['Computer Science', 'Mechanical', 'Electrical']
          },
          {
            degree: 'MBA',
            specializations: ['Technology Management', 'Operations']
          }
        ],
        entrepreneurship: [
          {
            idea: 'Tech Startup',
            requiredSkills: ['Programming', 'Business Development'],
            potential: 'High growth in software industry'
          }
        ]
      },
      {
        id: 2,
        name: 'Bachelor of Science (B.Sc)',
        degree: 'B.Sc',
        stream: 'Science',
        duration: 3,
        description: 'Foundation in scientific principles with specialization options.',
        careerPaths: [
          {
            jobTitle: 'Research Scientist',
            industry: 'Research',
            averageSalary: 500000,
            growthRate: 10,
            requiredSkills: ['Research Methodology', 'Data Analysis']
          },
          {
            jobTitle: 'Data Analyst',
            industry: 'Technology',
            averageSalary: 600000,
            growthRate: 20,
            requiredSkills: ['Statistics', 'Python', 'SQL']
          }
        ],
        entranceExams: [
          {
            name: 'CUET',
            conductingBody: 'NTA',
            frequency: 'Once a year',
            eligibility: '12th pass'
          }
        ],
        higherEducation: [
          {
            degree: 'M.Sc',
            specializations: ['Physics', 'Chemistry', 'Mathematics']
          },
          {
            degree: 'MBA',
            specializations: ['Analytics', 'Consulting']
          }
        ],
        entrepreneurship: [
          {
            idea: 'Data Analytics Firm',
            requiredSkills: ['Analytics', 'Business Intelligence'],
            potential: 'Growing demand for data services'
          }
        ]
      },
      {
        id: 3,
        name: 'Bachelor of Commerce (B.Com)',
        degree: 'B.Com',
        stream: 'Commerce',
        duration: 3,
        description: 'Comprehensive business education covering finance, accounting, and management.',
        careerPaths: [
          {
            jobTitle: 'Chartered Accountant',
            industry: 'Finance',
            averageSalary: 700000,
            growthRate: 12,
            requiredSkills: ['Accounting', 'Taxation', 'Audit']
          },
          {
            jobTitle: 'Financial Analyst',
            industry: 'Banking',
            averageSalary: 650000,
            growthRate: 14,
            requiredSkills: ['Financial Modeling', 'Excel', 'Analysis']
          }
        ],
        entranceExams: [
          {
            name: 'CUET',
            conductingBody: 'NTA',
            frequency: 'Once a year',
            eligibility: '12th pass with Commerce'
          }
        ],
        higherEducation: [
          {
            degree: 'M.Com',
            specializations: ['Finance', 'Accounting']
          },
          {
            degree: 'MBA',
            specializations: ['Finance', 'Marketing']
          }
        ],
        entrepreneurship: [
          {
            idea: 'Financial Consulting',
            requiredSkills: ['Financial Planning', 'Investment Advice'],
            potential: 'Stable demand in financial services'
          }
        ]
      },
      {
        id: 4,
        name: 'Bachelor of Arts (B.A.)',
        degree: 'B.A.',
        stream: 'Arts',
        duration: 3,
        description: 'Liberal arts education fostering critical thinking and communication skills.',
        careerPaths: [
          {
            jobTitle: 'Content Writer',
            industry: 'Media',
            averageSalary: 400000,
            growthRate: 18,
            requiredSkills: ['Writing', 'Research', 'SEO']
          },
          {
            jobTitle: 'Teacher',
            industry: 'Education',
            averageSalary: 350000,
            growthRate: 6,
            requiredSkills: ['Communication', 'Subject Knowledge']
          }
        ],
        entranceExams: [
          {
            name: 'CUET',
            conductingBody: 'NTA',
            frequency: 'Once a year',
            eligibility: '12th pass'
          }
        ],
        higherEducation: [
          {
            degree: 'M.A.',
            specializations: ['English', 'History', 'Psychology']
          },
          {
            degree: 'MBA',
            specializations: ['HR', 'Marketing']
          }
        ],
        entrepreneurship: [
          {
            idea: 'Content Creation Agency',
            requiredSkills: ['Writing', 'Digital Marketing'],
            potential: 'Growing digital content market'
          }
        ]
      }
    ];

    setCourses(mockCourses);
    setFilteredCourses(mockCourses);
  }, []);

  useEffect(() => {
    let filtered = courses.filter(course => {
      const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.stream.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStream = !filters.stream || course.stream === filters.stream;
      const matchesDegree = !filters.degree || course.degree === filters.degree;
      const matchesDuration = !filters.duration || course.duration === parseInt(filters.duration);

      return matchesSearch && matchesStream && matchesDegree && matchesDuration;
    });

    setFilteredCourses(filtered);
  }, [courses, searchTerm, filters]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const formatSalary = (salary) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(salary);
  };

  const uniqueStreams = [...new Set(courses.map(course => course.stream))];
  const uniqueDegrees = [...new Set(courses.map(course => course.degree))];
  const uniqueDurations = [...new Set(courses.map(course => course.duration))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Zariya</h1>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Course Explorer</h1>
                <p className="text-gray-600 mt-1">Discover courses and career paths that match your interests</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search courses..."
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
                value={filters.stream}
                onChange={(e) => handleFilterChange('stream', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Streams</option>
                {uniqueStreams.map(stream => (
                  <option key={stream} value={stream}>{stream}</option>
                ))}
              </select>

              <select
                value={filters.degree}
                onChange={(e) => handleFilterChange('degree', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Degrees</option>
                {uniqueDegrees.map(degree => (
                  <option key={degree} value={degree}>{degree}</option>
                ))}
              </select>

              <select
                value={filters.duration}
                onChange={(e) => handleFilterChange('duration', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Durations</option>
                {uniqueDurations.map(duration => (
                  <option key={duration} value={duration}>{duration} years</option>
                ))}
              </select>

              <button
                onClick={() => setFilters({ stream: '', degree: '', duration: '' })}
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
          {/* Course List */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {filteredCourses.map(course => (
                <div
                  key={course.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.name}</h3>
                      <p className="text-gray-600 mb-3">{course.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <GraduationCap className="w-4 h-4 mr-1" />
                          {course.stream}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {course.duration} years
                        </div>
                        <div className="flex items-center">
                          <Award className="w-4 h-4 mr-1" />
                          {course.degree}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-indigo-600" />
                      </div>
                    </div>
                  </div>

                  {/* Career Preview */}
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Top Career Paths:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {course.careerPaths.slice(0, 2).map((career, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">{career.jobTitle}</span>
                            <span className="text-xs text-green-600 font-medium">+{career.growthRate}%</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600 mb-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {career.industry}
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {formatSalary(career.averageSalary)}/year
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Course Details Sidebar */}
          <div className="lg:col-span-1">
            {selectedCourse ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Course Details</h3>
                  <button
                    onClick={() => setSelectedCourse(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{selectedCourse.name}</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Degree:</span>
                        <span className="font-medium">{selectedCourse.degree}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span className="font-medium">{selectedCourse.duration} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stream:</span>
                        <span className="font-medium">{selectedCourse.stream}</span>
                      </div>
                    </div>
                  </div>

                  {/* Career Paths */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Career Opportunities</h4>
                    <div className="space-y-3">
                      {selectedCourse.careerPaths.map((career, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">{career.jobTitle}</span>
                            <div className="flex items-center text-xs">
                              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                              <span className="text-green-600">+{career.growthRate}%</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 mb-1">{career.industry}</div>
                          <div className="text-xs text-gray-600">{formatSalary(career.averageSalary)}/year</div>
                          <div className="mt-2">
                            <div className="text-xs text-gray-500 mb-1">Key Skills:</div>
                            <div className="flex flex-wrap gap-1">
                              {career.requiredSkills.map((skill, idx) => (
                                <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Entrance Exams */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Entrance Exams</h4>
                    <div className="space-y-2">
                      {selectedCourse.entranceExams.map((exam, index) => (
                        <div key={index} className="bg-yellow-50 rounded-lg p-3">
                          <div className="font-medium text-sm text-gray-900 mb-1">{exam.name}</div>
                          <div className="text-xs text-gray-600 mb-1">{exam.conductingBody}</div>
                          <div className="text-xs text-gray-600">{exam.frequency}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Higher Education */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Higher Education</h4>
                    <div className="space-y-2">
                      {selectedCourse.higherEducation.map((edu, index) => (
                        <div key={index} className="bg-purple-50 rounded-lg p-3">
                          <div className="font-medium text-sm text-gray-900 mb-1">{edu.degree}</div>
                          <div className="text-xs text-gray-600">
                            Specializations: {edu.specializations.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Entrepreneurship */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Entrepreneurship</h4>
                    <div className="space-y-2">
                      {selectedCourse.entrepreneurship.map((ent, index) => (
                        <div key={index} className="bg-green-50 rounded-lg p-3">
                          <div className="font-medium text-sm text-gray-900 mb-1">{ent.idea}</div>
                          <div className="text-xs text-gray-600 mb-2">{ent.potential}</div>
                          <div className="text-xs text-gray-500">Skills needed:</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {ent.requiredSkills.map((skill, idx) => (
                              <span key={idx} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Course</h3>
                <p className="text-gray-600">Click on any course to view detailed information about career paths, entrance exams, and more.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseExplorer;