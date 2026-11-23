import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Copy, Check, Upload, Trash2, Download, Lock, ExternalLink, Send, RotateCcw, Eye, X } from 'lucide-react';
import * as partnerCandidatesService from '../../services/partnerCandidatesService';
import { CANDIDATE_DOC_TYPES, CANDIDATE_DOC_TYPE_LABELS, CANDIDATE_FIELDS, getCompletionPercent } from '../../services/partnerCandidatesService';
import type { PartnerCandidate, PartnerCandidateDocument } from '../../services/partnerCandidatesService';
import * as storageService from '../../services/storageService';
import { getFileKind } from '../../lib/fileKind';
import CompletionBar from '../../components/CompletionBar';

const AUTOSAVE_DELAY_MS = 1500;

const DOC_TYPES: readonly string[] = CANDIDATE_DOC_TYPES;
const DOC_LABELS: Record<string, string> = CANDIDATE_DOC_TYPE_LABELS;

const FIELDS = CANDIDATE_FIELDS;
const FIELD_GROUPS = Array.from(new Set(FIELDS.map((f) => f.group)));

const AUTOSAVE_KEYS: (keyof PartnerCandidate)[] = FIELDS.map((f) => f.key);

// A snapshot of just the fields we autosave, so the debounce effect can tell
// a real edit apart from a save's own response coming back in (which would
// otherwise retrigger itself in a loop) or the initial fetch on mount.
const snapshotOf = (c: PartnerCandidate) => JSON.stringify(AUTOSAVE_KEYS.map((k) => c[k] ?? null));

