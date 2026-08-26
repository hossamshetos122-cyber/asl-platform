interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center" role="status">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-bg-raised2">
        <svg className="h-5 w-5 text-text-dimmer" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      </div>
      <p className="font-body text-sm text-text-dimmer">{message}</p>
    </div>
  );
}
