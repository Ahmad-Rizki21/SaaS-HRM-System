import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../api/api_service.dart';
import '../widgets/skeleton_loading.dart';

class LeaderboardScreen extends StatefulWidget {
  @override
  _LeaderboardScreenState createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Map<String, dynamic>? _leaderboardData;
  bool _isLoading = true;
  final Color primaryColor = Color(0xFF800000);

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    final data = await ApiService.getLeaderboard();
    if (mounted) {
      setState(() {
        _leaderboardData = data;
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFFF8F9FA),
      appBar: AppBar(
        title: Text(
          "Papan Peringkat", 
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)
        ),
        backgroundColor: primaryColor,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold),
          tabs: [
            Tab(text: "Kedisiplinan"),
            Tab(text: "Kinerja Lembur"),
          ],
        ),
      ),
      body: _isLoading
          ? const KpiSkeleton()
          : TabBarView(
              controller: _tabController,
              children: [
                _buildLeaderboardTab(
                  _leaderboardData?['top_attendance'] is List 
                      ? _leaderboardData!['top_attendance'] 
                      : [], 
                  "Kehadiran Tepat Waktu"
                ),
                _buildLeaderboardTab(
                  _leaderboardData?['top_overtime'] is List 
                      ? _leaderboardData!['top_overtime'] 
                      : [], 
                  "Total Jam Lembur"
                ),
              ],
            ),
    );
  }

  Widget _buildLeaderboardTab(List<dynamic> users, String scoreLabel) {
    if (users.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.emoji_events_outlined, size: 80, color: Colors.grey[300]),
            SizedBox(height: 16),
            Text("Belum ada data tersedia", style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }

    final top3 = users.take(3).toList();
    final theRest = users.skip(3).toList();

    return RefreshIndicator(
      onRefresh: _fetchData,
      child: SingleChildScrollView(
        physics: AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.symmetric(vertical: 20),
        child: Column(
          children: [
            Text(
              "Periode: ${_leaderboardData?['month'] ?? '-'}",
              style: GoogleFonts.outfit(color: Colors.grey[600], fontSize: 13),
            ),
            SizedBox(height: 20),
            _buildPodiumSection(top3, scoreLabel),
            SizedBox(height: 30),
            if (theRest.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Peringkat Lainnya",
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    SizedBox(height: 15),
                    ...theRest.asMap().entries.map((entry) {
                      return _buildListRank(entry.value, entry.key + 4, scoreLabel);
                    }).toList(),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildPodiumSection(List<dynamic> top3, String scoreLabel) {
    List<dynamic> podiumOrder = [];
    if (top3.length > 1) podiumOrder.add(top3[1]); // Rank 2
    if (top3.length > 0) podiumOrder.add(top3[0]); // Rank 1
    if (top3.length > 2) podiumOrder.add(top3[2]); // Rank 3

    return Container(
      width: double.infinity,
      height: 240,
      padding: EdgeInsets.symmetric(horizontal: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: podiumOrder.map((user) {
          int rank = 1;
          if (top3.indexOf(user) == 1) rank = 2;
          if (top3.indexOf(user) == 2) rank = 3;
          if (top3.indexOf(user) == 0) rank = 1;

          return _buildPodiumItem(user, rank, scoreLabel);
        }).toList(),
      ),
    );
  }

  Widget _buildPodiumItem(dynamic user, int rank, String scoreLabel) {
    double size = rank == 1 ? 100 : 80;
    Color color = rank == 1 ? Colors.amber : (rank == 2 ? Color(0xFFC0C0C0) : Color(0xFFCD7F32));
    
    return Expanded(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          Stack(
            alignment: Alignment.topRight,
            children: [
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: color, width: 3),
                  boxShadow: [
                    BoxShadow(color: color.withOpacity(0.3), blurRadius: 10, offset: Offset(0, 5))
                  ]
                ),
                child: CircleAvatar(
                  radius: size / 2,
                  backgroundColor: Colors.white,
                  backgroundImage: (user['photo_url'] != null && user['photo_url'].toString().isNotEmpty)
                      ? NetworkImage(user['photo_url'])
                      : null,
                  child: (user['photo_url'] == null || user['photo_url'].toString().isEmpty)
                      ? Icon(Icons.person, size: size / 2, color: Colors.grey)
                      : null,
                ),
              ),
              Container(
                padding: EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: color, 
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2)
                ),
                child: Text(
                  "#$rank", 
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: rank == 1 ? Colors.black87 : Colors.white)
                ),
              )
            ],
          ),
          SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4.0),
            child: Text(
              user['name'].toString().split(' ')[0], 
              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14),
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),
          ),
          Text(
            "${user['score']}", 
            style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: primaryColor, fontSize: 16)
          ),
          Text(
            scoreLabel.contains(' ') 
                ? scoreLabel.split(' ').sublist(scoreLabel.split(' ').length - 2).join(' ') 
                : scoreLabel, 
            style: TextStyle(fontSize: 10, color: Colors.grey[600])
          ),
          SizedBox(height: rank == 1 ? 30 : 10),
        ],
      ),
    );
  }

  Widget _buildListRank(dynamic user, int rank, String scoreLabel) {
    return Container(
      margin: EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: Offset(0, 4))]
      ),
      child: Row(
        children: [
          Container(
            width: 30,
            child: Text(
              "$rank", 
              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.grey[400], fontSize: 16)
            ),
          ),
          CircleAvatar(
            radius: 20,
            backgroundColor: Colors.grey[100],
            backgroundImage: (user['photo_url'] != null && user['photo_url'].toString().isNotEmpty)
                ? NetworkImage(user['photo_url'])
                : null,
            child: (user['photo_url'] == null || user['photo_url'].toString().isEmpty)
                ? Icon(Icons.person, size: 20, color: Colors.grey)
                : null,
          ),
          SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(user['name'], style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 14)),
                Text("Karyawan", style: TextStyle(fontSize: 11, color: Colors.grey[500])),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text("${user['score']}", style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: primaryColor, fontSize: 16)),
              Text(
                scoreLabel.contains(' ') 
                    ? scoreLabel.split(' ').sublist(scoreLabel.split(' ').length - 2).join(' ') 
                    : scoreLabel, 
                style: TextStyle(fontSize: 10, color: Colors.grey[600])
              ),
            ],
          ),
        ],
      ),
    );
  }
}
