import { useParams } from 'react-router-dom';

const UserSettings = () => {
    const { serial } = useParams();

    return (
        <div className="flex h-[calc(100vh-64px)] relative overflow-x-hidden">
            <main className="flex-1 flex flex-col min-h-0 overflow-x-hidden overflow-y-auto bg-slate-50">
                <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 lg:p-8">
                    <h1 className="text-2xl font-semibold text-slate-900 mb-2">User settings</h1>
                    <p className="text-slate-600">
                        Manage your profile and account preferences.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default UserSettings;
