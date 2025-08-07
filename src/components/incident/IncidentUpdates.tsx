import { Clock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Update {
  id: string;
  content: string;
  createdAt: string;
  updatedBy?: {
    id: string;
    name: string;
    email?: string;
  };
}

interface IncidentUpdatesProps {
  updates: Update[];
  className?: string;
}

export default function IncidentUpdates({ updates, className = '' }: IncidentUpdatesProps) {
  if (!updates || updates.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 text-center text-gray-500 ${className}`}>
        <p>No updates available for this incident.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900">Incident Updates</h3>
      <div className="flow-root">
        <ul role="list" className="-mb-8">
          {updates.map((update, updateIdx) => (
            <li key={update.id}>
              <div className="relative pb-8">
                {updateIdx !== updates.length - 1 ? (
                  <span 
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" 
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                        updateIdx % 2 === 0 ? 'bg-blue-500' : 'bg-green-500'
                      }`}
                    >
                      {updateIdx % 2 === 0 ? (
                        <AlertCircle className="h-5 w-5 text-white" aria-hidden="true" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-white" aria-hidden="true" />
                      )}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        {update.content}
                      </p>
                      {update.updatedBy && (
                        <div className="mt-1 text-xs text-gray-500 flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          <span className="font-medium">{update.updatedBy.name}</span>
                          {update.updatedBy.email && (
                            <span className="mx-1">•</span>
                          )}
                          {update.updatedBy.email && (
                            <span className="text-gray-400">{update.updatedBy.email}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1 text-gray-400" />
                        <time dateTime={update.createdAt}>
                          {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
