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


class DashboardScreen extends StatefulWidget {
  @override
  _DashboardScreenState createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;
  String _userName = "Memuat...";
  String _userRole = "";
  String? _profilePhotoUrl;
  Map<String, dynamic>? _attendanceData;

  final Color primaryColor = Color(0xFF800000);
  final Color secondaryColor = Color(0xFFB00000);

  @override
  void initState() {
    super.initState();
    _fetchProfile();
    _fetchAttendance();
    NotificationService().startPolling(); // Mulai cek notifikasi
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

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark.copyWith(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: Color(0xFFFBFBFB),
        body: SafeArea(
          child: _getBody(),
        ),
        floatingActionButton: _selectedIndex == 0
            ? FloatingActionButton.extended(
                onPressed: _onAbsenTapped,
                backgroundColor: primaryColor,
                elevation: 10,
                label: Text(
                  _attendanceData?['check_in'] == null ? "ABSEN SEKARANG" : (_attendanceData?['check_out'] == null ? "ABSEN PULANG" : "SUDAH ABSEN"),
                  style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 1.1),
                ),
                icon: Icon(Icons.camera_front, color: Colors.white),
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
            BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: "Beranda"),
            BottomNavigationBarItem(icon: Icon(Icons.list_alt_outlined), activeIcon: Icon(Icons.list_alt), label: "Riwayat"),
            BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: "Profil"),
            BottomNavigationBarItem(icon: Icon(Icons.settings_outlined), activeIcon: Icon(Icons.settings), label: "Setting"),
          ],
        ),
      ),
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

          // MENU UTAMA
          Padding(
            padding: const EdgeInsets.all(25.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Menu Utama", style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                SizedBox(height: 15),
                GridView.builder(
                  shrinkWrap: true,
                  physics: NeverScrollableScrollPhysics(),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 4,
                    mainAxisSpacing: 10,
                    crossAxisSpacing: 10,
                    mainAxisExtent: 90,
                  ),
                  itemCount: 8,
                  itemBuilder: (context, index) {
                    final menuItems = [
                      {
                        'icon': Icons.camera_front,
                        'label': 'Absen',
                        'color': primaryColor,
                        'onTap': () => _onAbsenTapped(),
                      },
                      {
                        'icon': Icons.calendar_month,
                        'label': 'Cuti',
                        'color': Colors.orange[800],
                        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => LeaveScreen())),
                      },
                      {
                        'icon': Icons.receipt_long,
                        'label': 'Gaji',
                        'color': Colors.green[800],
                        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => SalaryScreen())),
                      },
                      {
                        'icon': Icons.history_edu,
                        'label': 'Riwayat',
                        'color': Colors.purple[800],
                        'onTap': () => _onItemTapped(1),
                      },
                      {
                        'icon': Icons.more_time,
                        'label': 'Lembur',
                        'color': Colors.red[800],
                        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => OvertimeScreen())),
                      },
                      {
                        'icon': Icons.task,
                        'label': 'Tugas',
                        'color': Colors.teal[800],
                        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => TaskScreen())),
                      },
                      {
                        'icon': Icons.person,
                        'label': 'Profil',
                        'color': Colors.indigo[800],
                        'onTap': () => _onItemTapped(2),
                      },
                      {
                        'icon': Icons.logout,
                        'label': 'Keluar',
                        'color': Colors.grey[700],
                        'onTap': _handleLogout,
                      },
                    ];

                    var item = menuItems[index];
                    return _buildNavIcon(item['icon'] as IconData, item['label'] as String, item['color'] as Color, onTap: item['onTap'] as Function?);
                  },
                ),
              ],
            ),
          ),

          // BANNER INFO
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 25.0),
            child: Container(
              padding: EdgeInsets.all(15),
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
