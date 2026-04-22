import React from 'react';

const tabClass = (active) =>
    `px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
        active ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

export default function BillingSubTabBar({ activeBillingSubTab, setActiveBillingSubTab, counts }) {
    const { completed, dailySheet, detailClaim, filed } = counts;
    return (
        <div className="flex shrink-0 flex-wrap gap-1 bg-slate-50 p-1 rounded-xl w-fit border border-slate-200">
            <button type="button" onClick={() => setActiveBillingSubTab('completed')} className={tabClass(activeBillingSubTab === 'completed')}>
                Completed ({completed})
            </button>
            <button type="button" onClick={() => setActiveBillingSubTab('daily_sheet')} className={tabClass(activeBillingSubTab === 'daily_sheet')}>
                Daily sheet ({dailySheet})
            </button>
            <button type="button" onClick={() => setActiveBillingSubTab('detail_claim')} className={tabClass(activeBillingSubTab === 'detail_claim')}>
                Detail claim Listing ({detailClaim})
            </button>
            <button type="button" onClick={() => setActiveBillingSubTab('filed_claims')} className={tabClass(activeBillingSubTab === 'filed_claims')}>
                Filed Claims ({filed})
            </button>
        </div>
    );
}
