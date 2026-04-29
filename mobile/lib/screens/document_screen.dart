import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../api/api_service.dart';
import '../widgets/skeleton_loading.dart';
import 'pdf_viewer_screen.dart';

class DocumentScreen extends StatefulWidget {
  const DocumentScreen({super.key});

  @override
  State<DocumentScreen> createState() => _DocumentScreenState();
}

class _DocumentScreenState extends State<DocumentScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<dynamic> _allDocuments = [];
  List<dynamic> _skDocuments = [];
  List<dynamic> _regulationDocuments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _fetchDocuments();
  }

  Future<void> _fetchDocuments() async {
    setState(() => _isLoading = true);
    final all = await ApiService.getDocuments(); // Fetch all without type filter
    final sks = await ApiService.getDocuments(type: 'sk');
    final regulations = await ApiService.getDocuments(type: 'regulation');

    setState(() {
      _allDocuments = all ?? [];
      _skDocuments = sks ?? [];
      _regulationDocuments = regulations ?? [];
      _isLoading = false;
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: Text(
          'Dokumen Perusahaan',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFF8B0000),
          unselectedLabelColor: Colors.grey,
          indicatorColor: const Color(0xFF8B0000),
          labelStyle: GoogleFonts.inter(fontWeight: FontWeight.bold),
          tabs: const [
            Tab(text: 'Semua'),
            Tab(text: 'Surat Keputusan'),
            Tab(text: 'Regulasi'),
          ],
        ),
      ),
      body: _isLoading
          ? const DocumentListSkeleton()
          : TabBarView(
              controller: _tabController,
              children: [
                _buildDocumentList(_allDocuments),
                _buildDocumentList(_skDocuments),
                _buildDocumentList(_regulationDocuments),
              ],
            ),
    );
  }

  Widget _buildDocumentList(List<dynamic> documents) {
    if (documents.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.file_copy_outlined, size: 64, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text(
              'Tidak ada dokumen ditemukan',
              style: GoogleFonts.inter(color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchDocuments,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: documents.length,
        itemBuilder: (context, index) {
          final doc = documents[index];
          final publishedAt = doc['published_at'] != null 
              ? DateTime.parse(doc['published_at']) 
              : DateTime.parse(doc['created_at']);
          
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: Colors.grey[200]!),
            ),
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () {
                final fileUrl = ApiService.fixUrl(doc['file_url']);
                if (fileUrl.isNotEmpty) {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => PdfViewerScreen(
                        url: fileUrl,
                        title: doc['title'],
                      ),
                    ),
                  );
                }
              },
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(Icons.picture_as_pdf, color: Colors.grey[700]),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            doc['title'] ?? 'Tanpa Judul',
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            doc['description'] ?? 'Tidak ada deskripsi',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Icon(Icons.calendar_today, size: 12, color: Colors.grey[400]),
                              const SizedBox(width: 4),
                              Text(
                                DateFormat('dd MMM yyyy').format(publishedAt),
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  color: Colors.grey[400],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right, color: Colors.grey),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Future<void> _openDocument(String? url) async {
    if (url == null || url.isEmpty) return;
    
    final fixedUrl = ApiService.fixUrl(url);
    final uri = Uri.parse(fixedUrl);
    
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tidak dapat membuka dokumen')),
        );
      }
    }
  }
}
