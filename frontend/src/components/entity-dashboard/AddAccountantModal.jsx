import PhoneInput from '../PhoneInput';
import PasswordInput from '../PasswordInput';
import LoadingButton from './LoadingButton';

export default function AddAccountantModal({
  open,
  onClose,
  error,
  newAccountant,
  setNewAccountant,
  accountantPhoneData,
  setAccountantPhoneData,
  onSubmit,
  isSubmitting = false,
}) {
  if (!open) return null;

  const handleBackdropClick = () => {
    if (!isSubmitting) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex justify-center items-center px-4 pb-4 pt-0 !mt-0 z-[1000]"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white w-full max-w-[500px] p-8 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">Add New Accountant</h2>
        {error && (
          <p className="bg-red-50 border border-red-200 text-red-600 py-3 px-4 rounded-xl text-sm mb-4">
            {error}
          </p>
        )}
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <fieldset disabled={isSubmitting} className="flex flex-col gap-5 border-0 p-0 m-0 min-w-0">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-900">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter accountant's full name"
                value={newAccountant.name}
                onChange={(e) =>
                  setNewAccountant((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-900">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <PhoneInput onChange={setAccountantPhoneData} required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-900">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="Enter accountant's email address"
                value={newAccountant.email}
                onChange={(e) =>
                  setNewAccountant((prev) => ({ ...prev, email: e.target.value }))
                }
                required
                className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-900">
                Password <span className="text-red-500">*</span>
              </label>
              <PasswordInput
                placeholder="Create a password for the accountant"
                value={newAccountant.password}
                onChange={(e) =>
                  setNewAccountant((prev) => ({ ...prev, password: e.target.value }))
                }
                required
              />
            </div>
          </fieldset>
          <div className="flex gap-4 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-4 px-4 bg-slate-200 text-slate-800 border-none rounded-xl cursor-pointer hover:bg-slate-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <LoadingButton
              loading={isSubmitting}
              loadingLabel="Creating…"
              className="flex-1 py-4 px-4 bg-blue-500 text-white border-none rounded-xl font-semibold text-base cursor-pointer hover:bg-blue-600 transition-colors"
            >
              Create Accountant
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
}
