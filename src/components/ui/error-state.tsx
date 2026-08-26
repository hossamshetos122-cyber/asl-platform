interface ErrorStateProps {
  message: string;
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-live/20 bg-live/5 px-4 py-3" role="alert">
      <p className="font-body text-sm text-live">{message}</p>
    </div>
  );
}
