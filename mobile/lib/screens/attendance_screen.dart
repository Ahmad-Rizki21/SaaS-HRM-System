import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:camera/camera.dart';
import 'package:geolocator/geolocator.dart';
import '../api/api_service.dart';

class AttendanceScreen extends StatefulWidget {
  final bool isCheckIn;

  const AttendanceScreen({super.key, required this.isCheckIn});

  @override
  _AttendanceScreenState createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  CameraController? _controller;
  List<CameraDescription>? _cameras;
  bool _isCameraReady = false;
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    _cameras = await availableCameras();
    if (_cameras != null && _cameras!.isNotEmpty) {
      // Cari kamera depan
      final frontCamera = _cameras!.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.front,
        orElse: () => _cameras!.first,
      );

      _controller = CameraController(
        frontCamera,
        ResolutionPreset.medium,
        enableAudio: false,
      );

      await _controller!.initialize();
      if (mounted) {
        setState(() {
          _isCameraReady = true;
        });
      }
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  Future<void> _takeAttendance() async {
    if (!_isCameraReady || _isProcessing) return;

    setState(() => _isProcessing = true);

    try {
      // 1. Ambil Foto
      final XFile image = await _controller!.takePicture();
      final bytes = await File(image.path).readAsBytes();
      final base64Image = "data:image/png;base64,${base64Encode(bytes)}";

      // 2. Dapatkan Lokasi GPS
      Position position = await _determinePosition();

      // 3. Kirim ke API
      Map<String, dynamic>? result;
      if (widget.isCheckIn) {
        result = await ApiService.checkIn(
          position.latitude, 
          position.longitude, 
          image: base64Image
        );
      } else {
        result = await ApiService.checkOut(
          position.latitude, 
          position.longitude, 
          image: base64Image
        );
      }

      if (result != null && result['status'] == 'success') {
        // Berhasil! Langsung lempar balik ke Dashboard secepat kilat
        if (mounted) {
          Navigator.of(context).pop(result['data']);
        }
      } else {
        _showErrorDialog(result?['message'] ?? "Gagal memproses absensi");
      }
    } catch (e) {
      _showErrorDialog("Error: ${e.toString()}");
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<Position> _determinePosition() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return Future.error('GPS belum diaktifkan.');

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return Future.error('Izin lokasi ditolak.');
    }
    
    return await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
  }

  void _showErrorDialog(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message), backgroundColor: Colors.red));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Text("Selfie Absen ${widget.isCheckIn ? 'Masuk' : 'Pulang'}", style: GoogleFonts.outfit(color: Colors.white)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(icon: Icon(Icons.close, color: Colors.white), onPressed: () => Navigator.pop(context)),
      ),
      body: Stack(
        children: [
          _isCameraReady 
            ? Center(
                child: AspectRatio(
                  aspectRatio: 1.0, // Create a square preview for face
                  child: ClipOval(
                    child: CameraPreview(_controller!),
                  ),
                ),
              )
            : Center(child: CircularProgressIndicator(color: Colors.white)),
          
          // Instruction Text
          Positioned(
            top: 50,
            left: 0,
            right: 0,
            child: Text(
              "Posisikan Wajah ke Dalam Lingkaran",
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(color: Colors.white, fontSize: 16),
            ),
          ),

          // Action Button
          Positioned(
            bottom: 60,
            left: 0,
            right: 0,
            child: Center(
              child: GestureDetector(
                onTap: _takeAttendance,
                child: Container(
                  height: 80,
                  width: 80,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(color: Color(0xFF800000), width: 5),
                  ),
                  child: Icon(Icons.camera_alt, color: Color(0xFF800000), size: 40),
                ),
              ),
            ),
          ),

          if (_isProcessing)
            Container(color: Colors.black54, child: Center(child: CircularProgressIndicator(color: Colors.white))),
        ],
      ),
    );
  }
}
