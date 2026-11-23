import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Plus, Copy, Check, MoreVertical, ChevronRight } from 'lucide-react';
import * as partnerCandidatesService from '../../services/partnerCandidatesService';
import type { PartnerCandidate } from '../../services/partnerCandidatesService';
import { getCompletionPercent } from '../../services/partnerCandidatesService';
import { formatCandidateRef } from '../../services/partnerCandidatesService';
import { usePartnerAuth } from '../../contexts/PartnerAuthContext';
import CompletionBar from '../../components/CompletionBar';
import { filterBySearch } from '../../lib/search';
import SearchInput from '../../components/SearchInput';

const STATUS_LABEL: Record<PartnerCandidate['status'], string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  locked: 'In Review',
  changes_requested: 'Changes Requested',
};

const STATUS_CLASSES: Record<PartnerCandidate['status'], string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  locked: 'bg-green-100 text-green-700',
  changes_requested: 'bg-amber-100 text-amber-700',
};

const Dashboard: React.FC = () => {
  const { signOut, partner } = usePartnerAuth();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<PartnerCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLink, setNewLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Rendered through a portal (see below) — the table's overflow-hidden
  // wrapper (for rounded corners) would otherwise clip the dropdown for rows
  // near the bottom instead of letting it float above the page.
  const [candidateMenu, setCandidateMenu] = useState<{ id: string; top: number; right: number } | null>(null);
  const [actionError, setActionError] = useState('');
  // Document count per candidate, for the completion percentage column below
  // (a purely visual guide, see getCompletionPercent) — fetched once for all
  // of this partner's candidates rather than per row.
  const [docCounts, setDocCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const [list, docs] = await Promise.all([
        partnerCandidatesService.listCandidates(),
        partnerCandidatesService.listPartnerDocuments().catch(() => []),
      ]);
      setCandidates(list);
      const counts: Record<string, number> = {};
      for (const d of docs) {
        counts[d.partner_candidate_id] = (counts[d.partner_candidate_id] || 0) + 1;
      }
      setDocCounts(counts);
    } catch {
      // Most likely the partner was suspended/rejected mid-session and the
      // token no longer authenticates — bounce to login, where signing in
      // again will surface the specific reason.
      await signOut();
      navigate('/partner-portal/login', { replace: true });
      return;
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleAddCandidate = async () => {
    setCreating(true);
    const candidate = await partnerCandidatesService.createCandidate();
    setCreating(false);
    setNewLink(`${window.location.origin}/partner-portal/candidate/${candidate.access_token}`);
    fetchCandidates();
  };

  const handleQuickSubmit = async (id: string) => {
    setActionError('');
    setCandidateMenu(null);
    try {
      await partnerCandidatesService.submitCandidate(id);
      fetchCandidates();
    } catch (err) {
      setActionError((err as Error).message || 'Could not submit. Please fill in all required fields.');
    }
  };

  const handleQuickLock = async (id: string) => {
    setCandidateMenu(null);
    await partnerCandidatesService.lockCandidate(id);
    fetchCandidates();
  };

  const handleQuickRequestChanges = async (id: string) => {
    setCandidateMenu(null);
    const note = prompt('What needs fixing?');
    if (!note?.trim()) return;
    await partnerCandidatesService.requestChanges(id, note.trim());
    fetchCandidates();
  };

  const handleQuickRevertToDraft = async (id: string) => {
    setCandidateMenu(null);
    if (!confirm('Move this candidate back to draft? It will become editable again.')) return;
    await partnerCandidatesService.revertToDraft(id);
    fetchCandidates();
  };

  const handleCopy = async () => {
    if (!newLink) return;
    await navigator.clipboard.writeText(newLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredCandidates = filterBySearch(candidates, search, (c) => [
    c.full_name, c.target_country, c.job_category,
    partner?.code ? formatCandidateRef(partner.code, c.candidate_number) : null,
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          {partner?.company_name && (
            <h1 className="font-orbitron text-2xl font-bold text-navy">{partner.company_name}</h1>
          )}
          {partner?.code && (
            <p className="text-sm text-gray-500 mt-1">
              Agency code: <span className="font-semibold text-navy">{partner.code}</span>
            </p>
          )}
          <p className="text-sm font-space font-semibold text-gray-500 mt-1">Your Candidates</p>
        </div>
        <button
          onClick={handleAddCandidate}
          disabled={creating}
          className="inline-flex items-center gap-2 bg-coral text-white px-5 py-2.5 rounded-lg font-space font-semibold hover:bg-coral-dark transition disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Add Candidate
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        A candidate stays private to you while it's a <span className="font-semibold">Draft</span>. Blue Ox can't
        see its details until you (or the candidate) submit it.
      </p>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">{actionError}</div>
      )}

      {newLink && (
        <div className="bg-coral/5 border border-coral/20 rounded-xl p-4 mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="font-space font-semibold text-navy text-sm mb-1">Share this link with the candidate</p>
            <p className="text-sm text-gray-600 break-all">{newLink}</p>
          </div>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 inline-flex items-center gap-2 text-sm font-space font-semibold text-coral border border-coral/30 rounded-lg px-4 py-2 hover:bg-coral/10"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-coral border-t-transparent rounded-full"></div>
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500">
          No candidates yet. Click "Add Candidate" to create your first one.
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-4">
            <SearchInput value={search} onChange={setSearch} placeholder="Search candidates..." />
          </div>
          {filteredCandidates.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500">
              No candidates match your search.
            </div>
          ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-5 py-3 font-space font-semibold">Ref</th>
                <th className="px-5 py-3 font-space font-semibold">Name</th>
                <th className="px-5 py-3 font-space font-semibold">Target country</th>
                <th className="px-5 py-3 font-space font-semibold">Status</th>
                <th className="px-5 py-3 font-space font-semibold">Completion</th>
                <th className="px-5 py-3 font-space font-semibold">Created</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/partner-portal/candidates/${c.id}`)}
                  className="border-t border-gray-100 cursor-pointer hover:bg-gray-50 transition"
                >
                  <td className="px-5 py-3 text-gray-500 font-medium whitespace-nowrap">
                    {partner?.code ? formatCandidateRef(partner.code, c.candidate_number) : '—'}
                  </td>
                  <td className="px-5 py-3 text-navy font-medium whitespace-nowrap">{c.full_name || '(no name yet)'}</td>
                  <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{c.target_country || '—'}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span
                      title={c.status === 'draft' ? "Not visible to Blue Ox yet. Submit it so they can see it" : undefined}
                      className={`px-2.5 py-1 rounded-full text-xs font-space font-semibold ${STATUS_CLASSES[c.status]}`}
                    >
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <CompletionBar percent={getCompletionPercent(c, docCounts[c.id] || 0)} compact />
                  </td>
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (candidateMenu?.id === c.id) {
                            setCandidateMenu(null);
                            return;
                          }
                          const rect = e.currentTarget.getBoundingClientRect();
                          setCandidateMenu({ id: c.id, top: rect.bottom + 4, right: window.innerWidth - rect.right });
                        }}
                        className="p-1 rounded hover:bg-gray-100 text-gray-500"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          )}
        </>
      )}

      {candidateMenu && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setCandidateMenu(null)} />
          <div
            className="fixed w-48 bg-white rounded-lg shadow-lg border py-1 z-50"
            style={{ top: candidateMenu.top, right: candidateMenu.right }}
          >
            {(() => {
              const c = candidates.find((cand) => cand.id === candidateMenu.id);
              if (!c) return null;
              return (
                <>
                  {c.status === 'draft' && (
                    <button
                      onClick={() => handleQuickSubmit(c.id)}
                      title="Makes this candidate visible to Blue Ox for review"
                      className="w-full text-left px-4 py-2 text-sm text-coral hover:bg-gray-50"
                    >
                      Submit
                    </button>
                  )}
                  {c.status === 'submitted' && (
                    <button
                      onClick={() => handleQuickLock(c.id)}
                      title="Freezes the candidate's own link while you review it"
                      className="w-full text-left px-4 py-2 text-sm text-navy hover:bg-gray-50"
                    >
                      Lock / Start Review
                    </button>
                  )}
                  {c.status !== 'draft' && c.status !== 'changes_requested' && (
                    <button onClick={() => handleQuickRequestChanges(c.id)} className="w-full text-left px-4 py-2 text-sm text-navy hover:bg-gray-50">
                      Request Changes
                    </button>
                  )}
                  {c.status !== 'draft' && (
                    <button onClick={() => handleQuickRevertToDraft(c.id)} className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                      Revert to Draft
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default Dashboard;
