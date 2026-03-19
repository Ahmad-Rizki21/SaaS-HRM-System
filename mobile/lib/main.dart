import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/notification_screen.dart';
import 'services/notification_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Global Notifiers
final ValueNotifier<ThemeMode> themeNotifier = ValueNotifier(ThemeMode.light);
final ValueNotifier<String> languageNotifier = ValueNotifier('ID');

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Load Settings
  final prefs = await SharedPreferences.getInstance();
  final isDark = prefs.getBool('dark_mode') ?? false;
  themeNotifier.value = isDark ? ThemeMode.dark : ThemeMode.light;
  languageNotifier.value = prefs.getString('language') ?? 'ID';
  
  await NotificationService().init();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: themeNotifier,
      builder: (_, ThemeMode currentMode, __) {
        return ValueListenableBuilder<String>(
          valueListenable: languageNotifier,
          builder: (context, lang, _) {
            return MaterialApp(
              title: 'HRM SaaS Mobile',
              debugShowCheckedModeBanner: false,
              themeMode: currentMode,
              theme: _buildLightTheme(context),
              darkTheme: _buildDarkTheme(context),
              home: LoginScreen(),
              routes: {
                '/dashboard': (context) => DashboardScreen(),
                '/notifications': (context) => NotificationScreen(),
              },
            );
          },
        );
      },
    );
  }

  ThemeData _buildLightTheme(BuildContext context) {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF800000), primary: const Color(0xFF800000)),
      scaffoldBackgroundColor: const Color(0xFFFBFBFB),
      textTheme: GoogleFonts.outfitTextTheme(Theme.of(context).textTheme.apply(bodyColor: Colors.black87, displayColor: Colors.black87)),
    );
  }

  ThemeData _buildDarkTheme(BuildContext context) {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF800000), brightness: Brightness.dark, primary: const Color(0xFF800000)),
      scaffoldBackgroundColor: const Color(0xFF121212),
      textTheme: GoogleFonts.outfitTextTheme(Theme.of(context).textTheme.apply(bodyColor: Colors.white, displayColor: Colors.white)),
    );
  }
}
