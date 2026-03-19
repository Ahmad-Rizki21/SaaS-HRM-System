import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../api/api_service.dart';

class ProfileScreen extends StatefulWidget {
  @override
  _ProfileScreenState createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _userData;
  bool _isLoading = true;
  bool _isEditing = false;
  bool _isSaving = false;

  final Color maroon = Color(0xFF800000);

  // Controllers untuk form edit
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _nikController = TextEditingController();
  final _addressController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _nikController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  void _loadProfile() async {
    final data = await ApiService.getProfile();
    if (mounted) {
      setState(() {
        _userData = data;
        _isLoading = false;
        _populateControllers();
      });
    }
  }

  void _populateControllers() {
    _nameController.text = _userData?['name'] ?? '';
    _emailController.text = _userData?['email'] ?? '';
    _phoneController.text = _userData?['phone'] ?? '';
    _nikController.text = _userData?['nik'] ?? '';
    _addressController.text = _userData?['address'] ?? '';
  }

  void _toggleEdit() {
    setState(() {
      _isEditing = !_isEditing;
      if (!_isEditing) _populateControllers(); // Reset jika cancel
    });
  }

  void _saveProfile() async {
    // Cek field sensitif yang diubah
    List<String> sensitiveChanged = [];
    if (_emailController.text != (_userData?['email'] ?? '')) sensitiveChanged.add('Email');
    if (_phoneController.text != (_userData?['phone'] ?? '')) sensitiveChanged.add('No. Telepon');
    if (_nikController.text != (_userData?['nik'] ?? '')) sensitiveChanged.add('NIK');

    // Jika ada field sensitif, tampilkan dialog konfirmasi
    if (sensitiveChanged.isNotEmpty) {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
          title: Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 28),
              SizedBox(width: 10),
              Text("Perlu Persetujuan", style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text("Perubahan pada field berikut memerlukan persetujuan HRD/Admin:",
                  style: TextStyle(fontSize: 14)),
              SizedBox(height: 12),
              ...sensitiveChanged.map((field) => Padding(
                    padding: EdgeInsets.only(bottom: 6),
                    child: Row(
                      children: [
                        Icon(Icons.lock_outline, size: 16, color: maroon),
                        SizedBox(width: 8),
                        Text(field, style: TextStyle(fontWeight: FontWeight.w600, color: maroon)),
                      ],
                    ),
                  )),
              SizedBox(height: 12),
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  "Pengajuan akan dikirim ke Admin/HRD untuk di-review. Data lama tetap berlaku sampai pengajuan disetujui.",
                  style: TextStyle(fontSize: 12, color: Colors.orange[800]),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text("Batal", style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              style: ElevatedButton.styleFrom(
                backgroundColor: maroon,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: Text("Kirim Pengajuan", style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );

      if (confirmed != true) return;
    }

    setState(() => _isSaving = true);

    final result = await ApiService.updateProfile({
      'name': _nameController.text,
      'email': _emailController.text,
      'phone': _phoneController.text,
      'nik': _nikController.text,
      'address': _addressController.text,
    });

    setState(() => _isSaving = false);

    if (result['success']) {
      final needsApproval = result['needs_approval'] ?? false;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Icon(needsApproval ? Icons.hourglass_bottom : Icons.check_circle, color: Colors.white, size: 20),
              SizedBox(width: 10),
              Expanded(child: Text(result['message'])),
            ],
          ),
          backgroundColor: needsApproval ? Colors.orange : Colors.green,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );

      setState(() => _isEditing = false);
      _loadProfile(); // Refresh data
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  String _fixPhotoUrl(String? url) {
    if (url == null) return '';
    if (!url.startsWith('http')) return 'http://192.168.1.9:8000/storage/$url';
    return url.replaceAll('localhost', '192.168.1.9').replaceAll('127.0.0.1', '192.168.1.9');
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Center(child: CircularProgressIndicator(color: maroon));
    }

    final name = _userData?['name'] ?? 'Karyawan';
    final role = _userData?['role']?['name'] ?? '-';
    final photoUrl = _fixPhotoUrl(_userData?['profile_photo_url']);

    return Column(
      children: [
        // Header with Edit button
        Padding(
          padding: EdgeInsets.fromLTRB(25, 20, 15, 0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("Profil Saya", style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold)),
              TextButton.icon(
                onPressed: _isEditing ? null : _toggleEdit,
                icon: Icon(_isEditing ? Icons.close : Icons.edit, color: maroon, size: 18),
                label: Text(_isEditing ? "" : "Edit", style: TextStyle(color: maroon)),
              ),
            ],
          ),
        ),

        Expanded(
          child: SingleChildScrollView(
            padding: EdgeInsets.symmetric(horizontal: 25),
            child: Column(
              children: [
                SizedBox(height: 10),
                // Foto Profil
                CircleAvatar(
                  radius: 50,
                  backgroundColor: maroon,
                  backgroundImage: photoUrl.isNotEmpty ? NetworkImage(photoUrl) : null,
                  child: photoUrl.isEmpty
                      ? Text(name[0].toUpperCase(), style: TextStyle(fontSize: 38, color: Colors.white, fontWeight: FontWeight.bold))
                      : null,
                ),
                SizedBox(height: 12),
                Text(name, style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold)),
                Text(role, style: GoogleFonts.outfit(fontSize: 13, color: Colors.grey[600])),
                SizedBox(height: 25),

                // Data Fields
                _buildField(Icons.person_outline, "Nama Lengkap", _nameController, editable: _isEditing),
                _buildField(Icons.email_outlined, "Email", _emailController,
                    editable: _isEditing, isSensitive: true),
                _buildField(Icons.phone_outlined, "No. Telepon", _phoneController,
                    editable: _isEditing, isSensitive: true),
                _buildField(Icons.badge_outlined, "NIK", _nikController,
                    editable: _isEditing, isSensitive: true),
                _buildField(Icons.location_on_outlined, "Alamat", _addressController, editable: _isEditing),
                _buildInfoCard(Icons.calendar_today_outlined, "Tanggal Bergabung", _userData?['join_date'] ?? '-'),
                _buildInfoCard(Icons.shield_outlined, "Role", role),

                // Buttons saat editing
                if (_isEditing)
                  Padding(
                    padding: EdgeInsets.symmetric(vertical: 20),
                    child: Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: _toggleEdit,
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(color: Colors.grey[400]!),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              padding: EdgeInsets.symmetric(vertical: 15),
                            ),
                            child: Text("Batal", style: TextStyle(color: Colors.grey[600])),
                          ),
                        ),
                        SizedBox(width: 15),
                        Expanded(
                          flex: 2,
                          child: ElevatedButton(
                            onPressed: _isSaving ? null : _saveProfile,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: maroon,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              padding: EdgeInsets.symmetric(vertical: 15),
                            ),
                            child: _isSaving
                                ? SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                : Text("Simpan Perubahan", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ),

                SizedBox(height: 30),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // EDITABLE FIELD
  Widget _buildField(IconData icon, String label, TextEditingController controller,
      {bool editable = false, bool isSensitive = false}) {
    return Container(
      margin: EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.symmetric(horizontal: 18, vertical: editable ? 5 : 16),
      decoration: BoxDecoration(
        color: editable ? Color(0xFFFFF0F0) : Colors.white,
        borderRadius: BorderRadius.circular(15),
        border: editable ? Border.all(color: maroon.withOpacity(0.3)) : null,
        boxShadow: editable ? null : [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 8, offset: Offset(0, 2))],
      ),
      child: Row(
        children: [
          Icon(icon, color: maroon, size: 22),
          SizedBox(width: 15),
          Expanded(
            child: editable
                ? TextField(
                    controller: controller,
                    style: TextStyle(fontSize: 14, color: Colors.black),
                    decoration: InputDecoration(
                      labelText: label,
                      labelStyle: TextStyle(fontSize: 12, color: Colors.grey[500]),
                      border: InputBorder.none,
                      suffixIcon: isSensitive
                          ? Tooltip(
                              message: 'Perubahan memerlukan persetujuan HRD',
                              child: Icon(Icons.lock_outline, size: 16, color: Colors.orange),
                            )
                          : null,
                    ),
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(label, style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                      SizedBox(height: 2),
                      Text(
                        controller.text.isNotEmpty ? controller.text : '-',
                        style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  // READ-ONLY INFO CARD (untuk role & tanggal gabung)
  Widget _buildInfoCard(IconData icon, String label, String value) {
    return Container(
      margin: EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 8, offset: Offset(0, 2))],
      ),
      child: Row(
        children: [
          Icon(icon, color: maroon, size: 22),
          SizedBox(width: 15),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: TextStyle(fontSize: 11, color: Colors.grey[500])),
              SizedBox(height: 2),
              Text(value, style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w500)),
            ],
          ),
        ],
      ),
    );
  }
}
