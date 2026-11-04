import React, { useEffect, useState, useMemo } from 'react';
import { MapPin, Briefcase, Building, ExternalLink, Search, Filter, DollarSign, Info, X } from 'lucide-react';
import type { Job } from '../services/types';
import * as jobsService from '../services/jobsService';
import { WHATSAPP_LINK } from '../components/chatbot/conversationFlow';

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('');
  const [selectedSalaryType, setSelectedSalaryType] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const data = await jobsService.listActiveJobs();
    setJobs(data);
    setLoading(false);
  };

  // Get unique values for filters
  const countries = useMemo(() => {
    const countrySet = new Set(jobs.map(job => job.country).filter(Boolean));
    return Array.from(countrySet).sort();
  }, [jobs]);

  const jobTypes = useMemo(() => {
    const typeSet = new Set(jobs.map(job => job.job_type).filter(Boolean));
    return Array.from(typeSet).sort();
  }, [jobs]);

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        job.title?.toLowerCase().includes(searchLower) ||
        job.location?.toLowerCase().includes(searchLower) ||
        job.country?.toLowerCase().includes(searchLower) ||
        job.description?.toLowerCase().includes(searchLower) ||
        job.company?.toLowerCase().includes(searchLower);

      // Country filter
      const matchesCountry = !selectedCountry || job.country === selectedCountry;

      // Job type filter
      const matchesJobType = !selectedJobType || job.job_type === selectedJobType;

      // Salary type filter
      const matchesSalaryType = !selectedSalaryType || 
        (selectedSalaryType === 'hourly' && job.salary_range?.toLowerCase().includes('/hour')) ||
        (selectedSalaryType === 'monthly' && job.salary_range?.toLowerCase().includes('/month'));

      return matchesSearch && matchesCountry && matchesJobType && matchesSalaryType;
    });
  }, [jobs, searchTerm, selectedCountry, selectedJobType, selectedSalaryType]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCountry('');
    setSelectedJobType('');
    setSelectedSalaryType('');
  };

  const hasActiveFilters = searchTerm || selectedCountry || selectedJobType || selectedSalaryType;

  return (
    <div className="font-inter pt-16 sm:pt-20">
      {/* Hero */}
      <section className="bg-navy py-8 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-orbitron text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
            Job <span className="text-coral">Opportunities</span>
          </h1>
          <p className="font-space text-base sm:text-xl text-gray-300 max-w-2xl mx-auto px-2">
            Explore verified job opportunities across Europe. Click "Apply to Job" to connect with us via WhatsApp.
          </p>
        </div>
      </section>

      {/* Pay Range Info Section */}
      <section className="bg-gradient-to-r from-coral/10 to-coral/5 py-6 sm:py-8 border-b border-coral/20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-4">
              <DollarSign className="w-6 h-6 text-coral flex-shrink-0" />
              <div className="flex-1">
                <h2 className="font-space font-bold text-lg sm:text-xl text-navy mb-2">Average Pay Ranges</h2>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
                    <span className="text-xs sm:text-sm text-gray-500 block mb-1">Hourly</span>
                    <span className="font-orbitron text-lg sm:text-2xl font-bold text-coral">€5-8.5/hr</span>
                  </div>
                  <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
                    <span className="text-xs sm:text-sm text-gray-500 block mb-1">Monthly</span>
                    <span className="font-orbitron text-lg sm:text-2xl font-bold text-coral">€500-5k/mo</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white rounded-lg p-3 sm:p-4 shadow-sm">
              <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm sm:text-base text-gray-700">
                <span className="font-semibold">Pro Tip:</span> Most positions include accommodation and meal allowances.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-4 sm:py-8 bg-gray-50 sticky top-16 sm:top-20 z-10 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Search Bar */}
            <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent font-inter text-sm sm:text-base"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border transition text-sm sm:text-base ${
                  showFilters || hasActiveFilters
                    ? 'bg-coral text-white border-coral'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-coral'
                }`}
              >
                <Filter className="w-4 sm:w-5 h-4 sm:h-5 sm:mr-2" />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && (
                  <span className="ml-1 sm:ml-2 bg-white text-coral text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                    {[searchTerm, selectedCountry, selectedJobType, selectedSalaryType].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Country</label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-sm sm:text-base"
                    >
                      <option value="">All Countries</option>
                      {countries.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Job Type</label>
                    <select
                      value={selectedJobType}
                      onChange={(e) => setSelectedJobType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-sm sm:text-base"
                    >
                      <option value="">All Types</option>
                      {jobTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Salary Type</label>
                    <select
                      value={selectedSalaryType}
                      onChange={(e) => setSelectedSalaryType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-sm sm:text-base"
                    >
                      <option value="">All Salary Types</option>
                      <option value="hourly">Hourly Pay</option>
                      <option value="monthly">Monthly Salary</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      disabled={!hasActiveFilters}
                      className="w-full px-3 sm:px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
                    >
                      <X className="w-4 h-4 mr-1 sm:mr-2" />
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Results count */}
            <div className="flex items-center justify-between mt-3 sm:mt-4">
              <p className="text-xs sm:text-sm text-gray-600">
                <span className="font-semibold text-navy">{filteredJobs.length}</span> of {jobs.length} jobs
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs sm:text-sm text-coral hover:text-coral-dark flex items-center"
                >
                  <X className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Jobs Grid */}
      <section className="py-8 sm:py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-8 sm:py-12">
              <div className="animate-spin w-8 h-8 border-4 border-coral border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="max-w-md mx-auto px-4">
                <Briefcase className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <h3 className="font-space font-semibold text-lg sm:text-xl text-navy mb-2">No jobs found</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">Try adjusting your search or filters.</p>
                <button
                  onClick={clearFilters}
                  className="text-coral hover:text-coral-dark font-medium text-sm sm:text-base"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto">
              {filteredJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-space font-bold text-lg sm:text-xl text-navy mb-1 truncate">{job.title}</h3>
                      {job.company && (
                        <div className="flex items-center text-gray-500 text-xs sm:text-sm">
                          <Building className="w-3 sm:w-4 h-3 sm:h-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{job.company}</span>
                        </div>
                      )}
                    </div>
                    <span className="bg-coral/10 text-coral text-xs font-semibold px-2 sm:px-3 py-1 rounded-full flex-shrink-0">
                      {job.job_type}
                    </span>
                  </div>

                  <div className="flex items-center text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">
                    <MapPin className="w-3 sm:w-4 h-3 sm:h-4 mr-1 text-coral flex-shrink-0" />
                    {job.location}, {job.country}
                  </div>

                  <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">{job.description}</p>

                  {job.salary_range && (
                    <div className="flex items-center text-navy font-semibold text-xs sm:text-sm mb-3 sm:mb-4 bg-green-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                      <DollarSign className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2 text-green-600 flex-shrink-0" />
                      <span className="text-green-700">{job.salary_range}</span>
                    </div>
                  )}

                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-coral text-white py-2.5 sm:py-3 rounded-lg font-space font-semibold hover:bg-coral-dark transition flex items-center justify-center text-sm sm:text-base"
                  >
                    Apply to Job <ExternalLink className="w-3 sm:w-4 h-3 sm:h-4 ml-2" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 sm:py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-orbitron text-xl sm:text-2xl font-bold text-navy mb-3 sm:mb-4">
            Don't see the right job?
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">
            Submit your profile and we'll match you with upcoming opportunities.
          </p>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-coral text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-space font-semibold hover:bg-coral-dark transition inline-flex items-center text-sm sm:text-base"
          >
            Contact Us on WhatsApp <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </div>
      </section>
    </div>
  );
};

export default Jobs;
