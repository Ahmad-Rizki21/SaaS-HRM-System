'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Plus, 
  Search, 
  Trash2, 
  Eye,
  ExternalLink,
  Filter,
  MoreVertical,
  Calendar,
  Shield,
  BookOpen,
  X,
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import axiosInstance from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { ErrorModal } from "@/components/ErrorModal";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Cookies from 'js-cookie';

/**
 * PdfEmbed: Fetches PDF via authenticated API and renders using blob URL.
 * This bypasses download managers that intercept direct file URLs.
 */
function PdfEmbed({ docId, title }: { docId: number; title: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;

    const fetchPdf = async () => {
      try {
        const token = Cookies.get('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
        const res = await fetch(`${apiUrl}/documents/${docId}/preview`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch PDF');
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch (e) {
        console.error('PDF preview error:', e);
        setError(true);
      }
    };

    fetchPdf();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [docId]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Gagal memuat dokumen. Silakan coba unduh secara langsung.</p>
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Memuat dokumen...</p>
      </div>
    );
  }

  return (
    <embed
      src={blobUrl}
      type="application/pdf"
      className="w-full h-full"
      title={title}
    />
  );
}

interface Document {
  id: number;
  title: string;
  description: string;
  file_path: string;
  file_url: string;
  type: 'sk' | 'regulation';
  is_published: boolean;
  published_at: string;
  created_at: string;
}

export default function DocumentsPage() {
  const { user, hasPermission } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'sk' | 'regulation'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"error" | "success">("error");

  // PDF Viewer state
  const [viewerDoc, setViewerDoc] = useState<Document | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'sk' as 'sk' | 'regulation',
    is_published: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/documents');
      setDocuments(response.data.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setModalType("error");
      setModalMessage("Gagal mengambil data dokumen");
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setModalType("error");
      setModalMessage("Silakan pilih file PDF");
      setIsErrorModalOpen(true);
      return;
    }

    try {
      setIsSubmitting(true);
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('type', formData.type);
      data.append('file', selectedFile);
      data.append('is_published', formData.is_published ? '1' : '0');

      await axiosInstance.post('/documents', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setModalType("success");
      setModalMessage('Dokumen berhasil diunggah');
      setIsErrorModalOpen(true);
      setIsModalOpen(false);
      resetForm();
      fetchDocuments();
    } catch (error: any) {
      setModalType("error");
      setModalMessage(error.response?.data?.message || 'Gagal mengunggah dokumen');
      setIsErrorModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) return;

    try {
      await axiosInstance.delete(`/documents/${id}`);
      setModalType("success");
      setModalMessage('Dokumen berhasil dihapus');
      setIsErrorModalOpen(true);
      fetchDocuments();
    } catch (error) {
      setModalType("error");
      setModalMessage('Gagal menghapus dokumen');
      setIsErrorModalOpen(true);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'sk' as 'sk' | 'regulation',
      is_published: true,
    });
    setSelectedFile(null);
  };

  const filteredDocuments = documents.filter(doc => 
    (activeTab === 'all' || doc.type === activeTab) && 
    (doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     doc.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const canManage = hasPermission('manage-documents');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dokumen Perusahaan</h1>
          <p className="text-muted-foreground">Lihat dan unduh Surat Keputusan (SK) serta Regulasi Perusahaan.</p>
        </div>
        {canManage && (
          <Button onClick={() => { 
            setIsModalOpen(true); 
            setFormData({
              ...formData, 
              type: activeTab === 'all' ? 'sk' : activeTab 
            }); 
          }}>
            <Plus className="mr-2 h-4 w-4" /> Unggah Dokumen
          </Button>
        )}
      </div>

      <div className="flex flex-col space-y-4">
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'all' 
                ? 'bg-background text-primary shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Semua Dokumen
          </button>
          <button
            onClick={() => setActiveTab('sk')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'sk' 
                ? 'bg-background text-primary shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shield className="inline-block mr-2 h-4 w-4" /> Surat Keputusan (SK)
          </button>
          <button
            onClick={() => setActiveTab('regulation')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'regulation' 
                ? 'bg-background text-primary shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen className="inline-block mr-2 h-4 w-4" /> Regulasi Perusahaan
          </button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari dokumen..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Dokumen</TableHead>
                    <TableHead>Tanggal Publish</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : filteredDocuments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        Tidak ada dokumen ditemukan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{doc.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{doc.description || 'Tidak ada deskripsi'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="mr-2 h-3 w-3" />
                            {doc.published_at ? format(new Date(doc.published_at), 'dd MMM yyyy', { locale: id }) : '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {doc.is_published ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Terbit</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Draft</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setViewerDoc(doc)}
                              title="Baca PDF"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = doc.file_url;
                                link.setAttribute('download', `${doc.title}.pdf`);
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                              }}
                              title="Unduh"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {canManage && (
                              <DropdownMenu>
                                <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors outline-none">
                                  <MoreVertical className="h-4 w-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleDelete(doc.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader>
              <CardTitle>Unggah Dokumen Baru</CardTitle>
              <CardDescription>
                Pilih file PDF untuk diunggah sebagai {activeTab === 'sk' ? 'Surat Keputusan' : 'Regulasi Perusahaan'}.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpload}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Judul Dokumen</label>
                  <Input 
                    required 
                    placeholder="Contoh: SK Pengangkatan Karyawan" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Deskripsi (Opsional)</label>
                  <Input 
                    placeholder="Keterangan singkat mengenai dokumen ini" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Jenis Dokumen</label>
                  <select 
                    className="w-full p-2 border rounded-md text-sm"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  >
                    <option value="sk">Surat Keputusan (SK)</option>
                    <option value="regulation">Regulasi Perusahaan</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">File PDF</label>
                  <Input 
                    type="file" 
                    accept="application/pdf"
                    required
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-[10px] text-muted-foreground">Format: PDF, Maksimal: 10MB</p>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="is_published" 
                    checked={formData.is_published}
                    onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                  />
                  <label htmlFor="is_published" className="text-sm">Terbitkan sekarang</label>
                </div>
              </CardContent>
              <div className="flex justify-end gap-3 p-6 pt-0">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Mengunggah...' : 'Simpan Dokumen'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {viewerDoc && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-3 bg-white border-b shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{viewerDoc.title}</h3>
                <p className="text-xs text-muted-foreground">{viewerDoc.description || 'Dokumen Perusahaan'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = viewerDoc.file_url;
                  link.setAttribute('download', `${viewerDoc.title}.pdf`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                }}
                title="Unduh"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(viewerDoc.file_url, '_blank')}
                title="Buka di Tab Baru"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewerDoc(null)}
                title="Tutup"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 bg-gray-100">
            <PdfEmbed docId={viewerDoc.id} title={viewerDoc.title} />
          </div>
        </div>
      )}

      <ErrorModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        message={modalMessage}
        type={modalType}
      />
    </div>
  );
}
