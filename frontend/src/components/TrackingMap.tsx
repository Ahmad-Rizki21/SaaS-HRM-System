'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import axiosInstance from '@/lib/axios';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Battery, BatteryCharging, BatteryFull, BatteryLow, Wifi, Navigation } from 'lucide-react';

// Dynamic imports for Leaflet components
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then((mod) => mod.Polyline), { ssr: false });

interface EmployeeTrack {
  id: number;
  user_id: number;
  latitude: string | number;
  longitude: string | number;
  accuracy: string | number;
  battery_level: number;
  recorded_at: string;
  user: {
    name: string;
    nik: string;
    profile_photo_url: string | null;
  };
}

export default function TrackingMap() {
  const [tracks, setTracks] = useState<EmployeeTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [leafletLib, setLeafletLib] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  useEffect(() => {
    const loadLeaflet = async () => {
      const L = await import('leaflet');
      setLeafletLib(L);
      fetchLiveTracking();
    };
    loadLeaflet();

    // Auto refresh every 30 seconds
    const interval = setInterval(fetchLiveTracking, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUser !== null) {
      fetchHistory(selectedUser);
    } else {
      setHistory([]);
    }
  }, [selectedUser]);

  const fetchLiveTracking = async () => {
    try {
      const response = await axiosInstance.get('/tracking/live');
      if (response.data.status === 'success') {
        setTracks(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching live tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (userId: number) => {
    try {
      const response = await axiosInstance.get(`/tracking/history/${userId}`);
      if (response.data.status === 'success') {
        setHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const getBatteryIcon = (level: number) => {
    if (level > 80) return <BatteryFull className="w-3 h-3 text-emerald-500" />;
    if (level > 20) return <Battery className="w-3 h-3 text-yellow-500" />;
    return <BatteryLow className="w-3 h-3 text-red-500" />;
  };

  const createCustomIcon = (item: EmployeeTrack) => {
    if (!leafletLib) return null;
    const initials = item.user.name.charAt(0).toUpperCase();
    const photo = item.user.profile_photo_url;
    const isActive = new Date().getTime() - new Date(item.recorded_at).getTime() < 300000; // < 5 mins
    
    const html = `
      <div class="relative group cursor-pointer transition-transform duration-300 hover:scale-110">
        <div class="w-12 h-12 rounded-full border-4 ${isActive ? 'border-emerald-400' : 'border-gray-400'} shadow-lg overflow-hidden flex items-center justify-center bg-white">
          ${photo 
            ? `<img src="${photo}" class="w-full h-full object-cover" />` 
            : `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#800000] to-red-600"><span class="text-white text-sm font-bold">${initials}</span></div>`
          }
        </div>
        ${isActive ? '<div class="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm animate-pulse"></div>' : ''}
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 rounded-full shadow border border-gray-100 text-[9px] font-bold whitespace-nowrap flex items-center gap-1">
          ${item.battery_level}%
        </div>
      </div>
    `;

    return leafletLib.divIcon({
      html: html,
      className: 'custom-div-icon bg-transparent border-none', 
      iconSize: [48, 48],
      iconAnchor: [24, 48],
      popupAnchor: [0, -50],
    });
  };

  if (loading || !leafletLib) return <div className="h-full w-full min-h-[600px] bg-slate-50 animate-pulse flex items-center justify-center rounded-2xl border border-slate-200">Menghubungkan ke Satelit...</div>;

  return (
    <div className="w-full h-full min-h-[700px] rounded-2xl overflow-hidden shadow-xl border border-slate-200 relative isolate bg-white flex">
      {/* Map Area */}
      <div className="flex-1 relative z-0">
        <MapContainer 
          center={[-6.200000, 106.816666]} // Jakarta
          zoom={12} 
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {tracks.map((item) => {
            const lat = parseFloat(item.latitude.toString());
            const lng = parseFloat(item.longitude.toString());
            if (isNaN(lat) || isNaN(lng)) return null;

            return (
              <Marker 
                key={item.id} 
                position={[lat, lng]}
                icon={createCustomIcon(item)}
                eventHandlers={{
                  click: () => setSelectedUser(item.user_id),
                }}
              >
                <Popup className="rounded-xl overflow-hidden">
                  <div className="min-w-[200px] p-1">
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                      <div className="w-12 h-12 rounded-full overflow-hidden shadow-sm shrink-0">
                        {item.user.profile_photo_url ? (
                          <img src={item.user.profile_photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#800000] flex items-center justify-center text-white font-bold">
                            {item.user.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 leading-tight">{item.user.name}</p>
                        <p className="text-[10px] text-gray-500 font-medium">NIK: {item.user.nik || '-'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5" /> Akurasi GPS</span>
                        <span className="font-medium text-gray-900">{parseFloat(item.accuracy.toString()).toFixed(1)}m</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="flex items-center gap-1.5">{getBatteryIcon(item.battery_level)} Baterai</span>
                        <span className="font-medium text-gray-900">{item.battery_level}%</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5" /> Update Terakhir</span>
                        <span className="font-medium text-emerald-600">{new Date(item.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedUser(item.user_id); }}
                      className="w-full mt-4 bg-gray-900 hover:bg-[#800000] text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                    >
                      Lihat Rute Perjalanan
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {history.length > 0 && (
            <Polyline 
              positions={history.map(h => [parseFloat(h.latitude.toString()), parseFloat(h.longitude.toString())])}
              color="#800000"
              weight={4}
              opacity={0.7}
              dashArray="10, 10"
            />
          )}
        </MapContainer>
      </div>

      {/* Sidebar Status (Absolute floating or flex depending on width) */}
      <div className="w-80 bg-white border-l border-slate-200 z-[400] shadow-[-4px_0_15px_rgba(0,0,0,0.05)] overflow-y-auto">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 sticky top-0 backdrop-blur-md">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Teknisi Aktif ({tracks.length})
          </h3>
          <p className="text-xs text-slate-500 mt-1">Real-time update dari perangkat</p>
        </div>
        
        <div className="p-3 space-y-2">
          {tracks.map((track) => (
            <Card 
              key={track.id} 
              className={`p-3 cursor-pointer transition-all border-l-4 ${selectedUser === track.user_id ? 'border-l-[#800000] bg-red-50/30' : 'border-l-transparent hover:border-l-slate-300'}`}
              onClick={() => setSelectedUser(track.user_id)}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    {track.user.profile_photo_url ? (
                      <img src={track.user.profile_photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                        {track.user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800 truncate">{track.user.name}</p>
                  <p className="text-[10px] text-slate-500">{new Date(track.recorded_at).toLocaleTimeString()}</p>
                </div>
                <div className="flex flex-col items-end">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                    {track.battery_level}%
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
          {tracks.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">
              Tidak ada teknisi yang mengirim lokasi saat ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
