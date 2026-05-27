import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, User, BookOpen, Sparkles, ShieldCheck, Mail, Target, 
  TrendingUp, AlertCircle, CheckCircle, ChevronDown, Check 
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

// Navigation Item Component
const NavItem = ({ item, isActive, onClick }) => {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
        isActive
          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{item.label}</span>
    </button>
  );
};

// Collapsible Section Component
const CollapsibleSection = ({ title, icon: Icon, isOpen, onToggle, children }) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm overflow-hidden hover:shadow-lg transition-all duration-300">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-indigo-600" />}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          {children}
        </div>
      )}
    </div>
  );
};

// Chip Component for Multi-Select
const ChipSelect = ({ options, selected, onChange, limit = null, allowsEmpty = true }) => {
  const canAdd = !limit || selected.length < limit;
  
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isSelected) {
                onChange(selected.filter((item) => item !== option));
              } else if (canAdd || !allowsEmpty) {
                onChange([...selected, option]);
              }
            }}
            disabled={!isSelected && !canAdd}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              isSelected
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30'
                : 'border-2 border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
            } ${!isSelected && !canAdd ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {option}
            {isSelected && <Check className="inline ml-2 w-4 h-4" />}
          </button>
        );
      })}
      {limit && selected.length > 0 && (
        <span className="text-xs text-gray-500 self-center ml-2">
          {selected.length}/{limit}
        </span>
      )}
    </div>
  );
};

// Navigation data
const navigationItems = [
  { id: 'personal', label: 'Personal Information', icon: User },
  { id: 'academic', label: 'Academic Profile', icon: BookOpen },
  { id: 'career', label: 'Career Profile', icon: Target },
  { id: 'ai-insights', label: 'AI Personalization', icon: Sparkles },
  { id: 'email', label: 'Email Settings', icon: Mail },
  { id: 'security', label: 'Password & Security', icon: ShieldCheck },
];

// Options
const academicInterestsOptions = [
  'Mathematics', 'Computer Science', 'Physics', 'Chemistry', 'Biology', 'English',
  'Economics', 'Business Studies', 'Accountancy', 'History', 'Political Science',
  'Geography', 'Psychology', 'Sociology', 'Fine Arts',
];

const activityOptions = [
  'Solving logical problems', 'Coding / Building apps', 'Designing graphics / UI',
  'Writing stories / content', 'Teaching or mentoring', 'Researching and analyzing',
  'Managing events / organizing', 'Public speaking', 'Working with numbers / data',
  'Helping people solve problems', 'Creating business ideas', 'Experimenting / innovation',
];

const careerAspirationsOptions = [
  'Software & Technology', 'Data Science / AI', 'Government Jobs / UPSC / SSC',
  'Teaching / Academia', 'Business / Entrepreneurship', 'Finance / Banking',
  'Design / Creative Media', 'Healthcare', 'Law / Civil Services', 'Research & Science',
  'Marketing', 'Cybersecurity', 'Product Management', 'Still Exploring',
];

const workStylePreferenceOptions = [
  'Independently', 'In teams', 'Structured tasks', 'Creative freedom', 'Field work',
  'Desk-based work', 'Problem-solving intensive', 'Communication-heavy work',
];

const learningStyleOptions = [
  'Hands-on practical projects', 'Watching tutorials/videos', 'Reading theory',
  'Solving exercises', 'Group discussions', 'Trial and experimentation',
];

const careerPrioritiesOptions = [
  'High salary', 'Job security', 'Creativity', 'Social impact', 'Prestige / respect',
  'Work-life balance', 'Growth opportunities', 'Flexible work environment', 'Leadership opportunities',
];

const careerGoalOptions = [
  'Get a high-paying private job', 'Prepare for government exams', 'Start my own business',
  'Higher studies', 'Explore options', 'Build technical expertise',
];

