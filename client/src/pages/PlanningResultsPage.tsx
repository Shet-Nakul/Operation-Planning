import React from 'react';
import { usePlanningState } from '../hooks/usePlanningState';

/**
 * Page to display surgery planning results.
 */
export default function PlanningResultsPage() {
  const { result, error, isRunning } = usePlanningState();

  if (isRunning) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-4">Planning in progress...</h2>
        <p>Please wait while the planning process completes.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-4">No Results</h2>
        <p>Run the planning process to view results.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Planning Results</h2>
      <pre className="bg-slate-100 p-4 rounded overflow-auto max-h-96">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
