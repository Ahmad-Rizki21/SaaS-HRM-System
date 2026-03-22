import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import '../api/api_service.dart';
import '../services/fcm_service.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscureText = true;

  // Warna Tema Maroon
  final Color maroon = Color(0xFF800000);
  final Color maroonLight = Color(0xFFAD2831);
  final Color maroonSoft = Color(
    0xFFFFF0F0,
  ); // Background merah muda sangat lembut

  // PageController untuk swipe antara Onboarding & Login
  final PageController _pageController = PageController();
  int _currentPage = 0;

  void _goToLogin() {
    _pageController.animateToPage(
      1,
      duration: Duration(milliseconds: 400),
      curve: Curves.easeInOut,
    );
  }

  void _goToOnboarding() {
    _pageController.animateToPage(
      0,
      duration: Duration(milliseconds: 400),
      curve: Curves.easeInOut,
    );
  }

  void _handleLogin() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      _showSnackBar("Email dan Password wajib diisi!");
      return;
    }

    setState(() => _isLoading = true);

    final result = await ApiService.login(
      _emailController.text,
      _passwordController.text,
    );

    setState(() => _isLoading = false);

    if (result['success']) {
      await FcmService.init(); // Send FCM token to server
      Navigator.pushReplacementNamed(context, '/dashboard');
    } else {
      _showSnackBar(result['message']);
    }
  }

  void _showSnackBar(String message, {bool isError = true}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.redAccent : Colors.green,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark.copyWith(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: Colors.white,
        body: PageView(
          controller: _pageController,
          onPageChanged: (index) => setState(() => _currentPage = index),
          children: [
            // ==========================================
            // HALAMAN 1: ONBOARDING (Optimize Workers)
            // ==========================================
            _buildOnboardingPage(),

            // ==========================================
            // HALAMAN 2: FORM LOGIN (Sign In)
            // ==========================================
            _buildLoginPage(),
          ],
        ),
      ),
    );
  }

  // ============================================
  // HALAMAN ONBOARDING (Mirip Referensi Kanan)
  // ============================================
  Widget _buildOnboardingPage() {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 30),
        child: Column(
          children: [
            SizedBox(height: 30),
            // Logo/Brand
            Row(
              children: [
                Icon(Icons.business, color: maroon, size: 28),
                SizedBox(width: 8),
                Flexible(
                  child: Text(
                    "HRMS - Narwasthu Group",
                    style: GoogleFonts.outfit(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: maroon,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            SizedBox(height: 30),

            // Ilustrasi Vektor
            Expanded(
              flex: 5,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Image.asset(
                  'assets/images/workers_illustration.jpg',
                  fit: BoxFit.contain,
                ),
              ),
            ),
            SizedBox(height: 30),

            // Judul "Optimize Workers"
            RichText(
              textAlign: TextAlign.center,
              text: TextSpan(
                style: GoogleFonts.outfit(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
                children: [
                  TextSpan(text: "Optimize "),
                  TextSpan(
                    text: "Workers",
                    style: TextStyle(color: maroon),
                  ),
                ],
              ),
            ),
            SizedBox(height: 12),
            Text(
              "HR management made easily, organize\nyour daily working routine easily",
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                color: Colors.grey[600],
                fontSize: 14,
                height: 1.5,
              ),
            ),

            Spacer(flex: 1),

            // Tombol "Sign In" → Pindah ke Halaman Login
            SizedBox(
              width: double.infinity,
              height: 55,
              child: ElevatedButton(
                onPressed: _goToLogin,
                style: ElevatedButton.styleFrom(
                  backgroundColor: maroon,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                  elevation: 3,
                ),
                child: Text(
                  "Sign in",
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            SizedBox(height: 15),

            // "Sign up" Text
          ],
        ),
      ),
    );
  }

  // ============================================
  // HALAMAN FORM LOGIN (Mirip Referensi Kiri)
  // ============================================
  Widget _buildLoginPage() {
    return SafeArea(
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 30),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(height: 30),
              // Logo/Brand
              Row(
                children: [
                  IconButton(
                    icon: Icon(Icons.arrow_back_ios, color: maroon),
                    onPressed: _goToOnboarding,
                  ),
                  Icon(Icons.business, color: maroon, size: 24),
                  SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      "HRMS - Narwasthu Group",
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: maroon,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              SizedBox(height: 50),

              // "Sign in"
              Text(
                "Sign in",
                style: GoogleFonts.outfit(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
              SizedBox(height: 8),
              Text(
                "Please fill in the credentials",
                style: GoogleFonts.outfit(
                  color: Colors.grey[500],
                  fontSize: 14,
                ),
              ),
              SizedBox(height: 40),

              // Input Email
              Container(
                decoration: BoxDecoration(
                  color: maroonSoft,
                  borderRadius: BorderRadius.circular(15),
                ),
                child: TextField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  style: TextStyle(color: Colors.black),
                  decoration: InputDecoration(
                    hintText: "Email",
                    hintStyle: TextStyle(color: Colors.grey[400]),
                    prefixIcon: Icon(Icons.person_outline, color: maroon),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 18,
                    ),
                  ),
                ),
              ),
              SizedBox(height: 18),

              // Input Password
              Container(
                decoration: BoxDecoration(
                  color: maroonSoft,
                  borderRadius: BorderRadius.circular(15),
                ),
                child: TextField(
                  controller: _passwordController,
                  obscureText: _obscureText,
                  style: TextStyle(color: Colors.black),
                  decoration: InputDecoration(
                    hintText: "Password",
                    hintStyle: TextStyle(color: Colors.grey[400]),
                    prefixIcon: Icon(Icons.lock_outline, color: maroon),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscureText
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        color: Colors.grey[400],
                      ),
                      onPressed: () =>
                          setState(() => _obscureText = !_obscureText),
                    ),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 18,
                    ),
                  ),
                ),
              ),
              SizedBox(height: 35),

              // Tombol Login
              SizedBox(
                width: double.infinity,
                height: 55,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleLogin,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: maroon,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                    elevation: 3,
                    disabledBackgroundColor: maroon.withOpacity(0.6),
                  ),
                  child: _isLoading
                      ? SpinKitThreeBounce(color: Colors.white, size: 20)
                      : Text(
                          "Sign in",
                          style: GoogleFonts.outfit(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),
              SizedBox(height: 60),

              // Footer
              Center(
                child: Text.rich(
                  TextSpan(
                    style: GoogleFonts.outfit(
                      fontSize: 14,
                      color: Colors.grey[500],
                    ),
                    children: [
                      TextSpan(
                        text:
                            "Jika belum ada akun silahkan hubungi HR yang bersangkutan. ",
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
