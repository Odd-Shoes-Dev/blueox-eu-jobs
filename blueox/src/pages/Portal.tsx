import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { FileText, Upload, FolderOpen, CheckCircle, Clock, AlertTriangle, Trash2, Download, Eye, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getFileKind } from '../lib/fileKind';
import type { Application, Document as DocType } from '../services/types';
import * as applicationsService from '../services/applicationsService';
import * as documentsService from '../services/documentsService';
import * as storageService from '../services/storageService';
import CVBuilder from '../components/CVBuilder';

const Portal: React.FC = () => {
  const { type } = useParams<{ type: 'student' | 'workforce' }>();
  const { user, client, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cv' | 'documents'>('dashboard');
  const [applications, setApplications] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<DocType[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; kind: 'image' | 'pdf' } | null>(null);
  // Tracks which individual preview/download buttons are mid-request, keyed per
  // document+action so only the clicked one shows a spinner (these can be slow —
  // Neon's free-tier compute cold-starts after idling — with no other feedback).
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
    if (client) {
      fetchData();
    }
  }, [client]);

  const fetchData = async () => {
    if (!client) return;

    const [appsData, docsData] = await Promise.all([
      applicationsService.listApplicationsForClient(client.id),
      documentsService.listDocumentsForClient(client.id),
    ]);

    setApplications(appsData);
    setDocuments(docsData);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    if (!e.target.files || !e.target.files[0] || !client || !user) return;

    const file = e.target.files[0];
    const sanitizedName = client.full_name.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${sanitizedName}_${docType}.${file.name.split('.').pop()}`;
    const filePath = `${user.id}/${fileName}`;

    setUploading(true);

    const { error: uploadError, fileId, path: storedPath } = await storageService.uploadDocument('client', filePath, file, { upsert: true });

    if (uploadError || !storedPath) {
      alert('Upload failed: ' + (uploadError?.message ?? 'unknown error'));
      setUploading(false);
      return;
    }

    await documentsService.insertDocumentRecord({
      file_name: fileName,
      // The real ImageKit path, not our local `filePath` guess — see
      // storageService.uploadDocument's comment for why these can differ.
      file_path: storedPath,
      document_type: docType,
      file_size: file.size,
      mime_type: file.type,
      imagekit_file_id: fileId,
    });

    fetchData();
    setUploading(false);
  };

  const deleteDocument = async (doc: DocType) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    await storageService.deleteDocument('client', doc.file_path);
    await documentsService.deleteDocumentRecord(doc.id);
    fetchData();
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
  // previewed by any browser, so those fall back to telling you to download.
  const previewDocument = async (doc: DocType) => {
    const kind = getFileKind(doc.file_path);
    if (kind === 'other') {
      alert('Preview is not available for this file type — use Download instead.');
      return;
    }
    const url = await storageService.getDocumentUrl(doc.file_path);
    if (!url) {
      alert('Failed to open preview');
      return;
    }
    setPreviewFile({ url, name: doc.file_name, kind });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="animate-spin w-8 h-8 border-4 border-coral border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user || !client) {
    return <Navigate to="/login" state={{ from: { pathname: `/apply/${type}` } }} replace />;
  }

  const portalTitle = type === 'student' ? 'Student Portal' : 'Workforce Portal';
  const docTypes = type === 'student' 
    ? ['Passport', 'Transcript', 'Certificate', 'Motivation_Letter', 'ID_Photo', 'Other']
    : ['Passport', 'Work_Experience', 'Certification', 'Reference_Letter', 'ID_Photo', 'Other'];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'rejected': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="font-inter pt-20 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-navy py-8">
        <div className="container mx-auto px-4">
          <h1 className="font-orbitron text-3xl font-bold text-white">{portalTitle}</h1>
          <p className="font-space text-gray-300 mt-2">Welcome, {client.full_name}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Eye },
              { id: 'cv', label: 'CV Builder', icon: FileText },
              { id: 'documents', label: 'Document Safe', icon: FolderOpen },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center py-4 border-b-2 font-space font-medium transition ${
                  activeTab === id
                    ? 'border-coral text-coral'
                    : 'border-transparent text-gray-600 hover:text-coral'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="max-w-4xl">
            <h2 className="font-orbitron text-2xl font-bold text-navy mb-6">Your Applications</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-coral border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : applications.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-space font-semibold text-lg text-navy mb-2">No Applications Yet</h3>
                <p className="text-gray-600 mb-4">Start by building your CV and uploading your documents.</p>
                <button
                  onClick={() => setActiveTab('cv')}
                  className="bg-coral text-white px-6 py-2 rounded-lg font-medium hover:bg-coral-dark transition"
                >
                  Build Your CV
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="bg-white rounded-xl p-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-space font-semibold text-navy">{app.target_country || 'European Opportunity'}</h3>
                      <p className="text-sm text-gray-500">{app.application_type} application</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(app.status)}
                      <span className="capitalize text-sm font-medium">{app.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Documents Summary */}
            <h2 className="font-orbitron text-2xl font-bold text-navy mb-6 mt-12">Uploaded Documents</h2>
            <div className="bg-white rounded-xl p-6">
              {documents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No documents uploaded yet.</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-coral mr-3" />
                        <div>
                          <p className="font-medium text-sm text-navy">{doc.document_type}</p>
                          <p className="text-xs text-gray-500">{doc.file_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {doc.is_verified && <CheckCircle className="w-4 h-4 text-green-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'cv' && <CVBuilder applicationType={type || 'student'} />}

        {activeTab === 'documents' && (
          <div className="max-w-4xl">
            <h2 className="font-orbitron text-2xl font-bold text-navy mb-6">Document Safe</h2>
            <p className="text-gray-600 mb-8">
              Upload your documents securely. Files are named automatically: <code className="bg-gray-100 px-2 py-1 rounded">[Your_Name]_[Document_Type].[ext]</code>
            </p>

            {/* Upload Section */}
            <div className="bg-white rounded-xl p-6 mb-8">
              <h3 className="font-space font-semibold text-lg text-navy mb-4">Upload Document</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {docTypes.map((docType) => (
                  <div key={docType} className="relative">
                    <input
                      type="file"
                      id={`upload-${docType}`}
                      onChange={(e) => handleFileUpload(e, docType)}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      disabled={uploading}
                    />
                    <label
                      htmlFor={`upload-${docType}`}
                      className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition ${
                        uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-coral hover:bg-coral/5'
                      }`}
                    >
                      <Upload className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-sm font-medium text-gray-700">{docType.replace('_', ' ')}</span>
                    </label>
                  </div>
                ))}
              </div>
              {uploading && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="animate-spin w-5 h-5 border-2 border-coral border-t-transparent rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Uploading...</span>
                </div>
              )}
            </div>

            {/* Documents List */}
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-space font-semibold text-lg text-navy mb-4">Your Documents</h3>
              {documents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No documents uploaded yet.</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-coral mr-3" />
                        <div>
                          <p className="font-medium text-navy">{doc.file_name}</p>
                          <p className="text-sm text-gray-500">
                            {doc.document_type} 
                            {doc.is_verified && <span className="ml-2 text-green-600">(Verified)</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => runWithLoading(`preview-${doc.id}`, () => previewDocument(doc))}
                          disabled={isLoading(`preview-${doc.id}`)}
                          className="p-2 text-gray-500 hover:text-coral transition disabled:opacity-50"
                          title="Preview"
                        >
                          {isLoading(`preview-${doc.id}`) ? (
                            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => runWithLoading(`download-${doc.id}`, () => downloadDocument(doc))}
                          disabled={isLoading(`download-${doc.id}`)}
                          className="p-2 text-gray-500 hover:text-coral transition disabled:opacity-50"
                          title="Download"
                        >
                          {isLoading(`download-${doc.id}`) ? (
                            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Download className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteDocument(doc)}
                          className="p-2 text-gray-500 hover:text-red-500 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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

export default Portal;
