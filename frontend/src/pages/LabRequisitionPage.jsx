import { useParams } from 'react-router-dom';
import LabRequisitionForm from '../components/LabRequisitionForm';

export default function LabRequisitionPage() {
  const { interactionId } = useParams();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-100 flex flex-col items-center px-4 py-6 sm:py-8">
      <div className="w-full max-w-5xl mb-4">
        <p className="text-xs text-slate-500">
          Interaction ID:&nbsp;
          <span className="font-mono text-slate-700">{interactionId}</span>
        </p>
      </div>
      <LabRequisitionForm />
    </div>
  );
}

