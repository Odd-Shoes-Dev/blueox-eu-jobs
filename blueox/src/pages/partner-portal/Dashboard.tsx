import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Copy, Check } from 'lucide-react';
import * as partnerCandidatesService from '../../services/partnerCandidatesService';
import type { PartnerCandidate } from '../../services/partnerCandidatesService';
import { usePartnerAuth } from '../../contexts/PartnerAuthContext';

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
  const { signOut } = usePartnerAuth();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<PartnerCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLink, setNewLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      setCandidates(await partnerCandidatesService.listCandidates());
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

  const handleCopy = async () => {
    if (!newLink) return;
    await navigator.clipboard.writeText(newLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-orbitron text-2xl font-bold text-navy">Your Candidates</h1>
        <button
          onClick={handleAddCandidate}
          disabled={creating}
          className="inline-flex items-center gap-2 bg-coral text-white px-5 py-2.5 rounded-lg font-space font-semibold hover:bg-coral-dark transition disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Add Candidate
        </button>
      </div>

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
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-5 py-3 font-space font-semibold">Name</th>
                <th className="px-5 py-3 font-space font-semibold">Target country</th>
                <th className="px-5 py-3 font-space font-semibold">Status</th>
                <th className="px-5 py-3 font-space font-semibold">Created</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.id} className="border-t border-gray-100">
                  <td className="px-5 py-3 text-navy font-medium">{c.full_name || '(no name yet)'}</td>
                  <td className="px-5 py-3 text-gray-600">{c.target_country || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-space font-semibold ${STATUS_CLASSES[c.status]}`}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right">
                    <Link to={`/partner-portal/candidates/${c.id}`} className="text-coral font-space font-semibold hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
