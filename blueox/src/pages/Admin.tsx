import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Users, FileText, CreditCard, Briefcase, CheckCircle, Clock, Download, Plus, X, Search, MessageSquare, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getFileKind } from '../lib/fileKind';
import type { Client, Application, Document as DocType, Payment, Job } from '../services/types';
import * as applicationsService from '../services/applicationsService';
import * as documentsService from '../services/documentsService';
import * as paymentsService from '../services/paymentsService';
import * as jobsService from '../services/jobsService';
import * as storageService from '../services/storageService';
import * as adminService from '../services/adminService';

type Tab = 'clients' | 'applications' | 'documents' | 'payments' | 'jobs';

interface ApplicationWithDetails extends Application {
  client?: Client;
  data?: Record<string, unknown>;
  user_path?: string;
}

const Admin: React.FC = () => {
  const { client: currentClient, loading: authLoading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('applications');
  const [clients, setClients] = useState<Client[]>([]);
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [documents, setDocuments] = useState<(DocType & { client?: Client })[]>([]);
  const [payments, setPayments] = useState<(Payment & { client?: Client })[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
    } = await adminService.getAdminDashboard();

    setClients(clientsData);

    const clientMap = Object.fromEntries(clientsData.map(c => [c.id, c]));
    setApplications(appsData.map(a => ({ ...a, client: clientMap[a.client_id as string] })));
    setDocuments(docsData.map(d => ({ ...d, client: clientMap[d.client_id] })));
    setPayments(paymentsData.map(p => ({ ...p, client: clientMap[p.client_id] })));
    setJobs(jobsData);
    setLoading(false);
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
  ];

  const filteredClients = clients.filter(c => 
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApplications = applications.filter(a => 
    a.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.client?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.user_path?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="font-inter pt-20 min-h-screen bg-gray-50">
      <div className="bg-navy py-6">
        <div className="container mx-auto px-4">
          <h1 className="font-orbitron text-2xl font-bold text-white">Admin Console</h1>
          <p className="text-gray-300 text-sm mt-1">Manage applications, clients, and jobs</p>
        </div>
      </div>

      <div className="bg-white border-b sticky top-20 z-10">
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
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search applications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  {filteredApplications.map((app) => (
                    <div key={app.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <div 
                        className="p-4 cursor-pointer hover:bg-gray-50 transition"
                        onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-coral/10 rounded-full flex items-center justify-center">
                              <MessageSquare className="w-5 h-5 text-coral" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-navy">
                                {app.data?.fullName as string || app.client?.full_name || 'Unknown'}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {app.data?.email as string || app.client?.email || 'No email'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
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
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                          <span>Path: {getUserPathLabel(app.user_path || '')}</span>
                          <span>Created: {new Date(app.created_at).toLocaleDateString()}</span>
                          {app.data?.whatsapp && (
                            <a 
                              href={`https://wa.me/${(app.data.whatsapp as string).replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-green-600 hover:underline"
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
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full">
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
                          <td className="px-4 py-3 font-medium text-navy">{c.full_name}</td>
                          <td className="px-4 py-3 text-gray-600">{c.email}</td>
                          <td className="px-4 py-3">{getStatusBadge(c.role)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                <table className="w-full">
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
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-navy">{doc.client?.full_name || 'Unknown'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{doc.file_name}</td>
                        <td className="px-4 py-3">{doc.document_type}</td>
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
                {documents.length === 0 && <p className="text-center py-8 text-gray-500">No documents uploaded yet.</p>}
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
                <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full">
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
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-navy">{payment.client?.full_name || 'Unknown'}</td>
                          <td className="px-4 py-3">
                            <span className="bg-navy text-white text-xs px-2 py-1 rounded">Phase {payment.phase}</span>
                          </td>
                          <td className="px-4 py-3 font-medium">{payment.currency} {payment.amount}</td>
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
                  {payments.length === 0 && <p className="text-center py-8 text-gray-500">No payments recorded yet.</p>}
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
                <div className="grid md:grid-cols-2 gap-4">
                  {jobs.map((job) => (
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
                {jobs.length === 0 && <p className="text-center py-8 text-gray-500">No jobs posted yet.</p>}
              </div>
            )}
          </>
        )}
      </div>

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
