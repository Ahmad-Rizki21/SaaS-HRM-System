import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../api/api_service.dart';
import '../services/notification_service.dart';
import '../main.dart'; // Import global notifiers

class SettingsTab extends StatefulWidget {
  final VoidCallback onLogout;

  const SettingsTab({super.key, required this.onLogout});

  @override
  _SettingsTabState createState() => _SettingsTabState();
}

class _SettingsTabState extends State<SettingsTab> {
  final Color maroon = const Color(0xFF800000);
  bool _notifEnabled = true;

  @override
  void initState() {
    super.initState();
    _notifEnabled = NotificationService().isEnabled;
  }

  void _showChangePasswordDialog() {
    final currentController = TextEditingController();
    final newController = TextEditingController();
    final confirmController = TextEditingController();
    bool isLoading = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text("Ganti Kata Sandi", style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildDialogField("Kata Sandi Saat Ini", currentController, true),
              const SizedBox(height: 10),
              _buildDialogField("Kata Sandi Baru", newController, true),
              const SizedBox(height: 10),
              _buildDialogField("Konfirmasi Kata Sandi", confirmController, true),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text("Batal", style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              onPressed: isLoading
                  ? null
                  : () async {
                      if (newController.text.length < 8) {
                        ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text("Password baru minimal 8 karakter"), backgroundColor: Colors.red));
                        return;
                      }
                      if (newController.text != confirmController.text) {
                        ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text("Konfirmasi kata sandi tidak cocok"), backgroundColor: Colors.red));
                        return;
                      }

                      setDialogState(() => isLoading = true);
                      final result = await ApiService.changePassword(currentController.text, newController.text, confirmController.text);
                      setDialogState(() => isLoading = false);

                      if (result['success']) {
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result['message']), backgroundColor: Colors.green));
                      } else {
                        ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text(result['message']), backgroundColor: Colors.red));
                      }
                    },
              style: ElevatedButton.styleFrom(backgroundColor: maroon, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
              child: isLoading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text("Ganti", style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDialogField(String label, TextEditingController controller, bool isPassword) {
    return TextField(
      controller: controller,
      obscureText: isPassword,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(fontSize: 14),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 15, vertical: 12),
      ),
    );
  }

  // --- SHOW INFO MODALS ---

  void _showInfoModal(String title, String content) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(25))),
      builder: (context) => Container(
        padding: const EdgeInsets.all(25),
        height: MediaQuery.of(context).size.height * 0.7,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(child: Container(width: 40, height: 5, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(10)))),
            const SizedBox(height: 20),
            Text(title, style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            Expanded(child: SingleChildScrollView(child: Text(content, style: const TextStyle(height: 1.6)))),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(backgroundColor: maroon, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                child: const Text("Tutup", style: TextStyle(color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showLanguageSelector() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(25))),
      builder: (context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 20),
          Text("Pilih Bahasa", style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          _langItem("Indonesia", "ID", Icons.flag_outlined),
          _langItem("English", "EN", Icons.flag_outlined),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _langItem(String name, String code, IconData icon) {
    return ListTile(
      leading: Icon(icon, color: maroon),
      title: Text(name),
      trailing: languageNotifier.value == code ? Icon(Icons.check_circle, color: maroon) : null,
      onTap: () async {
        languageNotifier.value = code;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('language', code);
        Navigator.pop(context);
        setState(() {});
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(25, 20, 25, 10),
            child: Text("Pengaturan", style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold)),
          ),
          
          _buildSection("Akun & Keamanan"),
          _buildSettingItem(Icons.lock_reset_outlined, "Ganti Kata Sandi", "Perbarui password akun Anda", onTap: _showChangePasswordDialog),
          _buildSettingItem(Icons.notifications_none_outlined, "Notifikasi", "Atur pemberitahuan aplikasi", 
            showSwitch: true, 
            switchValue: _notifEnabled,
            onSwitchChanged: (val) async {
              await NotificationService().setEnabled(val);
              setState(() => _notifEnabled = val);
            }
          ),
          
          _buildSection("Preferensi"),
          _buildSettingItem(Icons.language_outlined, "Bahasa", languageNotifier.value == "ID" ? "Bahasa Indonesia" : "English", 
            value: languageNotifier.value, 
            onTap: _showLanguageSelector
          ),
          _buildSettingItem(Icons.dark_mode_outlined, "Tema Gelap", "Gunakan tampilan gelap", 
            showSwitch: true,
            switchValue: themeNotifier.value == ThemeMode.dark,
            onSwitchChanged: (val) async {
              themeNotifier.value = val ? ThemeMode.dark : ThemeMode.light;
              final prefs = await SharedPreferences.getInstance();
              await prefs.setBool('dark_mode', val);
              setState(() {});
            }
          ),
          
          _buildSection("Informasi"),
          _buildSettingItem(Icons.help_outline_rounded, "Pusat Bantuan", "FAQ dan bantuan penggunaan", onTap: () => _showInfoModal("Pusat Bantuan", "Selamat datang di Pusat Bantuan.\n\nJika Anda mengalami kendala saat melakukan absensi, pastikan GPS Anda aktif dan Anda berada di radius kantor.\n\nKontak Support: support@hrmsaas.com")),
          _buildSettingItem(Icons.policy_outlined, "Kebijakan Privasi", "Syarat dan ketentuan layanan", onTap: () => _showInfoModal("Kebijakan Privasi", "Kebijakan Privasi Aplikasi HRM SaaS MVP.\n\nKerahasiaan data Anda adalah prioritas kami. Kami mengumpulkan data lokasi hanya saat Anda melakukan absensi masuk dan keluar untuk memastikan validitas kehadiran.\n\nData wajah Anda diproses secara lokal untuk verifikasi identitas.")),
          _buildSettingItem(Icons.info_outline_rounded, "Tentang Aplikasi", "Versi 1.0.0", onTap: () => _showInfoModal("Tentang Aplikasi", "HRM SaaS Mobile Application\nVersi 1.0.0 (Stable)\n\nDeveloped by Ahmad Rizki & AI Assistant.\nCopyright © 2026.")),
          
          const SizedBox(height: 30),
          
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 25.0),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: widget.onLogout,
                icon: const Icon(Icons.logout_rounded, color: Colors.white),
                label: const Text("KELUAR AKUN", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(backgroundColor: maroon, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)), elevation: 0),
              ),
            ),
          ),
          const SizedBox(height: 50),
        ],
      ),
    );
  }

  Widget _buildSection(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(25, 25, 25, 10),
      child: Text(title.toUpperCase(), style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey[500], letterSpacing: 1.2)),
    );
  }

  Widget _buildSettingItem(IconData icon, String title, String subtitle, {String? value, bool showSwitch = false, bool switchValue = false, ValueChanged<bool>? onSwitchChanged, VoidCallback? onTap}) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 25, vertical: 5),
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: maroon.withOpacity(0.05), borderRadius: BorderRadius.circular(10)),
        child: Icon(icon, color: maroon, size: 24),
      ),
      title: Text(title, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600)),
      subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: Colors.grey)),
      trailing: showSwitch 
        ? Switch(value: switchValue, onChanged: onSwitchChanged, activeColor: maroon) 
        : (value != null 
            ? Text(value, style: TextStyle(color: maroon, fontWeight: FontWeight.bold)) 
            : const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: Colors.grey)),
      onTap: showSwitch ? null : onTap,
    );
  }
}
