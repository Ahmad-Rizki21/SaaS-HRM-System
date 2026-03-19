import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/notification_screen.dart';
import 'services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await NotificationService().init();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'HRM SaaS Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Color(0xFF800000),
          brightness: Brightness.light,
          primary: Color(0xFF800000),
        ),
        scaffoldBackgroundColor: Color(0xFFFBFBFB),
        useMaterial3: true,
        textTheme: GoogleFonts.outfitTextTheme(
          Theme.of(context).textTheme.apply(bodyColor: Colors.black87, displayColor: Colors.black87),
        ),
      ),
      home: LoginScreen(), // Awal aplikasi buka halaman Login
      routes: {
        '/dashboard': (context) => DashboardScreen(), // Daftar halaman Dashboard
        '/notifications': (context) => NotificationScreen(), // Halaman Notifikasi
      },
    );
  }
}
