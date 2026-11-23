import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Navigate } from 'react-router-dom';
import { Users, FileText, CreditCard, Briefcase, CheckCircle, Clock, Download, Plus, X, MessageSquare, Eye, ChevronDown, ChevronUp, Building2, ExternalLink, MoreVertical } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getFileKind } from '../lib/fileKind';
import type { Client, Application, Document as DocType, Payment, Job } from '../services/types';
import * as applicationsService from '../services/applicationsService';
import * as documentsService from '../services/documentsService';
import * as paymentsService from '../services/paymentsService';
import * as jobsService from '../services/jobsService';
import * as storageService from '../services/storageService';
import * as adminService from '../services/adminService';
import type { AdminPartner } from '../services/adminService';
import type { PartnerCandidate } from '../services/partnerCandidatesService';
import { CANDIDATE_DOC_TYPE_LABELS, formatCandidateRef } from '../services/partnerCandidatesService';
import { useHeaderHidden } from '../hooks/useHeaderHidden';
import { filterBySearch } from '../lib/search';
import SearchInput from '../components/SearchInput';

type Tab = 'clients' | 'applications' | 'documents' | 'payments' | 'jobs' | 'partners';

interface ApplicationWithDetails extends Application {
  client?: Client;
  data?: Record<string, unknown>;
  user_path?: string;
}

