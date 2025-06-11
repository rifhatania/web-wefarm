// app/track/page.js
import { Suspense } from 'react';
import TrackPageClient from './track-client';

// Loading component
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Memuat data tanaman...</p>
      </div>
    </div>
  );
}

// Main page component with proper Suspense wrapping
export default function TrackPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TrackPageClient />
    </Suspense>
  );
}