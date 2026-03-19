import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../api/api_service.dart';

class HolidayScreen extends StatefulWidget {
  @override
  _HolidayScreenState createState() => _HolidayScreenState();
}

class _HolidayScreenState extends State<HolidayScreen> {
  final Color primaryColor = const Color(0xFF800000);
  List<dynamic> _holidays = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchHolidays();
  }

  Future<void> _fetchHolidays() async {
    setState(() => _isLoading = true);
    final data = await ApiService.getHolidays();
    if (mounted) {
      setState(() {
        _holidays = data ?? [];
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFBFBFB),
      appBar: AppBar(
        title: Text("Hari Libur", style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchHolidays),
        ],
      ),
      body: _isLoading 
          ? const Center(child: CircularProgressIndicator()) 
          : RefreshIndicator(
              onRefresh: _fetchHolidays,
              child: _holidays.isEmpty 
                  ? _buildEmptyState()
                  : ListView.builder(
                      padding: const EdgeInsets.all(20),
                      itemCount: _holidays.length,
                      itemBuilder: (context, index) => _buildHolidayCard(_holidays[index]),
                    ),
            ),
    );
  }

  Widget _buildEmptyState() {
    return Center(child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.event_busy_outlined, size: 80, color: Colors.grey[300]),
        const SizedBox(height: 15),
        const Text("Belum ada data hari libur"),
      ],
    ));
  }

  Widget _buildHolidayCard(dynamic holiday) {
    final date = DateTime.parse(holiday['date']);
    final isPast = date.isBefore(DateTime.now().subtract(const Duration(days: 1)));

    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 5))],
        border: Border.all(color: isPast ? Colors.grey[100]! : primaryColor.withOpacity(0.1), width: 1),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
            decoration: BoxDecoration(
              color: isPast ? Colors.grey[100] : primaryColor.withOpacity(0.05),
              borderRadius: BorderRadius.circular(15),
            ),
            child: Column(
              children: [
                Text(DateFormat('dd').format(date), style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: isPast ? Colors.grey : primaryColor)),
                Text(DateFormat('MMM').format(date).toUpperCase(), style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey[600])),
              ],
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(holiday['name'], style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: isPast ? Colors.grey[600] : Colors.black87)),
                const SizedBox(height: 5),
                Text(DateFormat('EEEE, yyyy').format(date), style: TextStyle(color: Colors.grey[500], fontSize: 13)),
              ],
            ),
          ),
          if (!isPast) Icon(Icons.celebration, color: primaryColor.withOpacity(0.3), size: 24),
        ],
      ),
    );
  }
}
