/** Simple modal shown when a feature is not yet implemented. */
export default function FeatureComingSoonModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] px-4">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Coming soon</h3>
        <p className="text-slate-600 text-sm mb-6">
          This feature is currently in development. Please check back later.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold text-sm hover:bg-blue-600 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
}
