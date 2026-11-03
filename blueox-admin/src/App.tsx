import React, { useState, useEffect, useRef } from 'react';
import { Users, FileText, CreditCard, Briefcase, CheckCircle, Clock, Download, Plus, X, Search, LogOut, Shield, Trash2, ChevronDown, ChevronUp, Edit2, Upload } from 'lucide-react';
import { SignIn } from '@clerk/clerk-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import type { Client, Application, Document as DocType, Payment, Job, ClientPaymentPhases } from './services/types';
import * as clientsService from './services/clientsService';
import * as applicationsService from './services/applicationsService';
import * as documentsService from './services/documentsService';
import * as paymentsService from './services/paymentsService';
import * as paymentPhasesService from './services/paymentPhasesService';
import * as jobsService from './services/jobsService';
import * as storageService from './services/storageService';

type Tab = 'applications' | 'jobs';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/assets/logo.png" alt="The Blue OX - Earn while you study in Europe" className="h-16 mx-auto mb-4" />
          <h1 className="font-orbitron text-2xl font-bold text-white">Admin Console</h1>
          <p className="text-gray-300 mt-2">Secure access for administrators only</p>
        </div>

        <div className="flex justify-center">
          <SignIn routing="virtual" appearance={{ variables: { colorPrimary: '#FF4040' } }} />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          This is a secure admin area. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const { client: currentClient, signOut, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('applications');
  const [clients, setClients] = useState<Client[]>([]);
  const [applications, setApplications] = useState<(Application & { client?: Client })[]>([]);
  const [documents, setDocuments] = useState<(DocType & { client?: Client })[]>([]);
  const [payments, setPayments] = useState<(Payment & { client?: Client })[]>([]);
  const [paymentPhases, setPaymentPhases] = useState<(ClientPaymentPhases & { client?: Client })[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingApplication, setEditingApplication] = useState<(Application & { client?: Client }) | null>(null);

  useEffect(() => {
    if (isAdmin) fetchAllData();
  }, [isAdmin]);

  const fetchAllData = async () => {
    setLoading(true);

    try {
      const [clientsData, appsRes, docsRes, paymentsRes, paymentPhasesRes, jobsRes] = await Promise.all([
        clientsService.listClients(),
        applicationsService.listApplications(),
        documentsService.listAllDocuments(),
        paymentsService.listPayments(),
        paymentPhasesService.listPaymentPhases(),
        jobsService.listJobs(),
      ]);

      setClients(clientsData);

      const clientMap = Object.fromEntries(clientsData.map(c => [c.id, c]));

      if (appsRes.error) console.log('Applications fetch error:', appsRes.error.message);
      if (docsRes.error) console.log('Documents fetch error:', docsRes.error.message);
      if (paymentsRes.error) console.log('Payments fetch error:', paymentsRes.error.message);
      if (paymentPhasesRes.error) console.log('Payment phases fetch error:', paymentPhasesRes.error.message);
      if (jobsRes.error) console.log('Jobs fetch error:', jobsRes.error.message);

      setApplications(appsRes.data.map(a => ({ ...a, client: clientMap[a.client_id as string] })));
      setDocuments(docsRes.data.map(d => ({ ...d, client: clientMap[d.client_id] })));
      setPayments(paymentsRes.data.map(p => ({ ...p, client: clientMap[p.client_id] })));
      setPaymentPhases(paymentPhasesRes.data.map(pp => ({ ...pp, client: clientMap[pp.client_id] })));
      setJobs(jobsRes.data);

      console.log('Data fetch completed:', {
        clients: clientsData.length,
        applications: appsRes.data.length,
        documents: docsRes.data.length,
        payments: paymentsRes.data.length,
        paymentPhases: paymentPhasesRes.data.length,
        jobs: jobsRes.data.length
      });

    } catch (error) {
      console.error('Data fetch exception:', error);
      // Even on error, set empty arrays to prevent crashes
      setClients([]);
      setApplications([]);
      setDocuments([]);
      setPayments([]);
      setPaymentPhases([]);
      setJobs([]);
    } finally {
      setLoading(false);
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

  const deleteApplication = async (id: string) => {
    if (!confirm('Delete this application? This action cannot be undone.')) return;
    try {
      const { error } = await applicationsService.deleteApplication(id);
      if (error) {
        console.error('Delete error:', error);
        alert(`Failed to delete application: ${error.message}`);
      } else {
        // Remove from expanded rows if it was expanded
        setExpandedRows(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        fetchAllData();
      }
    } catch (err) {
      console.error('Delete exception:', err);
      alert(`Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const toggleRowExpanded = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const saveApplication = async (app: Application & { client?: Client }) => {
    try {
      const { error } = await applicationsService.updateApplication(app.id, {
        data: app.data,
        status: app.status,
        updated_at: new Date().toISOString()
      });

      if (error) {
        console.error('Update error:', error);
        alert(`Failed to update application: ${error.message}`);
      } else {
        setEditingApplication(null);
        fetchAllData();
      }
    } catch (err) {
      console.error('Update exception:', err);
      alert(`Update failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const downloadDocument = async (doc: DocType) => {
    const { data } = await storageService.downloadDocument('client', doc.file_path);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      a.click();
    }
  };

  // Download application document from storage
  const downloadApplicationDocument = async (filePath: string, fieldName: string) => {
    try {
      const { data, error } = await storageService.downloadDocument('admin', filePath);
      if (error) {
        console.error('Download error:', error);
        alert(`Failed to download: ${error.message}`);
        return;
      }
      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = filePath.split('/').pop() || `${fieldName}-document`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download exception:', err);
      alert('Download failed');
    }
  };

  // Delete application document from storage
  const deleteApplicationDocument = async (filePath: string, fieldName: string) => {
    if (!editingApplication) return;
    if (!confirm(`Delete the ${fieldName} document? This cannot be undone.`)) return;

    try {
      const { error } = await storageService.deleteDocument('admin', filePath);
      if (error) {
        console.error('Delete error:', error);
        alert(`Failed to delete: ${error.message}`);
        return;
      }

      // Update application data to remove the document reference
      const updatedDocs = { ...(editingApplication.data?.uploadedDocuments as Record<string, string> || {}) };
      delete updatedDocs[fieldName];

      setEditingApplication({
        ...editingApplication,
        data: { ...editingApplication.data, uploadedDocuments: updatedDocs }
      });

      alert('Document deleted successfully');
    } catch (err) {
      console.error('Delete exception:', err);
      alert('Delete failed');
    }
  };

  // Upload new application document
  const uploadApplicationDocument = async (file: File, fieldName: string) => {
    if (!editingApplication) return;

    try {
      const fileName = `${Date.now()}-${fieldName}-${file.name}`;
      const filePath = `applications/${fileName}`;

      const { error } = await storageService.uploadDocument('admin', filePath, file);
      if (error) {
        console.error('Upload error:', error);
        alert(`Failed to upload: ${error.message}`);
        return;
      }

      // Update application data with new document path
      const updatedDocs = { ...(editingApplication.data?.uploadedDocuments as Record<string, string> || {}) };
      updatedDocs[fieldName] = filePath;

      setEditingApplication({
        ...editingApplication,
        data: { ...editingApplication.data, uploadedDocuments: updatedDocs }
      });

      alert('Document uploaded successfully');
    } catch (err) {
      console.error('Upload exception:', err);
      alert('Upload failed');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md">
          <Shield className="w-16 h-16 text-coral mx-auto mb-4" />
          <h2 className="font-orbitron text-xl font-bold text-navy mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You do not have administrator privileges.</p>
          <button onClick={signOut} className="bg-coral text-white px-6 py-2 rounded-lg hover:bg-coral-dark transition">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_review: 'bg-blue-100 text-blue-800',
      documents_requested: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800',
      verified: 'bg-emerald-100 text-emerald-800',
      admin: 'bg-coral text-white',
      student: 'bg-blue-100 text-blue-800',
      workforce: 'bg-indigo-100 text-indigo-800',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.replace('_', ' ')}
    </span>;
  };

  const togglePaymentPhase = async (phaseId: string, field: string, currentValue: boolean, amount?: number) => {
    // Determine the date field based on the phase
    let dateField = '';
    if (field === 'phase_1_down_payment') dateField = 'phase_1_date';
    else if (field === 'phase_2_embassy_fee') dateField = 'phase_2_date';
    else if (field === 'phase_3_after_visa_fee') dateField = 'phase_3_date';
    
    const updateData: any = {
      [field]: !currentValue,
      [dateField]: !currentValue ? new Date().toISOString().split('T')[0] : null,
      updated_at: new Date().toISOString()
    };
    
    // Update amount if provided
    if (amount !== undefined) {
      const amountField = field.replace('_down_payment', '_amount')
                              .replace('_embassy_fee', '_amount')
                              .replace('_after_visa_fee', '_amount');
      updateData[amountField] = amount;
    }
    
    await paymentPhasesService.updatePaymentPhase(phaseId, updateData);
    fetchAllData();
  };

  // Define tabs outside the component to prevent recreation on every render
  const baseTabs = [
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
  ] as const;

  // Create tabs with current counts
  const tabs = baseTabs.map(tab => ({
    ...tab,
    count: tab.id === 'applications' ? applications.length :
           tab.id === 'jobs' ? jobs.length : 0
  }));



  const filteredClients = clients.filter(c => 
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="font-inter min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-navy text-white sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/assets/logo.png" alt="The Blue OX - Admin Console" className="h-10 mr-4" />
            <div>
              <h1 className="font-orbitron text-xl font-bold">Admin Console</h1>
              <p className="text-gray-400 text-sm">CRM Management Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300">{currentClient?.full_name}</span>
            <button 
              onClick={async () => {
                try {
                  console.log('Testing database connection...');
                  const { data, error } = await clientsService.testClientsConnection();

                  if (error) {
                    console.error('Database test failed:', error);
                    alert(`Database Test Failed: ${error.message}`);
                  } else {
                    console.log('Database test successful:', data);
                    alert('Database Test Successful! Refreshing data...');
                    fetchAllData();
                  }
                } catch (err) {
                  console.error('Database test exception:', err);
                  alert(`Database Test Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
                }
              }}
              className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition"
            >
              Test DB
            </button>
            <button onClick={signOut} className="flex items-center text-gray-300 hover:text-white transition">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-[68px] z-10">
        <div className="container mx-auto px-4">
          <div className="flex space-x-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('applications')}
              className={`flex items-center py-4 border-b-2 font-medium whitespace-nowrap transition ${
                activeTab === 'applications' ? 'border-coral text-coral' : 'border-transparent text-gray-600 hover:text-coral'
              }`}
            >
              <FileText className="w-5 h-5 mr-2" />
              Applications
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{applications.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex items-center py-4 border-b-2 font-medium whitespace-nowrap transition ${
                activeTab === 'jobs' ? 'border-coral text-coral' : 'border-transparent text-gray-600 hover:text-coral'
              }`}
            >
              <Briefcase className="w-5 h-5 mr-2" />
              Jobs
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{jobs.length}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-coral border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : (
          <>
            {activeTab === 'applications' && (
              <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-8"></th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Applicant</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Path</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {applications.map((app) => {
                      const isExpanded = expandedRows.has(app.id);
                      const appData = app.data || {};
                      const fullName = String(appData.fullName || appData.name || 'Anonymous');
                      const email = String(appData.email || '-');
                      const whatsapp = String(appData.whatsapp || appData.phone || '-');

                      return (
                        <React.Fragment key={app.id}>
                          <tr className={`hover:bg-gray-50 ${isExpanded ? 'bg-blue-50' : ''}`}>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => toggleRowExpanded(app.id)}
                                className="text-gray-500 hover:text-navy transition"
                                title={isExpanded ? 'Collapse details' : 'Expand details'}
                              >
                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-navy">{fullName}</div>
                              {appData.nationality && <div className="text-xs text-gray-500">{String(appData.nationality)}</div>}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="text-gray-700">{email}</div>
                              <div className="text-gray-500 text-xs">{whatsapp}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="capitalize text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {(app.user_path || app.application_type || '-').replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3">{getStatusBadge(app.status)}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {new Date(app.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <select
                                  value={app.status}
                                  onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                                  className="text-sm border rounded px-2 py-1"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="in_review">In Review</option>
                                  <option value="documents_requested">Docs Requested</option>
                                  <option value="approved">Approved</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                                <button
                                  onClick={() => setEditingApplication(app)}
                                  className="text-blue-600 hover:text-blue-800 transition"
                                  title="Edit application"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteApplication(app.id)}
                                  className="text-red-600 hover:text-red-800 transition"
                                  title="Delete application"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {/* Expanded Details Row */}
                          {isExpanded && (
                            <tr className="bg-gray-50">
                              <td colSpan={7} className="px-4 py-4">
                                <div className="bg-white rounded-lg p-4 shadow-inner">
                                  <h4 className="font-semibold text-navy mb-3 flex items-center">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Full Application Details
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                    {/* Personal Information */}
                                    <div className="space-y-2">
                                      <h5 className="font-medium text-gray-700 border-b pb-1">Personal Info</h5>
                                      {appData.fullName && <div><span className="text-gray-500">Full Name:</span> {String(appData.fullName)}</div>}
                                      {appData.email && <div><span className="text-gray-500">Email:</span> {String(appData.email)}</div>}
                                      {appData.whatsapp && <div><span className="text-gray-500">WhatsApp:</span> {String(appData.whatsapp)}</div>}
                                      {appData.nationality && <div><span className="text-gray-500">Nationality:</span> {String(appData.nationality)}</div>}
                                    </div>

                                    {/* Preferences */}
                                    <div className="space-y-2">
                                      <h5 className="font-medium text-gray-700 border-b pb-1">Preferences</h5>
                                      {appData.targetCountries && (
                                        <div>
                                          <span className="text-gray-500">Countries:</span>{' '}
                                          {Array.isArray(appData.targetCountries)
                                            ? appData.targetCountries.join(', ')
                                            : String(appData.targetCountries)}
                                        </div>
                                      )}
                                      {appData.educationLevel && <div><span className="text-gray-500">Education:</span> {String(appData.educationLevel)}</div>}
                                      {appData.fieldOfStudy && (
                                        <div>
                                          <span className="text-gray-500">Field:</span>{' '}
                                          {Array.isArray(appData.fieldOfStudy)
                                            ? appData.fieldOfStudy.join(', ')
                                            : String(appData.fieldOfStudy)}
                                        </div>
                                      )}
                                      {appData.budget && <div><span className="text-gray-500">Budget:</span> {String(appData.budget)}</div>}
                                      {appData.startDate && <div><span className="text-gray-500">Start Date:</span> {String(appData.startDate)}</div>}
                                    </div>

                                    {/* Work Preferences (for worker/student_job paths) */}
                                    <div className="space-y-2">
                                      <h5 className="font-medium text-gray-700 border-b pb-1">Work Info</h5>
                                      {appData.skills && (
                                        <div>
                                          <span className="text-gray-500">Skills:</span>{' '}
                                          {Array.isArray(appData.skills)
                                            ? appData.skills.join(', ')
                                            : String(appData.skills)}
                                        </div>
                                      )}
                                      {appData.experienceYears && <div><span className="text-gray-500">Experience:</span> {String(appData.experienceYears)}</div>}
                                      {appData.salaryExpectation && <div><span className="text-gray-500">Expected Salary:</span> {String(appData.salaryExpectation)}</div>}
                                      {appData.availability && <div><span className="text-gray-500">Availability:</span> {String(appData.availability)}</div>}
                                      {appData.selectedJob && <div><span className="text-gray-500">Selected Job:</span> {String(appData.selectedJob)}</div>}
                                    </div>
                                  </div>

                                  {/* Documents */}
                                  {appData.uploadedDocuments && (
                                    <div className="mt-4 pt-4 border-t">
                                      <h5 className="font-medium text-gray-700 mb-2">Uploaded Documents</h5>
                                      <div className="flex flex-wrap gap-2">
                                        {/* Handle new format: Record<string, string> */}
                                        {typeof appData.uploadedDocuments === 'object' && !Array.isArray(appData.uploadedDocuments) ? (
                                          Object.entries(appData.uploadedDocuments as Record<string, string>).map(([fieldName, filePath]) => (
                                            <button
                                              key={fieldName}
                                              onClick={() => downloadApplicationDocument(String(filePath), fieldName)}
                                              className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded text-xs hover:bg-green-200 transition"
                                              title={`Download ${fieldName}`}
                                            >
                                              <Download className="w-3 h-3" />
                                              <span className="capitalize">{fieldName.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            </button>
                                          ))
                                        ) : (
                                          /* Handle old format: string[] (just field names, no download) */
                                          (Array.isArray(appData.uploadedDocuments)
                                            ? appData.uploadedDocuments
                                            : []
                                          ).map((doc: string, idx: number) => (
                                            <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                              {doc}
                                            </span>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Raw Data (for debugging/viewing all fields) */}
                                  <details className="mt-4 pt-4 border-t">
                                    <summary className="cursor-pointer text-gray-500 text-xs hover:text-gray-700">
                                      View Raw Data (JSON)
                                    </summary>
                                    <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                                      {JSON.stringify(appData, null, 2)}
                                    </pre>
                                  </details>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
                {applications.length === 0 && <p className="text-center py-8 text-gray-500">No applications yet.</p>}
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

      {/* Payment Modal */}
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

      {/* Job Modal */}
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

      {/* Edit Application Modal */}
      {editingApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-orbitron text-xl font-bold text-navy">Edit Application</h3>
              <button onClick={() => setEditingApplication(null)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              saveApplication(editingApplication);
            }}>
              <div className="space-y-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={editingApplication.status}
                    onChange={(e) => setEditingApplication({ ...editingApplication, status: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_review">In Review</option>
                    <option value="documents_requested">Documents Requested</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Personal Information */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-navy mb-3">Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Full Name</label>
                      <input
                        type="text"
                        value={String(editingApplication.data?.fullName || '')}
                        onChange={(e) => setEditingApplication({
                          ...editingApplication,
                          data: { ...editingApplication.data, fullName: e.target.value }
                        })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={String(editingApplication.data?.email || '')}
                        onChange={(e) => setEditingApplication({
                          ...editingApplication,
                          data: { ...editingApplication.data, email: e.target.value }
                        })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">WhatsApp</label>
                      <input
                        type="text"
                        value={String(editingApplication.data?.whatsapp || '')}
                        onChange={(e) => setEditingApplication({
                          ...editingApplication,
                          data: { ...editingApplication.data, whatsapp: e.target.value }
                        })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Nationality</label>
                      <input
                        type="text"
                        value={String(editingApplication.data?.nationality || '')}
                        onChange={(e) => setEditingApplication({
                          ...editingApplication,
                          data: { ...editingApplication.data, nationality: e.target.value }
                        })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Preferences */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-navy mb-3">Preferences</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Target Countries</label>
                      <input
                        type="text"
                        value={Array.isArray(editingApplication.data?.targetCountries)
                          ? editingApplication.data.targetCountries.join(', ')
                          : String(editingApplication.data?.targetCountries || '')}
                        onChange={(e) => setEditingApplication({
                          ...editingApplication,
                          data: { ...editingApplication.data, targetCountries: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                        })}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Comma-separated list"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Education Level</label>
                      <input
                        type="text"
                        value={String(editingApplication.data?.educationLevel || '')}
                        onChange={(e) => setEditingApplication({
                          ...editingApplication,
                          data: { ...editingApplication.data, educationLevel: e.target.value }
                        })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Budget</label>
                      <input
                        type="text"
                        value={String(editingApplication.data?.budget || '')}
                        onChange={(e) => setEditingApplication({
                          ...editingApplication,
                          data: { ...editingApplication.data, budget: e.target.value }
                        })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Date</label>
                      <input
                        type="text"
                        value={String(editingApplication.data?.startDate || '')}
                        onChange={(e) => setEditingApplication({
                          ...editingApplication,
                          data: { ...editingApplication.data, startDate: e.target.value }
                        })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Work Info (for worker paths) */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-navy mb-3">Work Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Skills</label>
                      <input
                        type="text"
                        value={Array.isArray(editingApplication.data?.skills)
                          ? editingApplication.data.skills.join(', ')
                          : String(editingApplication.data?.skills || '')}
                        onChange={(e) => setEditingApplication({
                          ...editingApplication,
                          data: { ...editingApplication.data, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                        })}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Comma-separated list"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Experience Years</label>
                      <input
                        type="text"
                        value={String(editingApplication.data?.experienceYears || '')}
                        onChange={(e) => setEditingApplication({
                          ...editingApplication,
                          data: { ...editingApplication.data, experienceYears: e.target.value }
                        })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Salary Expectation</label>
                      <input
                        type="text"
                        value={String(editingApplication.data?.salaryExpectation || '')}
                        onChange={(e) => setEditingApplication({
                          ...editingApplication,
                          data: { ...editingApplication.data, salaryExpectation: e.target.value }
                        })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Availability</label>
                      <input
                        type="text"
                        value={String(editingApplication.data?.availability || '')}
                        onChange={(e) => setEditingApplication({
                          ...editingApplication,
                          data: { ...editingApplication.data, availability: e.target.value }
                        })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium mb-1">Admin Notes</label>
                  <textarea
                    value={String(editingApplication.data?.adminNotes || '')}
                    onChange={(e) => setEditingApplication({
                      ...editingApplication,
                      data: { ...editingApplication.data, adminNotes: e.target.value }
                    })}
                    className="w-full border rounded-lg px-3 py-2 h-24"
                    placeholder="Internal notes about this application..."
                  />
                </div>

                {/* Documents Management */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-navy mb-3 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Documents
                  </h4>

                  {/* Existing Documents */}
                  {editingApplication.data?.uploadedDocuments &&
                   typeof editingApplication.data.uploadedDocuments === 'object' &&
                   Object.keys(editingApplication.data.uploadedDocuments).length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {Object.entries(editingApplication.data.uploadedDocuments as Record<string, string>).map(([fieldName, filePath]) => (
                        <div key={fieldName} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium capitalize">{fieldName.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className="text-xs text-gray-400">({String(filePath).split('/').pop()})</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => downloadApplicationDocument(String(filePath), fieldName)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteApplicationDocument(String(filePath), fieldName)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-4">No documents uploaded yet.</p>
                  )}

                  {/* Upload New Document */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium mb-2">Upload New Document</label>
                    <div className="flex items-center space-x-3">
                      <select
                        id="docType"
                        className="border rounded-lg px-3 py-2 text-sm"
                        defaultValue=""
                      >
                        <option value="" disabled>Select type...</option>
                        <option value="cv">CV / Resume</option>
                        <option value="passport">Passport</option>
                        <option value="certificate">Certificate</option>
                        <option value="policeReport">Police Report</option>
                        <option value="other">Other Document</option>
                      </select>
                      <input
                        type="file"
                        id="docFile"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          const docType = (document.getElementById('docType') as HTMLSelectElement)?.value;
                          if (file && docType) {
                            uploadApplicationDocument(file, docType);
                            e.target.value = '';
                          } else if (!docType) {
                            alert('Please select a document type first');
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const docType = (document.getElementById('docType') as HTMLSelectElement)?.value;
                          if (!docType) {
                            alert('Please select a document type first');
                            return;
                          }
                          document.getElementById('docFile')?.click();
                        }}
                        className="flex items-center space-x-2 bg-navy text-white px-4 py-2 rounded-lg hover:bg-navy-dark transition text-sm"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Choose File</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingApplication(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-coral text-white py-2 rounded-lg font-medium hover:bg-coral-dark"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-coral border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <AdminDashboard />;
};

const AppWrapper: React.FC = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default AppWrapper;
