import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../api/api_service.dart';

class TaskScreen extends StatefulWidget {
  @override
  _TaskScreenState createState() => _TaskScreenState();
}

class _TaskScreenState extends State<TaskScreen> {
  final Color primaryColor = const Color(0xFF800000);
  List<dynamic> _tasks = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchTasks();
  }

  Future<void> _fetchTasks() async {
    setState(() => _isLoading = true);
    final data = await ApiService.getTasks();
    if (mounted) {
      setState(() {
        _tasks = data ?? [];
        _isLoading = false;
      });
    }
  }

  Future<void> _updateStatus(int taskId, String status) async {
    final res = await ApiService.updateTaskStatus(taskId, status);
    if (res['status'] == 'success') {
      _fetchTasks();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Status tugas berhasil diperbarui"), backgroundColor: Colors.green));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFBFBFB),
      appBar: AppBar(
        title: Text("Tugas Saya", style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: _isLoading 
          ? const Center(child: CircularProgressIndicator()) 
          : RefreshIndicator(
              onRefresh: _fetchTasks,
              child: _tasks.isEmpty 
                  ? Center(child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.assignment_turned_in_outlined, size: 80, color: Colors.grey[300]),
                        const SizedBox(height: 15),
                        const Text("Belum ada tugas yang diberikan"),
                      ],
                    ))
                  : ListView.builder(
                      padding: const EdgeInsets.all(20),
                      itemCount: _tasks.length,
                      itemBuilder: (context, index) {
                        final task = _tasks[index];
                        final status = task['status'];
                        final deadline = DateTime.parse(task['deadline']);
                        
                        Color priorityColor = Colors.blue;
                        if (task['priority'] == 3) priorityColor = Colors.red;
                        if (task['priority'] == 2) priorityColor = Colors.orange;

                        return Container(
                          margin: const EdgeInsets.only(bottom: 15),
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(15),
                            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 5))],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                    decoration: BoxDecoration(color: priorityColor.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                                    child: Text(
                                      task['priority'] == 3 ? "HIGH PRIORITY" : (task['priority'] == 2 ? "MEDIUM" : "LOW"),
                                      style: TextStyle(color: priorityColor, fontSize: 10, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  Text(
                                    "Deadline: ${DateFormat('dd MMM').format(deadline)}",
                                    style: TextStyle(color: Colors.grey[600], fontSize: 12),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 15),
                              Text(task['title'], style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 8),
                              Text(task['description'] ?? "Tidak ada deskripsi", style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                              const SizedBox(height: 20),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      CircleAvatar(radius: 12, backgroundColor: primaryColor.withOpacity(0.1), child: Icon(Icons.person, size: 12, color: primaryColor)),
                                      const SizedBox(width: 8),
                                      Text(task['assigner']?['name'] ?? "Admin", style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                    ],
                                  ),
                                  
                                  DropdownButton<String>(
                                    value: status,
                                    underline: const SizedBox(),
                                    items: ['pending', 'ongoing', 'completed']
                                        .map((s) => DropdownMenuItem(value: s, child: Text(s.toUpperCase(), style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: s == 'completed' ? Colors.green : (s == 'ongoing' ? Colors.blue : Colors.orange)))))
                                        .toList(),
                                    onChanged: (val) => _updateStatus(task['id'], val!),
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
}
