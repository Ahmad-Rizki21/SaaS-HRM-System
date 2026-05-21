import React from 'react';
import TrackingMap from '@/components/TrackingMap';

export const metadata = {
  title: 'Live Tracking Teknisi - HRMS',
  description: 'Pantau pergerakan dan posisi real-time dari teknisi di lapangan.',
};

export default function LiveTrackingPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] w-full">
      <div className="p-6 pb-4">
        <h1 className="text-2xl font-bold text-slate-800">Live Tracking Teknisi</h1>
        <p className="text-slate-500 text-sm mt-1">Pantau pergerakan teknisi di lapangan secara real-time dan histori perjalanan hari ini.</p>
      </div>
      
      <div className="flex-1 px-6 pb-6">
        <TrackingMap />
      </div>
    </div>
  );
}