const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState<PartnerCandidate | null>(null);
  const [documents, setDocuments] = useState<PartnerCandidateDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; kind: 'image' | 'pdf' } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // Tracks which individual preview/download buttons are mid-request, keyed per
  // document+action so only the clicked one shows a spinner (these can be slow,
  // Neon's free-tier compute cold-starts after idling, with no other feedback).
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

  // Tracks what's actually been saved, so the autosave effect can tell a real
  // edit apart from its own save response coming back in, and the debounce
  // timer so a burst of keystrokes only fires one request.
  const lastSavedRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAll = async () => {
    if (!id) return;
    setLoading(true);
    const [c, docs] = await Promise.all([
      partnerCandidatesService.getCandidate(id),
      partnerCandidatesService.listPartnerDocuments(),
    ]);
    setCandidate(c);
    lastSavedRef.current = snapshotOf(c);
    setDocuments(docs.filter((d) => d.partner_candidate_id === id));
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleFieldChange = (key: keyof PartnerCandidate, value: string) => {
    if (!candidate) return;
    setCandidate({ ...candidate, [key]: value });
  };

  const doSave = async () => {
    if (!candidate || !id) return;
    // Snapshot exactly what we're sending now — the request can take a
    // second or more, and the user may well have kept typing (possibly into
    // another field) before it resolves. That later state must win, so the
    // response below only ever updates server-controlled fields, never the
    // form fields themselves.
    const sentSnapshot = snapshotOf(candidate);
    setSaveStatus('saving');
    try {
      const fields = Object.fromEntries(
        AUTOSAVE_KEYS.map((k) => [k, candidate[k] ?? undefined])
      ) as Parameters<typeof partnerCandidatesService.updateCandidate>[1];
      const updated = await partnerCandidatesService.updateCandidate(id, fields);
      lastSavedRef.current = sentSnapshot;
      setCandidate((current) => current && ({
        ...current,
        status: updated.status,
        changes_requested_note: updated.changes_requested_note,
        updated_at: updated.updated_at,
      }));
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  // Autosave: debounced a bit after the user stops typing, so there's never
  // more than a couple of seconds of work that could be lost to a closed tab,
  // dropped connection, or just forgetting to click Save.
  useEffect(() => {
    if (!candidate) return;
    if (snapshotOf(candidate) === lastSavedRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(doSave, AUTOSAVE_DELAY_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate]);

  const handleSave = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    doSave();
  };

  const handleLock = async () => {
    if (!id) return;
    setCandidate(await partnerCandidatesService.lockCandidate(id));
  };

  const handleSubmit = async () => {
    if (!id) return;
    setSubmitError('');
    setSubmitting(true);
    try {
      // Flush any pending autosave first, so a just-typed field isn't left
      // behind when the record locks on submit.
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        await doSave();
      }
      setCandidate(await partnerCandidatesService.submitCandidate(id));
    } catch (err) {
      setSubmitError((err as Error).message || 'Could not submit. Please fill in all required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevertToDraft = async () => {
    if (!id) return;
    if (!confirm('Move this candidate back to draft? It will become editable again.')) return;
    setCandidate(await partnerCandidatesService.revertToDraft(id));
  };

  const handleRequestChanges = async () => {
    if (!id || !note.trim()) return;
    setCandidate(await partnerCandidatesService.requestChanges(id, note.trim()));
    setNote('');
  };

  const handleUpload = async (docType: string, file: File) => {
    if (!id) return;
    setUploadError('');
    setUploadingType(docType);
    const path = `${id}/${docType}.${file.name.split('.').pop()}`;
    const { error, path: storedPath } = await storageService.uploadDocument('partner-candidate', path, file);
    if (!error && storedPath) {
      await partnerCandidatesService.insertPartnerDocument({
        partner_candidate_id: id,
        file_name: file.name,
        file_path: storedPath,
        document_type: docType,
        file_size: file.size,
        mime_type: file.type,
      });
      await fetchAll();
    } else if (error) {
      setUploadError(error.message);
    }
    setUploadingType(null);
  };

  const handleDeleteDocument = async (docId: string) => {
    await partnerCandidatesService.deletePartnerDocument(docId);
    await fetchAll();
  };

  const handleDownload = async (path: string) => {
    const url = await storageService.getDocumentUrl(path);
    if (url) window.open(url, '_blank');
  };

  // Opens a PDF/image inline in a modal on this same page, so a partner can
  // confirm the right file was uploaded without it leaving the page. Word
  // docs can't be previewed by any browser, so those fall back to Download.
  const previewDocument = async (doc: PartnerCandidateDocument) => {
    const kind = getFileKind(doc.file_path);
    if (kind === 'other') {
      alert('Preview is not available for this file type. Use Download instead.');
      return;
    }
    const url = await storageService.getDocumentUrl(doc.file_path);
    if (!url) {
      alert('Failed to open preview');
      return;
    }
    setPreviewFile({ url, name: doc.file_name, kind });
  };

  const handleCopyLink = async () => {
    if (!candidate) return;
    await navigator.clipboard.writeText(`${window.location.origin}/partner-portal/candidate/${candidate.access_token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !candidate) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-coral border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/partner-portal" className="text-sm text-gray-500 hover:text-coral">← Back to candidates</Link>
          <h1 className="font-orbitron text-2xl font-bold text-navy mt-1">{candidate.full_name || 'New candidate'}</h1>
        </div>
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-2 text-sm font-space font-semibold text-coral border border-coral/30 rounded-lg px-4 py-2 hover:bg-coral/10"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied' : 'Copy candidate link'}
        </button>
      </div>

      <div className="mb-6">
        <CompletionBar percent={getCompletionPercent(candidate, documents.length)} />
      </div>

      {candidate.status === 'changes_requested' && candidate.changes_requested_note && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800">
          <strong>Changes requested:</strong> {candidate.changes_requested_note}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="font-space font-bold text-navy mb-4">Candidate details</h2>
        {FIELD_GROUPS.map((group) => (
          <div key={group} className="mb-6 last:mb-0">
            <h3 className="text-xs font-space font-semibold text-gray-400 uppercase tracking-wide mb-3">{group}</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {FIELDS.filter((f) => f.group === group).map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  {f.type === 'select' ? (
                    <select
                      value={(candidate[f.key] as string) ?? ''}
                      onChange={(e) => handleFieldChange(f.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-sm"
                    >
                      <option value="">Select…</option>
                      {f.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea
                      value={(candidate[f.key] as string) ?? ''}
                      onChange={(e) => handleFieldChange(f.key, e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-sm"
                    />
                  ) : (
                    <input
                      type={f.type ?? 'text'}
                      value={f.type === 'date' ? ((candidate[f.key] as string) ?? '').slice(0, 10) : (candidate[f.key] as string) ?? ''}
                      onChange={(e) => handleFieldChange(f.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-sm"
                    />
                  )}
                  {f.key === 'video_url' && candidate.video_url && (
                    <a href={candidate.video_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-coral text-xs mt-1 hover:underline">
                      Open link <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {f.key === 'intro_video_url' && candidate.intro_video_url && (
                    <a href={candidate.intro_video_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-coral text-xs mt-1 hover:underline">
                      Open link <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="bg-coral text-white px-5 py-2.5 rounded-lg font-space font-semibold hover:bg-coral-dark transition disabled:opacity-50"
          >
            {saveStatus === 'saving' ? 'Saving…' : 'Save changes'}
          </button>
          <span className="text-sm text-gray-500">
            {saveStatus === 'saving' && 'Saving…'}
            {saveStatus === 'saved' && 'All changes saved'}
            {saveStatus === 'error' && (
              <span className="text-red-600">Couldn't save. Check your connection</span>
            )}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="font-space font-bold text-navy mb-1">Documents</h2>
        <p className="text-xs text-gray-500 mb-4">PDF, JPG, PNG, or Word, up to 15MB each.</p>
        {uploadError && <p className="text-red-600 text-sm mb-4">{uploadError}</p>}
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
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
                      <button
                        onClick={() => runWithLoading(`preview-${existing.id}`, () => previewDocument(existing))}
                        disabled={isLoading(`preview-${existing.id}`)}
                        className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        title="Preview"
                      >
                        {isLoading(`preview-${existing.id}`) ? (
                          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => runWithLoading(`download-${existing.id}`, () => handleDownload(existing.file_path))}
                        disabled={isLoading(`download-${existing.id}`)}
                        className="text-coral hover:text-coral-dark disabled:opacity-50"
                        title="Download"
                      >
                        {isLoading(`download-${existing.id}`) ? (
                          <div className="w-4 h-4 border-2 border-coral border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                      <button onClick={() => handleDeleteDocument(existing.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="mt-2 flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-coral">
                    <Upload className="w-4 h-4" /> Upload
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(docType, file);
                      }}
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-space font-bold text-navy mb-4">Status: {candidate.status}</h2>
        {candidate.status === 'draft' && (
          <p className="text-sm text-gray-500 mb-4">
            While this candidate is a draft, only you can see their details. Blue Ox can't see them yet.
            Submitting makes this candidate visible to Blue Ox for review.
          </p>
        )}
        {candidate.status === 'submitted' && (
          <p className="text-sm text-gray-500 mb-4">
            Locking freezes the candidate's own link so they can't change anything while you're reviewing it.
            You can still edit it yourself, and you can revert it to draft at any time to unlock it again.
          </p>
        )}
        {submitError && <p className="text-red-600 text-sm mb-3">{submitError}</p>}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {candidate.status === 'draft' && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 bg-coral text-white px-5 py-2.5 rounded-lg font-space font-semibold hover:bg-coral-dark transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> {submitting ? 'Submitting…' : 'Submit'}
            </button>
          )}
          {candidate.status === 'submitted' && (
            <button
              onClick={handleLock}
              title="Freezes the candidate's own link while you review it"
              className="inline-flex items-center justify-center gap-2 bg-navy text-white px-5 py-2.5 rounded-lg font-space font-semibold hover:opacity-90 transition"
            >
              <Lock className="w-4 h-4" /> Lock / Start Review
            </button>
          )}
          {candidate.status !== 'draft' && (
            <button
              onClick={handleRevertToDraft}
              className="inline-flex items-center justify-center gap-2 bg-gray-100 text-navy px-5 py-2.5 rounded-lg font-space font-semibold hover:bg-gray-200 transition"
            >
              <RotateCcw className="w-4 h-4" /> Revert to Draft
            </button>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Request changes from the candidate</label>
          <div className="flex gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What needs fixing?"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-coral focus:border-transparent"
            />
            <button
              onClick={handleRequestChanges}
              disabled={!note.trim()}
              className="bg-gray-100 text-navy px-4 py-2 rounded-lg font-space font-semibold text-sm hover:bg-gray-200 disabled:opacity-50"
            >
              Request Changes
            </button>
          </div>
        </div>
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

export default CandidateDetail;
