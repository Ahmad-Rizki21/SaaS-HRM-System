import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../api/api_service.dart';

class SalaryScreen extends StatefulWidget {
  @override
  _SalaryScreenState createState() => _SalaryScreenState();
}

class _SalaryScreenState extends State<SalaryScreen> {
  final Color primaryColor = const Color(0xFF800000);
  List<dynamic> _salaries = [];
  bool _isLoading = true;
  final currencyFormatter = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

  @override
  void initState() {
    super.initState();
    _fetchSalaries();
  }

  Future<void> _fetchSalaries() async {
    setState(() => _isLoading = true);
    final data = await ApiService.getSalaries();
    if (mounted) {
      setState(() {
        _salaries = data ?? [];
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFBFBFB),
      appBar: AppBar(
        title: Text("Slip Gaji", style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: _isLoading 
          ? const Center(child: CircularProgressIndicator()) 
          : RefreshIndicator(
              onRefresh: _fetchSalaries,
              child: _salaries.isEmpty 
                  ? Center(child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.receipt_long_outlined, size: 80, color: Colors.grey[300]),
                        const SizedBox(height: 15),
                        const Text("Belum ada slip gaji tersedia"),
                      ],
                    ))
                  : ListView.builder(
                      padding: const EdgeInsets.all(20),
                      itemCount: _salaries.length,
                      itemBuilder: (context, index) {
                        final salary = _salaries[index];
                        final netSalary = double.parse(salary['net_salary'].toString());
                        
                        return Container(
                          margin: const EdgeInsets.only(bottom: 20),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 5))],
                          ),
                          child: Column(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(color: primaryColor.withOpacity(0.05), borderRadius: const BorderRadius.vertical(top: Radius.circular(20))),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text("${salary['month']} ${salary['year']}", style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                                        const Text("Gaji Bersih", style: TextStyle(fontSize: 12, color: Colors.grey)),
                                      ],
                                    ),
                                    Text(currencyFormatter.format(netSalary), style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: primaryColor)),
                                  ],
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.all(20),
                                child: Column(
                                  children: [
                                    _buildDetailRow("Gaji Pokok", double.parse(salary['basic_salary'].toString())),
                                    _buildDetailRow("Tunjangan", double.parse(salary['allowance'].toString())),
                                    _buildDetailRow("Potongan", -double.parse(salary['deduction'].toString()), isNegative: true),
                                    const Divider(height: 30),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        const Text("Total Diterima", style: TextStyle(fontWeight: FontWeight.bold)),
                                        Text(currencyFormatter.format(netSalary), style: const TextStyle(fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                decoration: BoxDecoration(color: Colors.grey[50], borderRadius: const BorderRadius.vertical(bottom: Radius.circular(20))),
                                child: Center(child: Text("LIHAT DETAIL SLIP", style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold, fontSize: 12))),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
    );
  }

  Widget _buildDetailRow(String label, double amount, {bool isNegative = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey)),
          Text(currencyFormatter.format(amount), style: TextStyle(color: isNegative ? Colors.red : Colors.black, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
