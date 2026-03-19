import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'http://192.168.1.9:8000/api';

  // ============ AUTH ============

  static Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/login'),
        headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', data['data']['access_token']);
        return {'success': true, 'message': 'Login Berhasil!'};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Email atau Password salah.'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Koneksi Gagal. Pastikan Laptop & HP di Wi-Fi yang sama.'};
    }
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }

  // ============ PROFILE ============

  static Future<Map<String, dynamic>?> getProfile() async {
    try {
      final headers = await getHeaders();
      final response = await http.get(Uri.parse('$baseUrl/user'), headers: headers);

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return body['data']['user'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<Map<String, dynamic>> updateProfile(Map<String, String> data) async {
    try {
      final headers = await getHeaders();
      headers['Content-Type'] = 'application/json';

      final response = await http.post(
        Uri.parse('$baseUrl/profile/update'),
        headers: headers,
        body: jsonEncode(data),
      );

      final body = jsonDecode(response.body);

      if (response.statusCode == 200) {
        final needsApproval = body['data']?['needs_approval'] ?? false;
        return {
          'success': true,
          'needs_approval': needsApproval,
          'message': body['message'] ?? 'Profil berhasil diperbarui.',
        };
      } else {
        // Collect validation errors
        String errorMsg = body['message'] ?? 'Gagal memperbarui profil.';
        if (body['errors'] != null) {
          final errors = body['errors'] as Map;
          errorMsg = errors.values.map((v) => (v as List).first).join('\n');
        }
        return {'success': false, 'needs_approval': false, 'message': errorMsg};
      }
    } catch (e) {
      return {'success': false, 'needs_approval': false, 'message': 'Koneksi gagal.'};
    }
  }

  // ============ ATTENDANCE ============

  static Future<List<dynamic>?> getAttendanceHistory() async {
    try {
      final headers = await getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/attendance/history'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        final data = body['data'];
        // Paginated response: { data: { current_page, data: [...], ... } }
        if (data is Map && data['data'] is List) {
          return data['data'];
        } else if (data is List) {
          return data;
        }
        return [];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // ============ NOTIFICATIONS ============

  static Future<List<dynamic>?> getNotifications() async {
    try {
      final headers = await getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/notifications'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return body['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<bool> markNotificationAsRead(int id) async {
    try {
      final headers = await getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/notifications/$id/read'),
        headers: headers,
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // ============ HEADERS ============

  static Future<Map<String, String>> getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    String? token = prefs.getString('token');
    return {
      'Accept': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }
}
