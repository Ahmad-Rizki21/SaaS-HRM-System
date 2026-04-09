"use client";

import React, { useState } from "react";
import { X, Plus, Upload, Image as ImageIcon, CheckCircle2, Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { getStorageUrl } from "@/lib/utils";

type TaskActivity = {
  id: number;
  activity_name: string;
  description?: string;
  sort_order: number;
  status: 'pending' | 'in_progress' | 'completed';
  has_before_photo: boolean;
  has_after_photo: boolean;
  completed_at?: string;
  evidence?: {
    photo_before_path?: string;
    photo_after_path?: string;
    notes?: string;
  };
};

type TaskActivitiesModalProps = {
  taskId: number;
  activities: TaskActivity[];
  isAssigner: boolean;
  isAssignee: boolean;
  onClose: () => void;
  onRefresh: () => void;
};

export default function TaskActivitiesModal({
  taskId,
  activities,
  isAssigner,
  isAssignee,
  onClose,
  onRefresh
}: TaskActivitiesModalProps) {
  const [newActivityName, setNewActivityName] = useState("");
  const [newActivityDesc, setNewActivityDesc] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [uploadingActivityId, setUploadingActivityId] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | undefined>>({});
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleAddActivity = async () => {
    if (!newActivityName.trim()) return;

    setIsAdding(true);
    try {
      await axiosInstance.post(`/tasks/${taskId}/activities`, {
        activities: [{
          activity_name: newActivityName,
          description: newActivityDesc || null,
        }]
      });
      setNewActivityName("");
      setNewActivityDesc("");
      onRefresh();
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal menambah kegiatan");
    } finally {
      setIsAdding(false);
    }
  };

  const handleFileSelect = (activityId: number, type: 'before' | 'after', file: File) => {
    const key = `${activityId}_${type}`;
    setSelectedFiles(prev => ({
      ...prev,
      [key]: file
    }));
  };

  const handleUploadEvidence = async (activityId: number) => {
    const beforeKey = `${activityId}_before`;
    const afterKey = `${activityId}_after`;
    
    if (!selectedFiles[afterKey]) {
      alert("Foto sesudah wajib diupload!");
      return;
    }

    setUploadingActivityId(activityId);
    
    const formData = new FormData();
    const beforeFile = selectedFiles[beforeKey];
    const afterFile = selectedFiles[afterKey];
    
    if (beforeFile) {
      formData.append('photo_before', beforeFile);
    }
    if (afterFile) {
      formData.append('photo_after', afterFile);
    }
    if (evidenceNotes) {
      formData.append('notes', evidenceNotes);
    }

    try {
      await axiosInstance.post(`/tasks/activities/${activityId}/evidence`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSelectedFiles({});
      setEvidenceNotes("");
      onRefresh();
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal upload bukti");
    } finally {
      setUploadingActivityId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Selesai</span>;
      case 'in_progress':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-600 border border-blue-100">Dikerjakan</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-50 text-gray-500 border border-gray-100">Pending</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Kegiatan Tugas</h2>
            <p className="text-sm text-gray-500 mt-1">
              {activities.length} kegiatan • {activities.filter(a => a.status === 'completed').length} selesai
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Add Activity Form (Assigner Only) */}
          {isAssigner && (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Tambah Kegiatan Baru</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nama kegiatan (misal: Bersihkan Halaman)"
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]"
                />
                <textarea
                  placeholder="Deskripsi (opsional)"
                  value={newActivityDesc}
                  onChange={(e) => setNewActivityDesc(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000] resize-none"
                  rows={2}
                />
                <button
                  onClick={handleAddActivity}
                  disabled={isAdding || !newActivityName.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#8B0000] text-white rounded-lg text-sm font-semibold hover:bg-[#660000] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Tambah Kegiatan
                </button>
              </div>
            </div>
          )}

          {/* Activities List */}
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="mx-auto text-gray-300 mb-3" size={48} />
              <p className="text-gray-500 text-sm">Belum ada kegiatan</p>
              {isAssigner && <p className="text-gray-400 text-xs mt-1">Tambahkan kegiatan untuk memulai</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div key={activity.id} className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                          {index + 1}
                        </span>
                        <h4 className="font-semibold text-gray-900">{activity.activity_name}</h4>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-gray-500 ml-8">{activity.description}</p>
                      )}
                    </div>
                    {getStatusBadge(activity.status)}
                  </div>

                  {/* Evidence Upload Section (Assignee Only) */}
                  {isAssignee && activity.status !== 'completed' && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-600 mb-3">Upload Bukti Pekerjaan</p>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        {/* Before Photo (Optional) */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-2">Foto Sebelum (Opsional)</label>
                          <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#8B0000] transition-colors">
                            <Upload size={16} className="text-gray-400" />
                            <span className="text-xs text-gray-600">
                              {selectedFiles[`${activity.id}_before`] ? 'File dipilih' : 'Pilih file'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileSelect(activity.id, 'before', file);
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {/* After Photo (Required) */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-2">Foto Sesudah (Wajib) *</label>
                          <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#8B0000] transition-colors">
                            <Upload size={16} className="text-gray-400" />
                            <span className="text-xs text-gray-600">
                              {selectedFiles[`${activity.id}_after`] ? 'File dipilih' : 'Pilih file'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileSelect(activity.id, 'after', file);
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      <textarea
                        placeholder="Catatan (opsional)"
                        value={evidenceNotes}
                        onChange={(e) => setEvidenceNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000] resize-none mb-3"
                        rows={2}
                      />

                      <button
                        onClick={() => handleUploadEvidence(activity.id)}
                        disabled={uploadingActivityId === activity.id || !selectedFiles[`${activity.id}_after`]}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {uploadingActivityId === activity.id ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Mengupload...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={16} />
                            Selesai & Upload Bukti
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Show Evidence if exists */}
                  {activity.evidence && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-600 mb-3">Bukti Pekerjaan</p>
                      <div className="grid grid-cols-2 gap-3">
                        {activity.evidence?.photo_before_path && (
                          <div>
                            <p className="text-xs text-gray-500 mb-2 font-medium">Sebelum:</p>
                            <img
                              src={getStorageUrl(activity.evidence.photo_before_path)}
                              alt="Before"
                              onClick={() => activity.evidence?.photo_before_path && setPreviewImage(getStorageUrl(activity.evidence.photo_before_path))}
                              className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-all cursor-zoom-in shadow-sm"
                            />
                          </div>
                        )}
                          <div>
                            <p className="text-xs text-gray-500 mb-2 font-medium">Sesudah:</p>
                            <img
                              src={getStorageUrl(activity.evidence?.photo_after_path)}
                              alt="After"
                              onClick={() => activity.evidence?.photo_after_path && setPreviewImage(getStorageUrl(activity.evidence.photo_after_path))}
                              className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-all cursor-zoom-in shadow-sm"
                            />
                          </div>
                      </div>
                      {activity.evidence.notes && (
                        <p className="text-xs text-gray-600 mt-3 p-3 bg-gray-50 rounded-lg">{activity.evidence.notes}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
          >
            <X size={24} />
          </button>
          <img 
            src={previewImage} 
            alt="Preview" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in duration-300"
          />
        </div>
      )}
    </div>
  );
}
