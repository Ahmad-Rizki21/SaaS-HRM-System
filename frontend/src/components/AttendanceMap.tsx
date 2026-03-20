'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import Cookies from 'js-cookie';

// Fix for default marker icon issue in Leaflet + Next.js
import L from 'leaflet';

// Dynamic import for MapContainer and other components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

interface Attendance {
  id: number;
  latitude_in: string | number;
  longitude_in: string | number;
  status: string;
  check_in: string;
  user: {
    name: string;
    nik: string;
    profile_photo_url: string | null;
  };
}

const AttendanceMap = () => {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initMap = async () => {
      const L = await import('leaflet');
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      fetchHeatmap();
    };
    initMap();
  }, []);

  const fetchHeatmap = async () => {
    try {
      const token = Cookies.get('token');
      const response = await axios.get('http://127.0.0.1:8000/api/attendance/heatmap', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === 'success') {
        setAttendances(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching heatmap:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-[400px] w-full bg-slate-100 animate-pulse flex items-center justify-center rounded-xl border border-dashed border-slate-300">Memuat Peta...</div>;

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden border border-slate-200 shadow-sm z-0">
      <MapContainer 
        center={[-6.2088, 106.8456]} // Default to Jakarta
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {attendances.map((item) => (
          item.latitude_in && item.longitude_in && (
            <Marker 
              key={item.id} 
              position={[parseFloat(item.latitude_in.toString()), parseFloat(item.longitude_in.toString())]}
            >
              <Popup>
                <div className="text-sm p-1 min-w-[150px]">
                  <div className="flex items-center gap-3 mb-2 pb-2 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-100 shrink-0">
                      {item.user.profile_photo_url ? (
                        <img src={item.user.profile_photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400 bg-gray-50">
                          {item.user.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{item.user.name}</p>
                      <p className="text-[10px] font-bold text-[#8B0000] uppercase tracking-tighter">NIK: {item.user.nik || '-'}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] text-gray-500">Masuk: <span className="font-bold text-gray-900">{new Date(item.check_in).toLocaleTimeString()}</span></p>
                    <p className="text-[11px] text-gray-500">Status: <span className={`font-bold capitalize ${item.status === 'late' ? 'text-red-500' : 'text-emerald-500'}`}>{item.status}</span></p>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
};

export default AttendanceMap;
