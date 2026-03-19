import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../api/api_service.dart';
import 'profile_screen.dart';
import 'riwayat_screen.dart';
import '../services/notification_service.dart';

import 'package:intl/intl.dart';
import 'attendance_screen.dart';
import 'settings_tab.dart';
import 'leave_screen.dart';
import 'overtime_screen.dart';
import 'salary_screen.dart';
import 'task_screen.dart';
import 'reimbursement_screen.dart';
import 'holiday_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';


class DashboardScreen extends StatefulWidget {
  @override
  _DashboardScreenState createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;
  String _userName = "Memuat...";
  String _userRole = "";
  String? _profilePhotoUrl;
  
  // Custom Menu
  List<String> _pinnedMenuIds = ['absen', 'cuti', 'klaim', 'lembur'];
  bool _isMenuExpanded = false;
  Map<String, dynamic>? _attendanceData;

  final Color primaryColor = Color(0xFF800000);
  final Color secondaryColor = Color(0xFFB00000);

  @override
  void initState() {
    super.initState();
    _fetchProfile();
    _fetchAttendance();
    _loadPinnedMenus();
    NotificationService().startPolling(); // Mulai cek notifikasi
  }

  Future<void> _loadPinnedMenus() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getStringList('pinned_menus');
    if (saved != null && saved.isNotEmpty) {
      if (mounted) {
        setState(() {
          _pinnedMenuIds = List.from(saved);
        });
      }
    }
  }

  Future<void> _fetchAttendance() async {
    final data = await ApiService.getTodayAttendance();
    if (mounted) {
      setState(() {
        _attendanceData = data;
      });
    }
  }

  String _formatTime(String? dateTimeStr) {
    if (dateTimeStr == null) return "--:--";
    try {
      final DateTime dt = DateTime.parse(dateTimeStr).toLocal();
      return DateFormat('HH:mm').format(dt);
    } catch (e) {
      return "--:--";
    }
  }

  @override
  void dispose() {
    NotificationService().stopPolling(); // Stop saat keluar
    super.dispose();
  }

  void _fetchProfile() async {
    final userData = await ApiService.getProfile();
    if (userData != null && mounted) {
      String? rawUrl = userData['profile_photo_url'];
      if (rawUrl != null) {
        if (!rawUrl.startsWith('http')) {
          rawUrl = 'http://192.168.1.9:8000/storage/$rawUrl';
        } else {
          rawUrl = rawUrl.replaceAll('localhost', '192.168.1.9').replaceAll('127.0.0.1', '192.168.1.9');
        }
      }
      setState(() {
        _userName = userData['name'] ?? "Karyawan";
        if (userData['role'] != null) {
          _userRole = userData['role']['name'] ?? "";
        }
        _profilePhotoUrl = rawUrl;
      });
    }
  }

  Future<void> _onAbsenTapped() async {
    final dynamic res = await Navigator.push(
      context, 
      MaterialPageRoute(builder: (c) => AttendanceScreen(isCheckIn: _attendanceData?['check_in'] == null))
    );
    if (res != null) {
      setState(() {
        _attendanceData = res;
      });
      _fetchAttendance(); // Sync final state
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Absensi Berhasil Tercatat!"), backgroundColor: Colors.green)
      );
    }
  }

  void _onItemTapped(int index) {

    setState(() => _selectedIndex = index);
  }

  void _handleLogout() async {
    NotificationService().stopPolling(); 
    await ApiService.logout();
    Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false);
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour >= 4 && hour < 11) return "Selamat Pagi,";
    if (hour >= 11 && hour < 15) return "Selamat Siang,";
    if (hour >= 15 && hour < 18) return "Selamat Sore,";
    return "Selamat Malam,";
  }

  DateTime? _lastPressedAt;

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark.copyWith(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
      ),
      child: PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, result) async {
          if (didPop) return;
          
          if (_selectedIndex != 0) {
            setState(() => _selectedIndex = 0);
            return;
          }

          final now = DateTime.now();
          if (_lastPressedAt == null || now.difference(_lastPressedAt!) > const Duration(seconds: 2)) {
            _lastPressedAt = now;
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text("Tekan sekali lagi untuk keluar"), duration: Duration(seconds: 2))
            );
            return;
          }
          
          Navigator.of(context).pop(); // Actually pop/exit
        },
        child: Scaffold(
          backgroundColor: const Color(0xFFFBFBFB),
          body: SafeArea(
            child: _getBody(),
          ),
        floatingActionButton: (_selectedIndex == 0 && _attendanceData?['check_out'] == null)
            ? FloatingActionButton.extended(
                onPressed: _onAbsenTapped,
                backgroundColor: primaryColor,
                elevation: 10,
                label: Text(
                  _attendanceData?['check_in'] == null ? "ABSEN SEKARANG" : "ABSEN PULANG",
                  style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 1.1),
                ),
                icon: const Icon(Icons.camera_front, color: Colors.white),
              )
            : null,
        floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: _onItemTapped,
          selectedItemColor: primaryColor,
          unselectedItemColor: Colors.grey,
          showUnselectedLabels: true,
          type: BottomNavigationBarType.fixed,
          items: [
            BottomNavigationBarItem(icon: const Icon(Icons.home_outlined), activeIcon: const Icon(Icons.home), label: "Beranda"),
            BottomNavigationBarItem(icon: const Icon(Icons.list_alt_outlined), activeIcon: const Icon(Icons.list_alt), label: "Riwayat"),
            BottomNavigationBarItem(icon: const Icon(Icons.person_outline), activeIcon: const Icon(Icons.person), label: "Profil"),
            BottomNavigationBarItem(icon: const Icon(Icons.settings_outlined), activeIcon: const Icon(Icons.settings), label: "Setting"),
          ],
        ),
      ),
    ),
  );
}

  Map<String, Map<String, dynamic>> _getMenuItems() {
    return {
      'absen': {
        'icon': Icons.camera_front,
        'label': 'Absen',
        'color': primaryColor,
        'onTap': () => _onAbsenTapped(),
      },
      'cuti': {
        'icon': Icons.calendar_month,
        'label': 'Cuti',
        'color': Colors.orange[800],
        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => LeaveScreen())),
      },
      'klaim': {
        'icon': Icons.payments_outlined,
        'label': 'Klaim',
        'color': Colors.blue[800],
        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => ReimbursementScreen())),
      },
      'lembur': {
        'icon': Icons.more_time,
        'label': 'Lembur',
        'color': Colors.red[800],
        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => OvertimeScreen())),
      },
      'profile': {
        'icon': Icons.person,
        'label': 'Profil',
        'color': Colors.indigo[800],
        'onTap': () => _onItemTapped(2),
      },
      'gaji': {
        'icon': Icons.receipt_long,
        'label': 'Gaji',
        'color': Colors.green[800],
        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => SalaryScreen())),
      },
      'tugas': {
        'icon': Icons.task,
        'label': 'Tugas',
        'color': Colors.teal[800],
        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => TaskScreen())),
      },
      'libur': {
        'icon': Icons.event_available,
        'label': 'Libur',
        'color': Colors.deepOrange[800],
        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => HolidayScreen())),
      },
      'riwayat': {
        'icon': Icons.history_edu,
        'label': 'Riwayat',
        'color': Colors.purple[800],
        'onTap': () => _onItemTapped(1),
      },
      'setting': {
        'icon': Icons.settings,
        'label': 'Setting',
        'color': Colors.blueGrey,
        'onTap': () => _onItemTapped(3),
      },
    };
  }

  void _showAturModal() {
    final allItems = _getMenuItems();
    // Gunakan list lokal agar perubahan hanya tersimpan saat klik "Simpan"
    List<String> tempPinned = List.from(_pinnedMenuIds);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(25))),
              padding: const EdgeInsets.all(25),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Atur Akses Cepat", style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 10),
                  Text("Pilih maksimal 4 menu favorit Anda.", style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                  const SizedBox(height: 25),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: allItems.keys.map((id) {
                      final isSelected = tempPinned.contains(id);
                      final item = allItems[id]!;
                      return FilterChip(
                        selected: isSelected,
                        label: Text(item['label']),
                        selectedColor: primaryColor.withOpacity(0.2),
                        checkmarkColor: primaryColor,
                        onSelected: (selected) {
                          setModalState(() {
                            if (selected) {
                              if (tempPinned.length < 4) {
                                tempPinned.add(id);
                              } else {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text("Maksimal 4 menu"), behavior: SnackBarBehavior.floating)
                                );
                              }
                            } else {
                              tempPinned.remove(id);
                            }
                          });
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 40),
                  SizedBox(
                    width: double.infinity,
                    height: 55,
                    child: ElevatedButton(
                      onPressed: () async {
                        if (tempPinned.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Pilih minimal 1 menu")));
                          return;
                        }
                        
                        // Update Main State
                        setState(() {
                          _pinnedMenuIds = List.from(tempPinned);
                        });

                        // Persist to SharedPreferences
                        final prefs = await SharedPreferences.getInstance();
                        await prefs.setStringList('pinned_menus', _pinnedMenuIds);
                        
                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryColor,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                      ),
                      child: const Text("Simpan Perubahan", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            );
          }
        );
      },
    );
  }

  // ============================================
  // BODY SWITCHER
  // ============================================
  Widget _getBody() {
    switch (_selectedIndex) {
      case 0:
        return _buildHomeContent();
      case 1:
        return RiwayatScreen();
      case 2:
        return ProfileScreen();
      case 3:
        return SettingsTab(onLogout: _handleLogout);
      default:
        return _buildHomeContent();
    }
  }

  // ============================================
  // TAB 0: HOME CONTENT
  // ============================================
  Widget _buildHomeContent() {
    final allItems = _getMenuItems();
    final pinnedItems = _pinnedMenuIds.map((id) => allItems[id]!).toList();
    final otherItems = allItems.keys
        .where((id) => !_pinnedMenuIds.contains(id))
        .map((id) => allItems[id]!)
        .toList();
    
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // HEADER
          Padding(
            padding: const EdgeInsets.all(25.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 25,
                      backgroundColor: primaryColor,
                      backgroundImage: _profilePhotoUrl != null ? NetworkImage(_profilePhotoUrl!) : null,
                      child: _profilePhotoUrl == null
                          ? Text(
                              _userName.isNotEmpty ? _userName[0].toUpperCase() : "U",
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            )
                          : null,
                    ),
                    SizedBox(width: 15),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_getGreeting(), style: GoogleFonts.outfit(fontSize: 12, color: Colors.grey[600])),
                        Text(_userName, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black)),
                        if (_userRole.isNotEmpty)
                          Text(_userRole, style: GoogleFonts.outfit(fontSize: 12, color: Colors.grey[500])),
                      ],
                    ),
                  ],
                ),
                IconButton(
                  icon: Icon(Icons.notifications_none_rounded, color: primaryColor, size: 28),
                  onPressed: () {
                    Navigator.pushNamed(context, '/notifications');
                  },
                ),
              ],
            ),
          ),

          // KARTU ABSENSI
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 25.0),
            child: Container(
              width: double.infinity,
              padding: EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [primaryColor, secondaryColor], begin: Alignment.topLeft, end: Alignment.bottomRight),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [BoxShadow(color: primaryColor.withOpacity(0.3), blurRadius: 15, offset: Offset(0, 8))],
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Absensi Hari Ini", style: TextStyle(color: Colors.white70, fontSize: 13)),
                          SizedBox(height: 5),
                          Text(
                            _attendanceData?['check_in'] != null 
                              ? (_attendanceData?['check_out'] != null ? "Selesai Kerja" : "Sudah Check-In")
                              : "Klik Untuk Absen",
                            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      Icon(Icons.face_retouching_natural, color: Colors.white, size: 40),
                    ],
                  ),
                  SizedBox(height: 25),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildAttendanceDetail("Masuk", _formatTime(_attendanceData?['check_in'])),
                      Container(height: 30, width: 1, color: Colors.white24),
                      _buildAttendanceDetail("Pulang", _formatTime(_attendanceData?['check_out'])),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // AKSES CEPAT (Quick Access Row)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 25.0, vertical: 25),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text("Akses Cepat", style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                    GestureDetector(
                      onTap: () => _showAturModal(),
                      child: Text("Atur", style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold, fontSize: 14)),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 5,
                  mainAxisSpacing: 0,
                  crossAxisSpacing: 8,
                  childAspectRatio: 0.7,
                  children: [
                    ...pinnedItems.map((item) => _buildQuickAction(item['icon'], item['label'], item['color'], item['onTap'])),
                    // Lainnya Button
                    GestureDetector(
                      onTap: () => setState(() => _isMenuExpanded = !_isMenuExpanded),
                      child: Column(
                        children: [
                           Container(
                             padding: const EdgeInsets.all(12),
                             decoration: BoxDecoration(
                               color: _isMenuExpanded ? primaryColor : Colors.white,
                               shape: BoxShape.circle,
                               boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 5)],
                             ),
                             child: Icon(_isMenuExpanded ? Icons.close : Icons.apps, color: _isMenuExpanded ? Colors.white : primaryColor, size: 28),
                           ),
                           const SizedBox(height: 8),
                           Text("Lainnya", style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // MENU LAINNYA (Expanded)
          if (_isMenuExpanded)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 25.0),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10)],
                ),
                child: GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 4,
                  mainAxisSpacing: 20,
                  crossAxisSpacing: 10,
                  childAspectRatio: 0.8,
                  children: otherItems.map((item) => _buildNavIcon(item['icon'], item['label'], item['color'], onTap: item['onTap'])).toList() 
                  ..add(_buildNavIcon(Icons.logout, "Keluar", Colors.grey[700]!, onTap: _handleLogout)),
                ),
              ),
            ),

          // BANNER INFO
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 25.0),
            child: Container(
              padding: const EdgeInsets.all(15),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(15),
                border: Border.all(color: Colors.grey.withOpacity(0.1)),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10)],
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: primaryColor),
                  SizedBox(width: 15),
                  Expanded(
                    child: Text("Informasi: Gaji bulan Maret sudah bisa dilihat di menu Slip Gaji.",
                        style: TextStyle(color: Colors.black87, fontSize: 12)),
                  ),
                ],
              ),
            ),
          ),
          SizedBox(height: 120),
        ],
      ),
    );
  }



  // ============================================
  // WIDGETS PENDUKUNG
  // ============================================
  Widget _buildAttendanceDetail(String label, String time) {
    return Column(
      children: [
        Text(label, style: TextStyle(color: Colors.white70, fontSize: 11)),
        SizedBox(height: 3),
        Text(time, style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildQuickAction(IconData icon, String label, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 5)],
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 8),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(label, style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black87)),
          ),
        ],
      ),
    );
  }

  Widget _buildNavIcon(IconData icon, String label, Color color, {Function? onTap}) {
    return GestureDetector(
      onTap: () {
        if (onTap != null) onTap();
      },
      child: Column(
        children: [
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(15),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 5, offset: Offset(0, 2))],
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          SizedBox(height: 6),
          Text(label, style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w500, color: Colors.black87)),
        ],
      ),
    );
  }
}
