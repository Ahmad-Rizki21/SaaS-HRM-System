import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../api/api_service.dart';
import '../widgets/skeleton_loading.dart';

class ManagerScreen extends StatefulWidget {
  @override
  _ManagerScreenState createState() => _ManagerScreenState();
}

class _ManagerScreenState extends State<ManagerScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Map<String, dynamic>? _pendingCounts;
  List<dynamic> _teamAttendance = [];
  bool _isLoading = true;

  final Color primaryColor = Color(0xFF800000);
  final Color secondaryColor = Color(0xFFAD2831);

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final counts = await ApiService.getManagerPendingCount();
    final team = await ApiService.getTeamAttendance();
    setState(() {
      _pendingCounts = counts;
      _teamAttendance = team ?? [];
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
      backgroundColor: Color(0xFFFBFBFB),
      appBar: AppBar(
        title: Text("Portal Manager", style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: primaryColor,
        elevation: 0,
        actions: [
          IconButton(icon: Icon(Icons.refresh, color: Colors.white), onPressed: _loadData),
        ],
      ),
      body: _isLoading 
        ? const CardAndListSkeleton()
        : Column(
            children: [
              _buildSummaryHeader(),
              Container(
                color: primaryColor,
                child: TabBar(
                  controller: _tabController,
                  indicatorColor: Colors.white,
                  indicatorWeight: 4,
                  labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
                  tabs: [
                    Tab(text: "Persetujuan"),
                    Tab(text: "Tim Saya"),
                  ],
                ),
              ),
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildApprovalTab(),
                    _buildTeamTab(),
                  ],
                ),
              ),
            ],
          ),
    );
  }

  Widget _buildSummaryHeader() {
    return Container(
      padding: EdgeInsets.fromLTRB(20, 10, 20, 25),
      decoration: BoxDecoration(
        color: primaryColor,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(30)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildSummaryCard("Cuti", _pendingCounts?['leave'] ?? 0, Icons.calendar_month),
          _buildSummaryCard("Lembur", _pendingCounts?['overtime'] ?? 0, Icons.more_time),
          _buildSummaryCard("Klaim", _pendingCounts?['reimbursement'] ?? 0, Icons.payments),
          _buildSummaryCard("Fleet", _pendingCounts?['vehicle_log'] ?? 0, Icons.directions_car),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(String label, int count, IconData icon) {
    return Column(
      children: [
        Container(
          padding: EdgeInsets.all(12),
          decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), shape: BoxShape.circle),
          child: Icon(icon, color: Colors.white, size: 28),
        ),
        SizedBox(height: 10),
        Text(count.toString(), style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
        Text(label, style: TextStyle(color: Colors.white70, fontSize: 12)),
      ],
    );
  }

  Widget _buildApprovalTab() {
    return ListView(
      padding: EdgeInsets.all(20),
      children: [
        _buildApprovalSection("Pengajuan Cuti", "leave", Icons.calendar_today, Colors.orange),
        _buildApprovalSection("Pengajuan Lembur", "overtime", Icons.access_time, Colors.red),
        _buildApprovalSection("Pengajuan Klaim", "reimbursement", Icons.monetization_on, Colors.blue),
        _buildApprovalSection("Log Kendaraan", "vehicle_log", Icons.directions_car, Colors.indigo),
      ],
    );
  }

  Widget _buildApprovalSection(String title, String type, IconData icon, Color color) {
    int count = _pendingCounts?[type] ?? 0;
    return Card(
      margin: EdgeInsets.only(bottom: 15),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      child: ListTile(
        leading: CircleAvatar(backgroundColor: color.withOpacity(0.1), child: Icon(icon, color: color)),
        title: Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        subtitle: Text("$count pengajuan menunggu"),
        trailing: Icon(Icons.arrow_forward_ios, size: 16),
        onTap: () => _showApprovalList(title, type),
      ),
    );
  }

  void _showApprovalList(String title, String type) async {
    final List<dynamic>? items = await ApiService.getManagerPendingRequests(type);
    if (items == null) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.8,
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(25))),
        child: Column(
          children: [
            Container(margin: EdgeInsets.symmetric(vertical: 10), height: 5, width: 40, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(5))),
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Text(title, style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold)),
            ),
            Expanded(
              child: items.isEmpty
                  ? Center(child: Text("Tidak ada pengajuan pending"))
                  : ListView.builder(
                      itemCount: items.length,
                      itemBuilder: (context, index) => _buildApprovalListItem(items[index], type),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildApprovalListItem(dynamic item, String type) {
    String name = item['user']?['name'] ?? "User";
    String date = "";
    String info = "";
    
    if (type == 'leave') {
      date = "${item['start_date']} s/d ${item['end_date']}";
      info = "Alasan: ${item['reason']}";
    } else if (type == 'overtime') {
      date = "${item['date']}";
      info = "Pukul: ${item['start_time']} - ${item['end_time']}";
    } else if (type == 'reimbursement') {
      date = "Rp " + NumberFormat("#,###").format(double.tryParse(item['amount'].toString()) ?? 0);
      info = "${item['title']}";
    } else if (type == 'vehicle_log') {
      date = "${item['vehicle_name']} (${item['plate_number']})";
      info = "Tujuan: ${item['destination']}\nJarak: ${item['distance'] ?? '-'} KM";
    }

    return Card(
      margin: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(child: Text(name[0])),
                SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(name, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    Text(date, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                  ]),
                ),
              ],
            ),
            SizedBox(height: 12),
            Text(info, style: TextStyle(fontSize: 14)),
            if (item['description'] != null) Text(item['description'], style: TextStyle(color: Colors.grey[600], fontSize: 12)),
            SizedBox(height: 15),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _handleApproval(type, item['id'], 'rejected'),
                    child: Text("Reject"),
                    style: OutlinedButton.styleFrom(foregroundColor: Colors.red, side: BorderSide(color: Colors.red)),
                  ),
                ),
                SizedBox(width: 15),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => _handleApproval(type, item['id'], 'approved'),
                    child: Text("Approve"),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                  ),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }

  void _handleApproval(String type, int id, String status) async {
    final res = await ApiService.updateManagerRequestStatus(type, id, status);
    if (res['status'] == 'success') {
      Navigator.pop(context);
      _loadData();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Berhasil $status"), backgroundColor: status == 'approved' ? Colors.green : Colors.red));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'] ?? "Gagal memproses")));
    }
  }

  Widget _buildTeamTab() {
    if (_teamAttendance.isEmpty) return Center(child: Text("Belum ada anggota tim terdaftar"));

    return ListView.builder(
      padding: EdgeInsets.all(20),
      itemCount: _teamAttendance.length,
      itemBuilder: (context, index) {
        final sub = _teamAttendance[index];
        Color statusColor = Colors.grey;
        if (sub['status'] == 'Hadir') statusColor = Colors.green;
        if (sub['status'] == 'Selesai') statusColor = Colors.blue;

        return Card(
          margin: EdgeInsets.only(bottom: 15),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
          child: ListTile(
            contentPadding: EdgeInsets.all(10),
            leading: CircleAvatar(
              radius: 14,
              backgroundColor: primaryColor.withOpacity(0.1),
              backgroundImage: (sub['photo_url'] != null && sub['photo_url'].toString().isNotEmpty) 
                  ? NetworkImage(sub['photo_url']) 
                  : null,
              child: (sub['photo_url'] == null || sub['photo_url'].toString().isEmpty) 
                  ? Icon(Icons.person, size: 16, color: primaryColor) 
                  : null,
            ),
            title: Text(sub['name'], style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(sub['role'] ?? "-"),
                SizedBox(height: 5),
                Row(
                  children: [
                    Icon(Icons.login, size: 14, color: Colors.green),
                    SizedBox(width: 5),
                    Text(sub['check_in'] ?? "--:--", style: TextStyle(fontSize: 12)),
                    SizedBox(width: 15),
                    Icon(Icons.logout, size: 14, color: Colors.red),
                    SizedBox(width: 5),
                    Text(sub['check_out'] ?? "--:--", style: TextStyle(fontSize: 12)),
                  ],
                ),
              ],
            ),
            trailing: Container(
              padding: EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
              child: Text(sub['status'], style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 12)),
            ),
          ),
        );
      },
    );
  }
}
