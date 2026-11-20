import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, Trash2, Download, CheckCircle } from 'lucide-react';
import * as candidateSelfService from '../../services/candidateSelfService';
import type { PartnerCandidate } from '../../services/partnerCandidatesService';
import * as storageService from '../../services/storageService';

type Candidate = Omit<PartnerCandidate, 'access_token'>;

const DOC_TYPES = ['passport', 'cv', 'education_certificate', 'work_reference', 'medical_certificate', 'police_clearance'];
const DOC_LABELS: Record<string, string> = {
  passport: 'Passport',
  cv: 'CV / Resume',
  education_certificate: 'Education Certificate',
  work_reference: 'Work Reference',
  medical_certificate: 'Medical Certificate',
  police_clearance: 'Police Clearance',
};

interface Doc {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
}

const FIELDS: { key: keyof Candidate; label: string; type?: string }[] = [
  { key: 'full_name', label: 'Full name' },
  { key: 'date_of_birth', label: 'Date of birth', type: 'date' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'phone', label: 'Phone / WhatsApp' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'country_of_residence', label: 'Country of residence' },
  { key: 'target_country', label: 'Target country' },
  { key: 'job_category', label: 'Job category' },
  { key: 'driving_licence_conversion_status', label: 'Driving licence conversion status' },
];

const CandidateSelfService: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const fetchAll = async () => {
    if (!token) return;
    try {
      const [c, docs] = await Promise.all([
        candidateSelfService.getCandidateByToken(token),
        candidateSelfService.listDocumentsByToken(token),
      ]);
      setCandidate(c);
      setDocuments(docs as unknown as Doc[]);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const editable = candidate?.status === 'draft' || candidate?.status === 'changes_requested';

  const handleFieldChange = (key: keyof Candidate, value: string) => {
    if (!candidate) return;
    setCandidate({ ...candidate, [key]: value });
  };

  const handleSave = async () => {
    if (!candidate || !token) return;
    setSaving(true);
    const updated = await candidateSelfService.updateCandidateByToken(token, {
      full_name: candidate.full_name ?? undefined,
      date_of_birth: candidate.date_of_birth ?? undefined,
      nationality: candidate.nationality ?? undefined,
      phone: candidate.phone ?? undefined,
      email: candidate.email ?? undefined,
      country_of_residence: candidate.country_of_residence ?? undefined,
      target_country: candidate.target_country ?? undefined,
      job_category: candidate.job_category ?? undefined,
      driving_licence_conversion_status: candidate.driving_licence_conversion_status ?? undefined,
      video_url: candidate.video_url ?? undefined,
    });
    setCandidate(updated);
    setSaving(false);
  };

  const handleSubmit = async () => {
    if (!token) return;
    setSubmitError('');
    setSubmitting(true);
    try {
      const updated = await candidateSelfService.submitCandidateByToken(token);
      setCandidate(updated);
    } catch (err) {
      setSubmitError((err as Error).message || 'Could not submit — please fill in all required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpload = async (docType: string, file: File) => {
    if (!token || !candidate) return;
    setUploadingType(docType);
    const path = `${candidate.id}/${docType}.${file.name.split('.').pop()}`;
    const { error, path: storedPath } = await storageService.uploadDocument('partner-candidate', path, file);
    if (!error && storedPath) {
      await candidateSelfService.insertDocumentByToken(token, {
        file_name: file.name,
        file_path: storedPath,
        document_type: docType,
        file_size: file.size,
        mime_type: file.type,
      });
      await fetchAll();
    }
    setUploadingType(null);
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!token) return;
    await candidateSelfService.deleteDocumentByToken(token, docId);
    await fetchAll();
  };

  const handleDownload = async (path: string) => {
    const url = await storageService.getDocumentUrl(path, token);
    if (url) window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-coral border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (notFound || !candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <h1 className="font-orbitron text-xl font-bold text-navy mb-2">Link not found</h1>
          <p className="text-gray-600">This link is invalid or has expired. Please contact whoever sent it to you.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-inter min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <img src="/logo1.png" alt="Blue OX" className="h-10 mx-auto mb-4" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <h1 className="font-orbitron text-2xl font-bold text-navy">Your candidate profile</h1>
        </div>

        {candidate.status === 'changes_requested' && candidate.changes_requested_note && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800">
            <strong>Your partner asked for some changes:</strong> {candidate.changes_requested_note}
          </div>
        )}

        {!editable && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-800 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            {candidate.status === 'submitted' ? 'Your details are submitted and under review.' : 'Your details are locked while being reviewed.'}
          </div>
        )}

        <fieldset disabled={!editable} className="bg-white rounded-2xl shadow-lg p-6 mb-6 disabled:opacity-70">
          <div className="grid sm:grid-cols-2 gap-4">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input
                  type={f.type ?? 'text'}
                  value={f.type === 'date' ? ((candidate[f.key] as string) ?? '').slice(0, 10) : (candidate[f.key] as string) ?? ''}
                  onChange={(e) => handleFieldChange(f.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-sm"
                />
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link to a video showing your skills (YouTube, Google Drive, etc.)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={candidate.video_url ?? ''}
              onChange={(e) => handleFieldChange('video_url', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Don't have one yet? Upload it to YouTube as Unlisted or Google Drive and paste the link here.
            </p>
          </div>

          {editable && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-4 bg-coral text-white px-5 py-2.5 rounded-lg font-space font-semibold hover:bg-coral-dark transition disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
        </fieldset>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="font-space font-bold text-navy mb-4">Your documents</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {DOC_TYPES.map((docType) => {
              const existing = documents.find((d) => d.document_type === docType);
              return (
                <div key={docType} className="border border-dashed border-gray-300 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{DOC_LABELS[docType]}</span>
                    {uploadingType === docType && (
                      <div className="w-4 h-4 border-2 border-coral border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                  {existing ? (
                    <div className="flex items-center justify-between mt-2 text-sm">
                      <span className="text-gray-600 truncate">{existing.file_name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => handleDownload(existing.file_path)} className="text-coral hover:text-coral-dark">
                          <Download className="w-4 h-4" />
                        </button>
                        {editable && (
                          <button onClick={() => handleDeleteDocument(existing.id)} className="text-gray-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : editable ? (
                    <label className="mt-2 flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-coral">
                      <Upload className="w-4 h-4" /> Upload
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(docType, file);
                        }}
                      />
                    </label>
                  ) : (
                    <p className="text-sm text-gray-400 mt-2">Not provided</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {candidate.status === 'draft' && (
          <div className="text-center">
            {submitError && <p className="text-red-600 text-sm mb-3">{submitError}</p>}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-coral text-white px-8 py-3 rounded-lg font-space font-semibold hover:bg-coral-dark transition disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateSelfService;
