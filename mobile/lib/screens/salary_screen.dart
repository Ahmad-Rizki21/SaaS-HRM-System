import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../api/api_service.dart';
import '../../widgets/skeleton_loading.dart';

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
      if (data == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Gagal mengambil data gaji. Periksa koneksi ke server.")),
        );
      }
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
          ? const SalarySkeleton() 
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
                                    
                                    // Total Work Hours info
                                    ..._buildWorkHoursInfo(salary),

                                    if (double.parse(salary['allowance'].toString()) > 0)
                                      _buildDetailRow("Tunjangan", double.parse(salary['allowance'].toString())),
                                    
                                    // Parse details for BPJS & Tax
                                    ..._buildExtraDetails(salary),

                                    const Divider(height: 30),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text("Total Diterima", style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
                                        Text(currencyFormatter.format(netSalary), style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18, color: primaryColor)),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                children: [
                                  GestureDetector(
                                    onTap: () => ApiService.previewSalarySlip(salary['id']),
                                    child: Container(
                                      width: double.infinity,
                                      padding: const EdgeInsets.symmetric(vertical: 12),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        border: Border.all(color: primaryColor, width: 1.5),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
                                      child: Center(
                                        child: Text("LIHAT DETAIL SLIP", style: GoogleFonts.outfit(color: primaryColor, fontWeight: FontWeight.bold, fontSize: 13)),
                                      ),
                                    ),
                                  ),
                                  GestureDetector(
                                    onTap: () => ApiService.downloadSalarySlip(salary['id']),
                                    child: Container(
                                      width: double.infinity,
                                      padding: const EdgeInsets.symmetric(vertical: 15),
                                      decoration: BoxDecoration(
                                        color: primaryColor.withOpacity(0.9), 
                                        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(20)),
                                      ),
                                      child: const Center(
                                        child: Row(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Icon(Icons.picture_as_pdf, color: Colors.white, size: 16),
                                            SizedBox(width: 8),
                                            Text("UNDUH SLIP PDF", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1.2)),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
    );
  }

  List<Widget> _buildWorkHoursInfo(dynamic salary) {
    List<Widget> widgets = [];
    try {
      if (salary['details'] != null) {
        final details = salary['details'] is String 
            ? jsonDecode(salary['details']) 
            : salary['details'];
        
        if (details['total_work_hours'] != null) {
          widgets.add(
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Text(
                "Total Jam Kerja: ${details['total_work_hours']} Jam", 
                style: GoogleFonts.outfit(fontSize: 10, color: Colors.blue[800], fontStyle: FontStyle.italic)
              ),
            )
          );
        }
        if (details['total_overtime_hours'] != null && details['total_overtime_hours'] > 0) {
          widgets.add(
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(
                "Total Lembur: ${details['total_overtime_hours']} Jam", 
                style: GoogleFonts.outfit(fontSize: 10, color: Colors.orange[800], fontStyle: FontStyle.italic)
              ),
            )
          );
        }
      }
    } catch (e) {}
    return widgets;
  }

  List<Widget> _buildExtraDetails(dynamic salary) {
    List<Widget> widgets = [];
    try {
      if (salary['details'] != null) {
        final details = salary['details'] is String 
            ? jsonDecode(salary['details']) 
            : salary['details'];
        
        // BPJS
        if (details['bpjs'] != null && details['bpjs']['total_deduction_emp'] != null) {
          final bpjsEmp = double.parse(details['bpjs']['total_deduction_emp'].toString());
          if (bpjsEmp > 0) {
            widgets.add(_buildDetailRow("Potongan BPJS", -bpjsEmp, isNegative: true));
          }
        }
        
        // Overtime (Lembur)
        if (details['overtime'] != null) {
          final lembur = double.parse(details['overtime'].toString());
          if (lembur > 0) {
            widgets.add(_buildDetailRow("Uang Lembur", lembur));
          }
        }

        // Tax (PPh 21)
        if (details['tax'] != null) {
          final tax = double.parse(details['tax'].toString());
          if (tax > 0) {
            widgets.add(_buildDetailRow("Pajak PPh 21", -tax, isNegative: true));
          }
        }

        // Late Deduction (Potongan Terlambat)
        if (salary['deduction_late'] != null) {
          final lateDed = double.parse(salary['deduction_late'].toString());
          if (lateDed > 0) {
            widgets.add(_buildDetailRow("Potongan Terlambat", -lateDed, isNegative: true));
          }
        }

        // Attendance/Other Deductions if any in net deduction but not BPJS/Tax/Late?
        final totalDeduction = double.parse(salary['deduction'].toString());
        final lateDeduction = double.tryParse(salary['deduction_late']?.toString() ?? '0') ?? 0;
        final parsedDeductions = (double.tryParse(details['tax']?.toString() ?? '0') ?? 0) + 
                                 (double.tryParse(details['bpjs']?['total_deduction_emp']?.toString() ?? '0') ?? 0) +
                                 lateDeduction;
        
        final diff = totalDeduction - parsedDeductions;
        if (diff > 1000) { // arbitrary threshold (e.g., > Rp 1.000)
             widgets.add(_buildDetailRow("Potongan Lainnya", -diff, isNegative: true));
        }
      } else {
        // Fallback to simple deduction
        widgets.add(_buildDetailRow("Potongan", -double.parse(salary['deduction'].toString()), isNegative: true));
      }
    } catch (e) {
      print("Error parsing extra details: $e");
    }
    return widgets;
  }

  Widget _buildDetailRow(String label, double amount, {bool isNegative = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.outfit(color: Colors.grey[600], fontSize: 13)),
          Text(
            isNegative ? "- ${currencyFormatter.format(amount.abs())}" : currencyFormatter.format(amount), 
            style: GoogleFonts.outfit(
              color: isNegative ? Colors.red[700] : Colors.black87, 
              fontWeight: FontWeight.w600,
              fontSize: 13
            )
          ),
        ],
      ),
    );
  }
}
