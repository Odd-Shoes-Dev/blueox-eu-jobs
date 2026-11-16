import React from 'react';
import { Send } from 'lucide-react';

interface Props {
  onStartChat: () => void;
}

// Keeps the primary action ("Message" — starting the job/study application
// chat) always one tap away on mobile, instead of competing with it for
// attention once the hero scrolls out of view.
const StickyMobileCta: React.FC<Props> = ({ onStartChat }) => {
  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-white border-t border-gray-200">
      <button
        onClick={onStartChat}
        className="flex items-center justify-center gap-2 bg-coral hover:bg-coral-dark text-white font-space font-semibold text-sm py-3 rounded-xl transition-all shadow-lg w-full"
      >
        <Send className="w-4 h-4" />
        Message
      </button>
    </div>
  );
};

export default StickyMobileCta;