const Admin: React.FC = () => {
  const { client: currentClient, loading: authLoading, isAdmin } = useAuth();
  const headerHidden = useHeaderHidden();
  const [activeTab, setActiveTab] = useState<Tab>('applications');
  const [clients, setClients] = useState<Client[]>([]);
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [documents, setDocuments] = useState<(DocType & { client?: Client })[]>([]);
  const [payments, setPayments] = useState<(Payment & { client?: Client })[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [partners, setPartners] = useState<AdminPartner[]>([]);
  // Drill-down: Partners list -> one partner's candidates -> one candidate's
  // full data, each its own screen rather than an inline-expanding accordion
  // (which got confusing and hard to navigate once a partner had many
  // candidates — see the "partners drill-down" discussion).
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  // Rendered through a portal (see below) — the row it belongs to sits inside
  // overflow-x-auto/overflow-hidden ancestors (for the mobile scroll fix and
  // rounded corners), which would otherwise clip the dropdown instead of
  // letting it float above the page. Position is the button's own screen
  // coordinates, captured when it's clicked.
  const [partnerMenu, setPartnerMenu] = useState<{ id: string; top: number; right: number } | null>(null);
  // Loaded on demand per partner (not part of the initial dashboard fetch) —
  // read-only, so the admin can see what a partner submitted; see
  // clients.ts's partner-candidates admin branch.
  const [partnerCandidates, setPartnerCandidates] = useState<Record<string, PartnerCandidate[]>>({});
  const [loadingPartnerCandidates, setLoadingPartnerCandidates] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Each list keeps its own search term — previously a single shared
  // `searchTerm` leaked between tabs (typing in Applications left the same
  // text pre-filled and still filtering when you switched to Clients).
  const [applicationSearch, setApplicationSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [documentSearch, setDocumentSearch] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerCandidateSearch, setPartnerCandidateSearch] = useState('');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; kind: 'image' | 'pdf' } | null>(null);
  // Tracks which individual preview/download buttons are mid-request, keyed per
  // button so only the clicked one shows a spinner (Preview/Download can each be
  // slow — Neon's free-tier compute cold-starts after idling — with no other
  // visual feedback otherwise).
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const isLoading = (key: string) => loadingKeys.has(key);
  const runWithLoading = async (key: string, fn: () => Promise<void>) => {
    setLoadingKeys((prev) => new Set(prev).add(key));
    try {
      await fn();
    } finally {
      setLoadingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  useEffect(() => {
    if (isAdmin) fetchAllData();
  }, [isAdmin]);

  const fetchAllData = async () => {
    setLoading(true);
    // One request instead of 5 — see adminService.getAdminDashboard's comment.
    const {
      clients: clientsData,
      applications: appsData,
      documents: docsData,
      payments: paymentsData,
      jobs: jobsData,
      partners: partnersData,
    } = await adminService.getAdminDashboard();

    setClients(clientsData);

    const clientMap = Object.fromEntries(clientsData.map(c => [c.id, c]));
    setApplications(appsData.map(a => ({ ...a, client: clientMap[a.client_id as string] })));
    setDocuments(docsData.map(d => ({ ...d, client: clientMap[d.client_id] })));
    setPayments(paymentsData.map(p => ({ ...p, client: clientMap[p.client_id] })));
    setJobs(jobsData);
    setPartners(partnersData);
    setLoading(false);
  };

  const setPartnerStatus = async (id: string, registration_status: AdminPartner['registration_status']) => {
    await adminService.setPartnerRegistrationStatus(id, registration_status);
    fetchAllData();
  };

  const selectPartner = async (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    setSelectedCandidateId(null);
    setPartnerCandidateSearch('');
    if (!partnerCandidates[partnerId]) {
      setLoadingPartnerCandidates(partnerId);
      const candidates = await adminService.getPartnerCandidates(partnerId);
      setPartnerCandidates((prev) => ({ ...prev, [partnerId]: candidates }));
      setLoadingPartnerCandidates(null);
    }
  };

  const updateApplicationStatus = async (id: string, status: string) => {
    await applicationsService.updateApplicationStatus(id, status);
    fetchAllData();
  };

  const verifyDocument = async (id: string) => {
    await documentsService.verifyDocument(id, currentClient?.id);
    fetchAllData();
  };

  const updatePayment = async (id: string, status: string) => {
    await paymentsService.updatePaymentStatus(id, status, currentClient?.id);
    fetchAllData();
  };

  const addPayment = async (clientId: string, phase: number, amount: number) => {
    await paymentsService.addPayment(clientId, phase, amount);
    setShowModal(null);
    fetchAllData();
  };

  const saveJob = async (job: Partial<Job>) => {
    if (job.id) {
      await jobsService.updateJob(job.id, job);
    } else {
      await jobsService.createJob(job);
    }
    setShowModal(null);
    setEditingItem(null);
    fetchAllData();
  };

  const deleteJob = async (id: string) => {
    if (!confirm('Delete this job?')) return;
    await jobsService.deleteJob(id);
    fetchAllData();
  };

  const downloadDocument = async (doc: DocType) => {
    const data = await storageService.downloadDocument('client', doc.file_path);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      a.click();
    }
  };

  // Opens a PDF/image inline in a modal on this same page. Word docs can't be
  // previewed by any browser, so those fall back to telling the admin to download.
  const previewDocument = async (filePath: string, name?: string) => {
    const kind = getFileKind(filePath);
    if (kind === 'other') {
      alert('Preview is not available for this file type — use Download instead.');
      return;
    }
    const url = await storageService.getDocumentUrl(filePath);
    if (!url) {
      alert('Failed to open preview');
      return;
    }
    setPreviewFile({ url, name: name || filePath.split('/').pop() || 'Document', kind });
  };

  // Chatbot-attached documents (CV, passport, etc.) live inside an application's
  // own data.uploadedDocuments, not the documents table — so they need their own
  // download path, same ImageKit 'admin'-kind bucket ChatbotInterface uploaded to.
  const downloadApplicationDocument = async (filePath: string, fieldName: string) => {
    const data = await storageService.downloadDocument('admin', filePath);
    if (!data) {
      alert(`Failed to download ${fieldName}`);
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filePath.split('/').pop() || `${fieldName}-document`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center pt-20">
      <div className="animate-spin w-8 h-8 border-4 border-coral border-t-transparent rounded-full"></div>
    </div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800',
      verified: 'bg-emerald-100 text-emerald-800',
      student_university: 'bg-purple-100 text-purple-800',
      worker_job: 'bg-blue-100 text-blue-800',
      student_job: 'bg-indigo-100 text-indigo-800',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status?.replace('_', ' ')}
    </span>;
  };

  const getUserPathLabel = (path: string) => {
    const labels: Record<string, string> = {
      student_university: 'Student - University',
      worker_job: 'Worker - Job Search',
      student_job: 'Student - Job Search',
      company: 'Company'
    };
    return labels[path] || path;
  };

  const renderConversationData = (data: Record<string, unknown>) => {
    if (!data) return null;
    
    // uploadedDocuments gets its own preview/download buttons below — excluded here
    // so it doesn't render as the literal string "[object Object]".
    const excludeFields = ['savedAt', 'userPath', 'uploadedDocuments', 'selectedJob'];
    const fieldLabels: Record<string, string> = {
      educationLevel: 'Education Level',
      targetCountries: 'Target Countries',
      fieldOfStudy: 'Field of Study',
      budget: 'Budget',
      startDate: 'Start Date',
      skills: 'Skills',
      experienceYears: 'Experience',
      salaryExpectation: 'Salary Expectation',
      availability: 'Availability',
      fullName: 'Full Name',
      email: 'Email',
      whatsapp: 'WhatsApp',
      nationality: 'Nationality',
      selectedJob: 'Selected Job',
      uploadedDocuments: 'Uploaded Documents'
    };

    return (
      <div className="grid grid-cols-2 gap-3 mt-4 p-4 bg-gray-50 rounded-lg">
        {Object.entries(data)
          .filter(([key]) => !excludeFields.includes(key))
          .map(([key, value]) => (
            <div key={key} className="text-sm">
              <span className="text-gray-500 block">{fieldLabels[key] || key}:</span>
              <span className="text-navy font-medium">
                {Array.isArray(value) ? value.join(', ') : String(value || '-')}
              </span>
            </div>
          ))
        }
      </div>
    );
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'applications', label: 'Applications', icon: MessageSquare, count: applications.length },
    { id: 'clients', label: 'Clients', icon: Users, count: clients.length },
    { id: 'documents', label: 'Documents', icon: FileText, count: documents.length },
    { id: 'payments', label: 'Payments', icon: CreditCard, count: payments.length },
    { id: 'jobs', label: 'Jobs', icon: Briefcase, count: jobs.length },
    { id: 'partners', label: 'Partners', icon: Building2, count: partners.length },
  ];

  const filteredClients = filterBySearch(clients, clientSearch, (c) => [c.full_name, c.email]);

  const filteredApplications = filterBySearch(applications, applicationSearch, (a) => [
    a.client?.full_name, a.client?.email, a.user_path,
  ]);

  const filteredDocuments = filterBySearch(documents, documentSearch, (d) => [
    d.client?.full_name, d.file_name, d.document_type,
  ]);

  const filteredPayments = filterBySearch(payments, paymentSearch, (p) => [
    p.client?.full_name, String(p.phase), p.status,
  ]);

  const filteredJobs = filterBySearch(jobs, jobSearch, (j) => [j.title, j.company, j.location, j.country]);

  const filteredPartners = filterBySearch(partners, partnerSearch, (p) => [
    p.company_name, p.code, p.contact_person_name, p.contact_email,
  ]);

  return (
    <div className="font-inter pt-20 min-h-screen bg-gray-50">
      <div className="bg-navy py-6">
        <div className="container mx-auto px-4">
          <h1 className="font-orbitron text-2xl font-bold text-white">Admin Console</h1>
          <p className="text-gray-300 text-sm mt-1">Manage applications, clients, and jobs</p>
        </div>
      </div>

      {/* The sticky offset itself tracks the header's visibility (not a
          transform — a transform would also shift this element's normal,
          not-yet-stuck position, leaving a gap right after the banner above).
          `top` only ever matters once this is actually stuck, so switching it
          between 0 and the header's height has no effect until then. */}
      <div
        className={`bg-white border-b sticky z-10 transition-[top] duration-300 ease-in-out ${
          headerHidden ? 'top-0' : 'top-20'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex space-x-6 overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center py-4 border-b-2 font-medium whitespace-nowrap transition ${
                  activeTab === id ? 'border-coral text-coral' : 'border-transparent text-gray-600 hover:text-coral'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {label}
                <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-coral border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : (
          <>
            {/* Applications Tab - Enhanced with conversation data */}
            {activeTab === 'applications' && (
              <div>
                <div className="mb-4 flex items-center gap-4">
                  <SearchInput value={applicationSearch} onChange={setApplicationSearch} placeholder="Search applications..." />
                </div>

                <div className="space-y-4">
                  {filteredApplications.map((app) => (
                    <div key={app.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 transition overflow-x-auto"
                        onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                      >
                        <div className="flex items-center justify-between gap-4 min-w-max">
                          <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="w-10 h-10 bg-coral/10 rounded-full flex items-center justify-center">
                              <MessageSquare className="w-5 h-5 text-coral" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-navy whitespace-nowrap">
                                {app.data?.fullName as string || app.client?.full_name || 'Unknown'}
                              </h3>
                              <p className="text-sm text-gray-500 whitespace-nowrap">
                                {app.data?.email as string || app.client?.email || 'No email'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {getStatusBadge(app.user_path || app.application_type)}
                            {getStatusBadge(app.status)}
                            <select
                              value={app.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                              className="text-sm border rounded px-2 py-1 bg-white"
                            >
                              <option value="pending">Pending</option>
                              <option value="in_review">In Review</option>
                              <option value="documents_requested">Docs Requested</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                            {expandedApp === app.id ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 min-w-max">
                          <span className="whitespace-nowrap">Path: {getUserPathLabel(app.user_path || '')}</span>
                          <span className="whitespace-nowrap">Created: {new Date(app.created_at).toLocaleDateString()}</span>
                          {app.data?.whatsapp && (
                            <a
                              href={`https://wa.me/${(app.data.whatsapp as string).replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-green-600 hover:underline whitespace-nowrap"
                            >
                              WhatsApp: {app.data.whatsapp as string}
                            </a>
                          )}
                        </div>
                      </div>
                      
                      {/* Expanded conversation data */}
                      {expandedApp === app.id && app.data && (
                        <div className="border-t px-4 pb-4">
                          <h4 className="font-semibold text-navy mt-4 mb-2 flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            Conversation Data
                          </h4>
                          {renderConversationData(app.data as Record<string, unknown>)}
                          
                          {/* Uploaded documents section */}
                          {app.data.uploadedDocuments && (
                            <div className="mt-4">
                              <h5 className="font-medium text-navy mb-2">Uploaded Documents:</h5>
                              <div className="space-y-2">
                                {/* Current format: Record<string, string> (field name -> file path) */}
                                {typeof app.data.uploadedDocuments === 'object' && !Array.isArray(app.data.uploadedDocuments) ? (
                                  Object.entries(app.data.uploadedDocuments as Record<string, string>).map(([fieldName, filePath]) => (
                                    <div key={fieldName} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                      <div className="flex items-center">
                                        <FileText className="w-5 h-5 text-coral mr-3 flex-shrink-0" />
                                        <span className="font-medium text-navy capitalize">{fieldName.replace(/([A-Z])/g, ' $1').trim()}</span>
                                      </div>
                                      <div className="flex items-center space-x-1 flex-shrink-0">
                                        <button
                                          onClick={() => runWithLoading(`preview-${app.id}-${fieldName}`, () => previewDocument(String(filePath), fieldName))}
                                          disabled={isLoading(`preview-${app.id}-${fieldName}`)}
                                          className="p-2 text-gray-500 hover:text-coral transition disabled:opacity-50"
                                          title="Preview"
                                        >
                                          {isLoading(`preview-${app.id}-${fieldName}`) ? (
                                            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                          ) : (
                                            <Eye className="w-5 h-5" />
                                          )}
                                        </button>
                                        <button
                                          onClick={() => runWithLoading(`download-${app.id}-${fieldName}`, () => downloadApplicationDocument(String(filePath), fieldName))}
                                          disabled={isLoading(`download-${app.id}-${fieldName}`)}
                                          className="p-2 text-gray-500 hover:text-coral transition disabled:opacity-50"
                                          title="Download"
                                        >
                                          {isLoading(`download-${app.id}-${fieldName}`) ? (
                                            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                          ) : (
                                            <Download className="w-5 h-5" />
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  /* Legacy format: string[] (just field names, no file path to download) */
                                  (Array.isArray(app.data.uploadedDocuments) ? app.data.uploadedDocuments : []).map((doc: string, i: number) => (
                                    <div key={i} className="flex items-center bg-gray-50 p-3 rounded-lg">
                                      <FileText className="w-5 h-5 text-coral mr-3 flex-shrink-0" />
                                      <span className="font-medium text-navy">{doc}</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}

                          {/* Selected job — current submissions store a snapshot
                              object (title/company/location/salary/type); older
                              applications only have the raw job id string, so fall
                              back to showing that when it's not an object. */}
                          {app.data.selectedJob && (
                            <div className="mt-4 p-3 bg-green-50 rounded-lg">
                              <h5 className="font-medium text-green-800 mb-1">Selected Job</h5>
                              {typeof app.data.selectedJob === 'object' ? (
                                <div className="text-sm text-green-700">
                                  <p className="font-medium">{(app.data.selectedJob as { title?: string }).title}</p>
                                  <p>
                                    {(app.data.selectedJob as { company?: string }).company}
                                    {' · '}
                                    {(app.data.selectedJob as { location?: string }).location}
                                    {(app.data.selectedJob as { salary?: string }).salary
                                      ? ` · ${(app.data.selectedJob as { salary?: string }).salary}`
                                      : ''}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-sm text-green-700">Job ID: {app.data.selectedJob as string}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {filteredApplications.length === 0 && (
                  <p className="text-center py-8 text-gray-500">No applications found.</p>
                )}
              </div>
            )}

            {activeTab === 'clients' && (
              <div>
                <div className="mb-4 flex items-center">
                  <SearchInput value={clientSearch} onChange={setClientSearch} placeholder="Search clients..." />
                </div>
                <div className="bg-white rounded-xl overflow-x-auto shadow-sm">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredClients.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">{c.full_name}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{c.email}</td>
                          <td className="px-4 py-3">{getStatusBadge(c.role)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{new Date(c.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div>
                <div className="mb-4 flex items-center gap-4">
                  <SearchInput value={documentSearch} onChange={setDocumentSearch} placeholder="Search documents..." />
                </div>
              <div className="bg-white rounded-xl overflow-x-auto shadow-sm">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Document</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">{doc.client?.full_name || 'Unknown'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{doc.file_name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{doc.document_type}</td>
                        <td className="px-4 py-3">
                          {doc.is_verified ? (
                            <span className="flex items-center text-green-600 text-sm">
                              <CheckCircle className="w-4 h-4 mr-1" /> Verified
                            </span>
                          ) : (
                            <span className="flex items-center text-yellow-600 text-sm">
                              <Clock className="w-4 h-4 mr-1" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => runWithLoading(`preview-doc-${doc.id}`, () => previewDocument(doc.file_path, doc.file_name))}
                              disabled={isLoading(`preview-doc-${doc.id}`)}
                              className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                              title="Preview"
                            >
                              {isLoading(`preview-doc-${doc.id}`) ? (
                                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => runWithLoading(`download-doc-${doc.id}`, () => downloadDocument(doc))}
                              disabled={isLoading(`download-doc-${doc.id}`)}
                              className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                              title="Download"
                            >
                              {isLoading(`download-doc-${doc.id}`) ? (
                                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </button>
                            {!doc.is_verified && (
                              <button onClick={() => verifyDocument(doc.id)} className="text-green-600 hover:text-green-800">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredDocuments.length === 0 && <p className="text-center py-8 text-gray-500">No documents uploaded yet.</p>}
              </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <div className="mb-4">
                  <button
                    onClick={() => setShowModal('payment')}
                    className="bg-coral text-white px-4 py-2 rounded-lg font-medium hover:bg-coral-dark transition flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Payment
                  </button>
                </div>
                <div className="mb-4 flex items-center gap-4">
                  <SearchInput value={paymentSearch} onChange={setPaymentSearch} placeholder="Search payments..." />
                </div>
                <div className="bg-white rounded-xl overflow-x-auto shadow-sm">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Client</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phase</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">{payment.client?.full_name || 'Unknown'}</td>
                          <td className="px-4 py-3">
                            <span className="bg-navy text-white text-xs px-2 py-1 rounded whitespace-nowrap">Phase {payment.phase}</span>
                          </td>
                          <td className="px-4 py-3 font-medium whitespace-nowrap">{payment.currency} {payment.amount}</td>
                          <td className="px-4 py-3">{getStatusBadge(payment.status)}</td>
                          <td className="px-4 py-3">
                            <select
                              value={payment.status}
                              onChange={(e) => updatePayment(payment.id, e.target.value)}
                              className="text-sm border rounded px-2 py-1"
                            >
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                              <option value="verified">Verified</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredPayments.length === 0 && <p className="text-center py-8 text-gray-500">No payments recorded yet.</p>}
                </div>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div>
                <div className="mb-4">
                  <button
                    onClick={() => { setEditingItem({}); setShowModal('job'); }}
                    className="bg-coral text-white px-4 py-2 rounded-lg font-medium hover:bg-coral-dark transition flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Job
                  </button>
                </div>
                <div className="mb-4 flex items-center gap-4">
                  <SearchInput value={jobSearch} onChange={setJobSearch} placeholder="Search jobs..." />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredJobs.map((job) => (
                    <div key={job.id} className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-navy">{job.title}</h3>
                          <p className="text-sm text-gray-500">{job.company} - {job.location}, {job.country}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${job.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {job.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {job.salary_range && (
                        <p className="text-sm text-coral font-medium mb-2">{job.salary_range}</p>
                      )}
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{job.description}</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => { setEditingItem(job); setShowModal('job'); }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button onClick={() => deleteJob(job.id)} className="text-red-600 hover:text-red-800 text-sm">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {filteredJobs.length === 0 && <p className="text-center py-8 text-gray-500">No jobs posted yet.</p>}
              </div>
            )}

            {activeTab === 'partners' && (() => {
              const selectedPartner = partners.find((p) => p.id === selectedPartnerId);

              // Screen 3: one candidate's full data.
              if (selectedPartner && selectedCandidateId) {
                const cand = (partnerCandidates[selectedPartner.id] || []).find((c) => c.id === selectedCandidateId);
                if (!cand) return null;
                const candDocs = documents.filter((d) => d.partner_candidate_id === cand.id);
                const videoLink = (url: string | null) => url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-coral hover:underline inline-flex items-center gap-1">
                    Open link <ExternalLink className="w-3 h-3" />
                  </a>
                ) : '—';
                const DETAIL_FIELDS: { label: string; value: React.ReactNode }[] = [
                  { label: 'Full name', value: cand.full_name || '—' },
                  { label: 'Gender', value: cand.gender || '—' },
                  { label: 'Date of birth', value: cand.date_of_birth || '—' },
                  { label: 'Nationality', value: cand.nationality || '—' },
                  { label: 'Country of birth', value: cand.country_of_birth || '—' },
                  { label: 'Place of birth', value: cand.place_of_birth || '—' },
                  { label: 'Marital status', value: cand.marital_status || '—' },
                  { label: "Father's full name", value: cand.father_name || '—' },
                  { label: "Mother's full name", value: cand.mother_name || '—' },
                  { label: 'Phone / WhatsApp', value: cand.phone || '—' },
                  { label: 'Email', value: cand.email || '—' },
                  { label: 'Country of residence', value: cand.country_of_residence || '—' },
                  { label: 'City', value: cand.residence_city || '—' },
                  { label: 'Municipality', value: cand.residence_municipality || '—' },
                  { label: 'Street', value: cand.residence_street || '—' },
                  { label: 'House number', value: cand.residence_house_number || '—' },
                  { label: 'EU citizenship', value: cand.eu_citizenship === null ? '—' : cand.eu_citizenship ? 'Yes' : 'No' },
                  { label: 'Passport number', value: cand.passport_number || '—' },
                  { label: 'Passport place of issue', value: cand.passport_place_of_issue || '—' },
                  { label: 'Passport issue date', value: cand.passport_issue_date || '—' },
                  { label: 'Passport expiry date', value: cand.passport_expiry_date || '—' },
                  { label: 'Highest education', value: cand.highest_education || '—' },
                  { label: 'Previous work experience', value: cand.work_experience || '—' },
                  { label: 'Previous travel and visa history', value: cand.travel_visa_history || '—' },
                  { label: 'Target country', value: cand.target_country || '—' },
                  { label: 'Job category', value: cand.job_category || '—' },
                  { label: 'Driving licence', value: cand.driving_licence === null ? '—' : cand.driving_licence ? 'Yes' : 'No' },
                  { label: 'Driving licence conversion', value: cand.driving_licence_conversion_status || '—' },
                  { label: 'Introduction video', value: videoLink(cand.intro_video_url) },
                  { label: 'Skills demonstration video', value: videoLink(cand.video_url) },
                  { label: 'Placement status', value: cand.placement_status },
                  { label: 'Created', value: new Date(cand.created_at).toLocaleString() },
                  { label: 'Last updated', value: new Date(cand.updated_at).toLocaleString() },
                ];
                return (
                  <div>
                    <button onClick={() => setSelectedCandidateId(null)} className="text-sm text-gray-500 hover:text-coral mb-4">
                      ← Back to {selectedPartner.company_name}'s candidates
                    </button>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-orbitron text-xl font-bold text-navy">
                        {cand.full_name || 'Not yet filled in'}
                        {selectedPartner.code && (
                          <span className="text-gray-400 font-medium ml-2">
                            ({formatCandidateRef(selectedPartner.code, cand.candidate_number)})
                          </span>
                        )}
                      </h3>
                      {getStatusBadge(cand.status)}
                    </div>
                    {cand.status === 'changes_requested' && cand.changes_requested_note && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-sm text-amber-800">
                        <strong>Changes requested:</strong> {cand.changes_requested_note}
                      </div>
                    )}
                    <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        {DETAIL_FIELDS.map((f) => (
                          <div key={f.label}>
                            <p className="text-xs font-semibold text-gray-500 uppercase">{f.label}</p>
                            <p className="text-sm text-navy mt-0.5">{f.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                      <h4 className="font-semibold text-navy mb-3">Documents</h4>
                      {candDocs.length === 0 ? (
                        <p className="text-sm text-gray-500">No documents uploaded yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {candDocs.map((doc) => (
                            <button
                              key={doc.id}
                              onClick={() => runWithLoading(`preview-cand-doc-${doc.id}`, () => previewDocument(doc.file_path, doc.file_name))}
                              disabled={isLoading(`preview-cand-doc-${doc.id}`)}
                              className="text-sm bg-gray-50 border rounded-lg px-3 py-2 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                            >
                              {CANDIDATE_DOC_TYPE_LABELS[doc.document_type as keyof typeof CANDIDATE_DOC_TYPE_LABELS] ?? doc.document_type}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Screen 2: one partner's submitted candidates. Drafts are left
              // out — a candidate the partner/candidate hasn't finished
              // filling in yet isn't ready for admin to act on.
              if (selectedPartner) {
                const submittedCandidates = partnerCandidates[selectedPartner.id]?.filter((c) => c.status !== 'draft');
                const candidates = submittedCandidates && filterBySearch(submittedCandidates, partnerCandidateSearch, (c) => [
                  c.full_name, c.nationality, c.target_country, c.job_category,
                  selectedPartner.code ? formatCandidateRef(selectedPartner.code, c.candidate_number) : null,
                ]);
                return (
                  <div>
                    <button onClick={() => setSelectedPartnerId(null)} className="text-sm text-gray-500 hover:text-coral mb-4">
                      ← Back to Partners
                    </button>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-orbitron text-xl font-bold text-navy">
                        {selectedPartner.company_name}
                        {selectedPartner.code && <span className="text-gray-400 font-medium ml-2">({selectedPartner.code})</span>}
                      </h3>
                      {getStatusBadge(selectedPartner.registration_status)}
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      {selectedPartner.contact_person_name} — {selectedPartner.contact_email}
                    </p>
                    <h4 className="font-semibold text-navy mb-2">Submitted Candidates</h4>
                    {submittedCandidates && submittedCandidates.length > 0 && (
                      <div className="mb-3 flex items-center gap-4">
                        <SearchInput value={partnerCandidateSearch} onChange={setPartnerCandidateSearch} placeholder="Search candidates..." />
                      </div>
                    )}
                    {loadingPartnerCandidates === selectedPartner.id ? (
                      <div className="text-center py-6">
                        <div className="animate-spin w-6 h-6 border-4 border-coral border-t-transparent rounded-full mx-auto"></div>
                      </div>
                    ) : !candidates || candidates.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        {submittedCandidates && submittedCandidates.length > 0 ? 'No candidates match your search.' : 'No candidates submitted yet.'}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {candidates.map((cand) => (
                          <div
                            key={cand.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedCandidateId(cand.id)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedCandidateId(cand.id); }}
                            className="cursor-pointer bg-white border rounded-lg p-3 hover:bg-gray-50 transition overflow-x-auto"
                          >
                            <div className="flex items-center justify-between gap-4 min-w-max">
                              <div>
                                <p className="font-medium text-navy whitespace-nowrap">
                                  {cand.full_name || 'Not yet filled in'}
                                  {selectedPartner.code && (
                                    <span className="text-gray-400 font-normal ml-2">
                                      ({formatCandidateRef(selectedPartner.code, cand.candidate_number)})
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500 whitespace-nowrap">
                                  {cand.nationality || '—'} → {cand.target_country || '—'} · {cand.job_category || '—'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {getStatusBadge(cand.status)}
                                <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              // Screen 1: every partner.
              return (
                <div>
                  {partners.length > 0 && (
                    <div className="mb-4 flex items-center gap-4">
                      <SearchInput value={partnerSearch} onChange={setPartnerSearch} placeholder="Search partners..." />
                    </div>
                  )}
                  <div className="space-y-4">
                  {filteredPartners.map((partner) => (
                    <div
                      key={partner.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => selectPartner(partner.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectPartner(partner.id); }}
                      className="cursor-pointer bg-white rounded-xl shadow-sm border p-4 hover:bg-gray-50 transition overflow-x-auto"
                    >
                      <div className="flex items-center justify-between gap-4 min-w-max">
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="w-10 h-10 bg-coral/10 rounded-full flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-coral" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-navy whitespace-nowrap">
                              {partner.company_name}
                              {partner.code && <span className="text-gray-400 font-normal ml-2">({partner.code})</span>}
                            </h3>
                            <p className="text-sm text-gray-500 whitespace-nowrap">
                              {partner.contact_person_name} — {partner.contact_email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                            {partner.candidate_count} submitted
                          </span>
                          {getStatusBadge(partner.registration_status)}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (partnerMenu?.id === partner.id) {
                                setPartnerMenu(null);
                                return;
                              }
                              const rect = e.currentTarget.getBoundingClientRect();
                              setPartnerMenu({ id: partner.id, top: rect.bottom + 4, right: window.innerWidth - rect.right });
                            }}
                            className="p-1 rounded hover:bg-gray-200 text-gray-500"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90" />
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredPartners.length === 0 && (
                    <p className="text-center py-8 text-gray-500">
                      {partners.length > 0 ? 'No partners match your search.' : 'No partners yet.'}
                    </p>
                  )}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>

      {partnerMenu && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setPartnerMenu(null)} />
          <div
            className="fixed w-40 bg-white rounded-lg shadow-lg border py-1 z-50"
            style={{ top: partnerMenu.top, right: partnerMenu.right }}
          >
            {(() => {
              const partner = partners.find((p) => p.id === partnerMenu.id);
              if (!partner) return null;
              return (
                <>
                  {partner.registration_status !== 'approved' && (
                    <button
                      onClick={() => { setPartnerStatus(partner.id, 'approved'); setPartnerMenu(null); }}
                      className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-50"
                    >
                      Approve
                    </button>
                  )}
                  {partner.registration_status !== 'suspended' && (
                    <button
                      onClick={() => { setPartnerStatus(partner.id, 'suspended'); setPartnerMenu(null); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Suspend
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </>,
        document.body
      )}

      {showModal === 'payment' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-orbitron text-xl font-bold text-navy">Add Payment</h3>
              <button onClick={() => setShowModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              addPayment(form.client.value, parseInt(form.phase.value), parseFloat(form.amount.value));
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Client</label>
                  <select name="client" className="w-full border rounded-lg px-3 py-2" required>
                    {clients.filter(c => c.role !== 'admin').map(c => (
                      <option key={c.id} value={c.id}>{c.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phase</label>
                  <select name="phase" className="w-full border rounded-lg px-3 py-2">
                    <option value="1">Phase 1</option>
                    <option value="2">Phase 2</option>
                    <option value="3">Phase 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount (EUR)</label>
                  <input type="number" name="amount" step="0.01" className="w-full border rounded-lg px-3 py-2" required />
                </div>
              </div>
              <button type="submit" className="w-full mt-4 bg-coral text-white py-2 rounded-lg font-medium hover:bg-coral-dark">
                Add Payment
              </button>
            </form>
          </div>
        </div>
      )}

      {showModal === 'job' && editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-orbitron text-xl font-bold text-navy">{editingItem.id ? 'Edit Job' : 'Add Job'}</h3>
              <button onClick={() => { setShowModal(null); setEditingItem(null); }}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              saveJob(editingItem);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input type="text" value={editingItem.title || ''} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Company</label>
                  <input type="text" value={editingItem.company || ''} onChange={(e) => setEditingItem({ ...editingItem, company: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <input type="text" value={editingItem.location || ''} onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Country</label>
                    <input type="text" value={editingItem.country || ''} onChange={(e) => setEditingItem({ ...editingItem, country: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Job Type</label>
                  <select value={editingItem.job_type || 'Full-time'} onChange={(e) => setEditingItem({ ...editingItem, job_type: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Seasonal</option>
                    <option>Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Salary Range</label>
                  <input type="text" value={editingItem.salary_range || ''} onChange={(e) => setEditingItem({ ...editingItem, salary_range: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="e.g., 2,000 - 2,500 EUR/month" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea value={editingItem.description || ''} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} className="w-full border rounded-lg px-3 py-2 h-24" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Requirements</label>
                  <textarea value={editingItem.requirements || ''} onChange={(e) => setEditingItem({ ...editingItem, requirements: e.target.value })} className="w-full border rounded-lg px-3 py-2 h-20" />
                </div>
                {editingItem.id && (
                  <div className="flex items-center">
                    <input type="checkbox" id="is_active" checked={editingItem.is_active} onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })} className="mr-2" />
                    <label htmlFor="is_active" className="text-sm">Active</label>
                  </div>
                )}
              </div>
              <button type="submit" className="w-full mt-4 bg-coral text-white py-2 rounded-lg font-medium hover:bg-coral-dark">
                {editingItem.id ? 'Update Job' : 'Create Job'}
              </button>
            </form>
          </div>
        </div>
      )}

      {previewFile && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-4xl h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-medium text-navy truncate">{previewFile.name}</h3>
              <button onClick={() => setPreviewFile(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100">
              {previewFile.kind === 'image' ? (
                <img src={previewFile.url} alt={previewFile.name} className="max-w-full mx-auto" />
              ) : (
                <iframe src={previewFile.url} className="w-full h-full" title={previewFile.name} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