const Avatar = ({ user, sizeClassName, initialsClassName, fallbackText = 'U' }) => {
  const [imageError, setImageError] = useState(false);
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}` || fallbackText;

  if (user?.avatarUrl && !imageError) {
    return (
      <img
        src={user.avatarUrl}
        alt={`${user?.firstName || 'User'} avatar`}
        className={`rounded-full object-cover ${sizeClassName}`}
        referrerPolicy="no-referrer"
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div className={`rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold ${sizeClassName} ${initialsClassName}`}>
      {initials}
    </div>
  );
};

const Settings = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [activeNav, setActiveNav] = useState('personal');
  const [openSections, setOpenSections] = useState({
    personal: true,
    academic: true,
    career: true,
    aiInsights: true,
    email: true,
    security: true,
  });
  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  const [formData, setFormData] = useState({
    fullName: '',
    currentStatus: '',
    class: '',
    stream: '',
    city: '',
    state: '',
    preferredLanguage: 'english',
    academicInterests: [],
    activities: [],
    careerAspirations: [],
    workStylePreference: '',
    learningStyle: '',
    careerPriorities: [],
    careerGoal: '',
  });

  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    currentPassword: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Calculate completion percentage
  const calculateCompletion = () => {
    const fields = [
      formData.fullName,
      formData.currentStatus,
      formData.class,
      formData.stream,
      formData.city,
      formData.state,
      formData.academicInterests.length > 0,
      formData.activities.length > 0,
      formData.careerAspirations.length > 0,
      formData.workStylePreference,
      formData.learningStyle,
      formData.careerPriorities.length > 0,
      formData.careerGoal,
    ];
    const completed = fields.filter(f => f).length;
    return Math.round((completed / fields.length) * 100);
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const currentUser = user || (await authService.getCurrentUser()).user;
        setFormData({
          fullName: `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim(),
          currentStatus: currentUser?.currentStatus || '',
          class: currentUser?.class || '',
          stream: currentUser?.stream || '',
          city: currentUser?.location?.city || '',
          state: currentUser?.location?.state || '',
          preferredLanguage: currentUser?.preferredLanguage || 'english',
          academicInterests: Array.isArray(currentUser?.academicInterests) ? currentUser.academicInterests : [],
          activities: Array.isArray(currentUser?.activities) ? currentUser.activities : [],
          careerAspirations: Array.isArray(currentUser?.careerAspirations) ? currentUser.careerAspirations : [],
          workStylePreference: currentUser?.workStylePreference || '',
          learningStyle: currentUser?.learningStyle || '',
          careerPriorities: Array.isArray(currentUser?.careerPriorities) ? currentUser.careerPriorities : [],
          careerGoal: currentUser?.careerGoal || '',
        });
      } catch (error) {
        toast.error('Could not load profile');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTopThree = (field, value) => {
    setFormData(prev => {
      const current = prev[field];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(item => item !== value) };
      }
      if (current.length >= 3) return prev;
      return { ...prev, [field]: [...current, value] };
    });
  };

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.fullName.trim()) nextErrors.fullName = 'Full name is required';
    if (!formData.class) nextErrors.class = 'Class / Qualification is required';
    if (!formData.stream) nextErrors.stream = 'Stream is required';
    if (!formData.city.trim()) nextErrors.city = 'City is required';
    if (!formData.state.trim()) nextErrors.state = 'State is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        toast.error('You must be logged in to save changes');
        navigate('/login');
        return;
      }

      const response = await authService.updateCurrentUser({
        fullName: formData.fullName,
        currentStatus: formData.currentStatus,
        class: formData.class,
        stream: formData.stream,
        preferredLanguage: formData.preferredLanguage,
        city: formData.city.trim(),
        state: formData.state.trim(),
        academicInterests: formData.academicInterests,
        activities: formData.activities,
        careerAspirations: formData.careerAspirations,
        workStylePreference: formData.workStylePreference,
        learningStyle: formData.learningStyle,
        careerPriorities: formData.careerPriorities,
        careerGoal: formData.careerGoal,
        location: {
          city: formData.city.trim(),
          state: formData.state.trim()
        }
      });

      updateUser(response.user);
      toast.success(response.message || 'Profile updated');
      navigate('/dashboard');
    } catch (error) {
      const serverMsg = error.response?.data?.message || error.message || 'Failed to update profile';
      toast.error(serverMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!emailForm.newEmail.trim()) {
      toast.error('New email is required');
      return;
    }
    if (!emailForm.currentPassword) {
      toast.error('Current password is required');
      return;
    }

    try {
      setSavingEmail(true);
      const response = await authService.changeEmail({
        newEmail: emailForm.newEmail.trim(),
        currentPassword: emailForm.currentPassword
      });

      if (response.user) {
        updateUser(response.user);
      }

      setEmailForm({ newEmail: '', currentPassword: '' });
      toast.success(response.message || 'Email updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update email');
    } finally {
      setSavingEmail(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPasswordErrors({});

    const errors = {};
    if (!passwordForm.currentPassword) errors.currentPassword = 'Current password is required';
    if (!passwordForm.newPassword) errors.newPassword = 'New password is required';
    if (!passwordForm.confirmPassword) errors.confirmPassword = 'Please confirm your new password';

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordErrors({ newPassword: 'New password must be at least 6 characters' });
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordErrors({ newPassword: 'New password must be different from current password' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    try {
      setSavingPassword(true);
      const response = await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success(response.message || 'Password changed successfully');
    } catch (error) {
      const serverMsg = error.response?.data?.message || 'Failed to change password';
      toast.error(serverMsg);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const completion = calculateCompletion();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Profile Settings
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage your educational and career preferences</p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Sticky Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Navigation Items */}
              <div className="space-y-2">
                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Settings</p>
                {navigationItems.map(item => (
                  <NavItem
                    key={item.id}
                    item={item}
                    isActive={activeNav === item.id}
                    onClick={() => setActiveNav(item.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3 space-y-6">
            <form 
              onSubmit={handleSubmit} 
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                  e.preventDefault();
                }
              }}
              className="space-y-6"
            >
              {/* Personal Information */}
              {(activeNav === 'personal' || activeNav === null) && (
                <CollapsibleSection
                  title="Personal Information"
                  icon={User}
                  isOpen={openSections.personal}
                  onToggle={() => toggleSection('personal')}
                >
                  <div className="space-y-5">
                    {/* Profile Photo */}
                    <div className="flex items-center gap-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/50 p-4">
                      <Avatar user={user} sizeClassName="w-16 h-16 shadow-md" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{formData.fullName || 'Your'}</p>
                      </div>
                    </div>

                    {/* Form Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Full Name</label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder="Enter your full name"
                          className={`w-full px-4 py-3 rounded-xl border-2 transition-colors ${
                            errors.fullName
                              ? 'border-red-400 bg-red-50'
                              : 'border-gray-200 bg-white hover:border-indigo-300 focus:border-indigo-500 focus:bg-indigo-50/30'
                          } outline-none`}
                        />
                        {errors.fullName && <p className="text-sm text-red-600 mt-2">{errors.fullName}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Current Status</label>
                        <select
                          name="currentStatus"
                          value={formData.currentStatus}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white hover:border-indigo-300 focus:border-indigo-500 focus:bg-indigo-50/30 outline-none transition-colors"
                        >
                          <option value="">Select status</option>
                          <option value="School Student">School Student</option>
                          <option value="College Student">College Student</option>
                          <option value="Working Professional">Working Professional</option>
                          <option value="Career Switcher">Career Switcher</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Class / Qualification</label>
                        <select
                          name="class"
                          value={formData.class}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 rounded-xl border-2 transition-colors outline-none ${
                            errors.class
                              ? 'border-red-400 bg-red-50'
                              : 'border-gray-200 bg-white hover:border-indigo-300 focus:border-indigo-500 focus:bg-indigo-50/30'
                          }`}
                        >
                          <option value="">Select class</option>
                          <option value="10th">10th</option>
                          <option value="11th">11th</option>
                          <option value="12th">12th</option>
                          <option value="Graduate">Graduate</option>
                          <option value="Post-Graduate">Post-Graduate</option>
                          <option value="Other">Other</option>
                        </select>
                        {errors.class && <p className="text-sm text-red-600 mt-2">{errors.class}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Stream</label>
                        <select
                          name="stream"
                          value={formData.stream}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 rounded-xl border-2 transition-colors outline-none ${
                            errors.stream
                              ? 'border-red-400 bg-red-50'
                              : 'border-gray-200 bg-white hover:border-indigo-300 focus:border-indigo-500 focus:bg-indigo-50/30'
                          }`}
                        >
                          <option value="">Select stream</option>
                          <option value="Arts">Arts</option>
                          <option value="Science">Science</option>
                          <option value="Commerce">Commerce</option>
                          <option value="Vocational">Vocational</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Medical">Medical</option>
                          <option value="Law">Law</option>
                          <option value="Business">Business</option>
                        </select>
                        {errors.stream && <p className="text-sm text-red-600 mt-2">{errors.stream}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="Enter your city"
                          className={`w-full px-4 py-3 rounded-xl border-2 transition-colors outline-none ${
                            errors.city
                              ? 'border-red-400 bg-red-50'
                              : 'border-gray-200 bg-white hover:border-indigo-300 focus:border-indigo-500 focus:bg-indigo-50/30'
                          }`}
                        />
                        {errors.city && <p className="text-sm text-red-600 mt-2">{errors.city}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">State</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          placeholder="Enter your state"
                          className={`w-full px-4 py-3 rounded-xl border-2 transition-colors outline-none ${
                            errors.state
                              ? 'border-red-400 bg-red-50'
                              : 'border-gray-200 bg-white hover:border-indigo-300 focus:border-indigo-500 focus:bg-indigo-50/30'
                          }`}
                        />
                        {errors.state && <p className="text-sm text-red-600 mt-2">{errors.state}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Preferred Language</label>
                        <select
                          name="preferredLanguage"
                          value={formData.preferredLanguage}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white hover:border-indigo-300 focus:border-indigo-500 focus:bg-indigo-50/30 outline-none transition-colors"
                        >
                          <option value="english">English</option>
                          <option value="hindi">Hindi</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>
              )}

              {/* Academic Profile */}
              {(activeNav === 'academic' || activeNav === null) && (
                <CollapsibleSection
                  title="Academic Profile"
                  icon={BookOpen}
                  isOpen={openSections.academic}
                  onToggle={() => toggleSection('academic')}
                >
                  <div className="space-y-6">
                    {/* Academic Interests */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">Academic Interests</label>
                      <p className="text-xs text-gray-600 mb-4">Select all subjects that interest you</p>
                      <ChipSelect
                        options={academicInterestsOptions}
                        selected={formData.academicInterests}
                        onChange={(value) => setFormData(prev => ({ ...prev, academicInterests: value }))}
                      />
                    </div>

                    {/* Learning Style */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">Learning Style</label>
                      <p className="text-xs text-gray-600 mb-4">How do you prefer to learn?</p>
                      <ChipSelect
                        options={learningStyleOptions}
                        selected={formData.learningStyle ? [formData.learningStyle] : []}
                        onChange={(value) => setFormData(prev => ({ ...prev, learningStyle: value[0] || '' }))}
                      />
                    </div>
                  </div>
                </CollapsibleSection>
              )}

              {/* Career Profile */}
              {(activeNav === 'career' || activeNav === null) && (
                <CollapsibleSection
                  title="Career Profile"
                  icon={Target}
                  isOpen={openSections.career}
                  onToggle={() => toggleSection('career')}
                >
                  <div className="space-y-6">
                    {/* Activities */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">Activities</label>
                      <p className="text-xs text-gray-600 mb-4">Choose activities that describe how you like to spend your time</p>
                      <ChipSelect
                        options={activityOptions}
                        selected={formData.activities}
                        onChange={(value) => setFormData(prev => ({ ...prev, activities: value }))}
                      />
                    </div>

                    {/* Career Aspirations */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">Career Aspirations</label>
                      <p className="text-xs text-gray-600 mb-4">Select career paths you're interested in exploring</p>
                      <ChipSelect
                        options={careerAspirationsOptions}
                        selected={formData.careerAspirations}
                        onChange={(value) => setFormData(prev => ({ ...prev, careerAspirations: value }))}
                      />
                    </div>

                    {/* Work Style Preference */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">Work Style Preference</label>
                      <p className="text-xs text-gray-600 mb-4">Choose the work style that fits you best</p>
                      <ChipSelect
                        options={workStylePreferenceOptions}
                        selected={formData.workStylePreference ? [formData.workStylePreference] : []}
                        onChange={(value) => setFormData(prev => ({ ...prev, workStylePreference: value[0] || '' }))}
                      />
                    </div>

                    {/* Career Priorities */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">Career Priorities</label>
                      <p className="text-xs text-gray-600 mb-4">Choose up to 3 priorities that matter most to you</p>
                      <ChipSelect
                        options={careerPrioritiesOptions}
                        selected={formData.careerPriorities}
                        onChange={(value) => handleTopThree('careerPriorities', value[value.length - 1] || '')}
                        limit={3}
                      />
                    </div>

                    {/* Career Goal */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">Career Goal</label>
                      <p className="text-xs text-gray-600 mb-4">Select one option that best matches your current goal</p>
                      <ChipSelect
                        options={careerGoalOptions}
                        selected={formData.careerGoal ? [formData.careerGoal] : []}
                        onChange={(value) => setFormData(prev => ({ ...prev, careerGoal: value[0] || '' }))}
                      />
                    </div>
                  </div>
                </CollapsibleSection>
              )}

              {/* AI Personalization Insights */}
              {(activeNav === 'ai-insights' || activeNav === null) && (
                <CollapsibleSection
                  title="AI Personalization Insights"
                  icon={Sparkles}
                  isOpen={openSections.aiInsights}
                  onToggle={() => toggleSection('aiInsights')}
                >
                  <div className="space-y-6">
                    {/* Analytics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Career Match Score */}
                      <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200/50 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-gray-900">Career Match</h4>
                          <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="text-3xl font-bold text-indigo-600">{completion}%</div>
                        <p className="text-xs text-gray-600 mt-2">Based on your profile</p>
                      </div>

                      {/* Confidence */}
                      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-gray-900">Confidence Level</h4>
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="text-3xl font-bold text-emerald-600">85%</div>
                        <p className="text-xs text-gray-600 mt-2">Recommendation strength</p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-blue-50 border border-blue-200/50 p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900">Complete your profile for better insights</p>
                        <p className="text-xs text-blue-700 mt-1">Fill in more details to get personalized career recommendations and AI-powered suggestions</p>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>
              )}

              {/* Email Settings */}
              {(activeNav === 'email' || activeNav === null) && (
                <CollapsibleSection
                  title="Email Settings"
                  icon={Mail}
                  isOpen={openSections.email}
                  onToggle={() => toggleSection('email')}
                >
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Current Email</label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">Verified</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">New Email</label>
                        <input
                          type="email"
                          name="newEmail"
                          value={emailForm.newEmail || user?.email || ''}
                          onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                          placeholder="Enter new email address"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white hover:border-indigo-300 focus:border-indigo-500 focus:bg-indigo-50/30 outline-none transition-colors"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Current Password</label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={emailForm.currentPassword}
                          onChange={(e) => setEmailForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder="Confirm your current password"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white hover:border-indigo-300 focus:border-indigo-500 focus:bg-indigo-50/30 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleEmailSubmit}
                        disabled={savingEmail}
                        className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {savingEmail ? 'Updating...' : 'Update Email'}
                      </button>
                    </div>
                  </div>
                </CollapsibleSection>
              )}

              {/* Password & Security */}
              {(activeNav === 'security' || activeNav === null) && (
                <CollapsibleSection
                  title="Password & Security"
                  icon={ShieldCheck}
                  isOpen={openSections.security}
                  onToggle={() => toggleSection('security')}
                >
                  <div className="space-y-5">
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-200/50 p-4 flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-900">Account Secure</p>
                        <p className="text-xs text-emerald-700 mt-1">Your account security is our top priority</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Current Password</label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder="Enter your current password"
                          className={`w-full px-4 py-3 rounded-xl border-2 transition-colors outline-none ${
                            passwordErrors.currentPassword
                              ? 'border-red-400 bg-red-50'
                              : 'border-gray-200 bg-white hover:border-indigo-300 focus:border-indigo-500 focus:bg-indigo-50/30'
                          }`}
                        />
                        {passwordErrors.currentPassword && <p className="text-sm text-red-600 mt-2">{passwordErrors.currentPassword}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">New Password</label>
                        <input
                          type="password"
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Minimum 6 characters"
                          className={`w-full px-4 py-3 rounded-xl border-2 transition-colors outline-none ${
                            passwordErrors.newPassword
                              ? 'border-red-400 bg-red-50'
                              : 'border-gray-200 bg-white hover:border-indigo-300 focus:border-indigo-500 focus:bg-indigo-50/30'
                          }`}
                        />
                        {passwordErrors.newPassword && <p className="text-sm text-red-600 mt-2">{passwordErrors.newPassword}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Confirm Password</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Re-enter new password"
                          className={`w-full px-4 py-3 rounded-xl border-2 transition-colors outline-none ${
                            passwordErrors.confirmPassword
                              ? 'border-red-400 bg-red-50'
                              : 'border-gray-200 bg-white hover:border-indigo-300 focus:border-indigo-500 focus:bg-indigo-50/30'
                          }`}
                        />
                        {passwordErrors.confirmPassword && <p className="text-sm text-red-600 mt-2">{passwordErrors.confirmPassword}</p>}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handlePasswordSubmit}
                        disabled={savingPassword}
                        className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {savingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                </CollapsibleSection>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
