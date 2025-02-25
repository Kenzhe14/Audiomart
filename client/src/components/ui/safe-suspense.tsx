import { Suspense, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function SafeSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      {children}
    </Suspense>
  );
}
