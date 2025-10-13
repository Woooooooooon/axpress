import { LoadingSpinner } from "./LoadingSpinner"

interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = "로딩 중..." }: LoadingStateProps) {
  return (
    <div className="bg-[var(--ax-bg-soft)] rounded-lg p-6 flex flex-col items-center justify-center space-y-4">
      <LoadingSpinner size="lg" />
      <p className="text-[var(--ax-fg)]/60 text-center">{message}</p>
    </div>
  )
}
