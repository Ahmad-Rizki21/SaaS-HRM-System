import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http_parser/http_parser.dart';
import 'package:path/path.dart' as p;
import 'package:url_launcher/url_launcher.dart';
import 'package:device_info_plus/device_info_plus.dart';

class ApiService {
  static const String baseUrl = 'http://192.168.1.9:8000/api';

  // ============ HEADERS ============

  static Future<Map<String, String>> getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    String? token = prefs.getString('token');
    return {
      'Accept': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  static Future<String> getDeviceId() async {
    DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
    if (Platform.isAndroid) {
      AndroidDeviceInfo androidInfo = await deviceInfo.androidInfo;
      return androidInfo.id; // Unique ID on Android
    } else if (Platform.isIOS) {
      IosDeviceInfo iosInfo = await deviceInfo.iosInfo;
      return iosInfo.identifierForVendor ?? 'unknown_ios';
    }
    return 'unknown_device';
  }

  // ============ AUTH ============

  static Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      String deviceId = await getDeviceId();
      final response = await http.post(
        Uri.parse('$baseUrl/login'),
        headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email, 
          'password': password,
          'device_id': deviceId,
        }),
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

  static Future<Map<String, dynamic>> uploadProfilePhoto(String filePath) async {
    try {
      final headers = await getHeaders();
      final uri = Uri.parse('$baseUrl/profile/upload-photo');
      
      var request = http.MultipartRequest('POST', uri);
      request.headers.addAll(headers);

      final extension = p.extension(filePath).toLowerCase();
      String mimeType = 'image/jpeg';
      if (extension == '.png') mimeType = 'image/png';
      if (extension == '.webp') mimeType = 'image/webp';
      
      request.files.add(await http.MultipartFile.fromPath(
        'photo', 
        filePath,
        contentType: MediaType.parse(mimeType),
      ));

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      
      final body = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {'success': true, 'message': body['message'] ?? 'Foto berhasil diunggah.', 'url': body['data']['profile_photo_url']};
      } else {
        return {'success': false, 'message': body['message'] ?? 'Gagal mengunggah foto.'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Koneksi gagal: ${e.toString()}'};
    }
  }

  // ============ ATTENDANCE ============

  static Future<List<dynamic>?> getAttendanceHistory() async {
    try {
      final headers = await getHeaders();
      final response = await http.get(Uri.parse('$baseUrl/attendance/history'), headers: headers);

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        final data = body['data'];
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

  static Future<Map<String, dynamic>?> getTodayAttendance() async {
    try {
      final headers = await getHeaders();
      final response = await http.get(Uri.parse('$baseUrl/attendance/today'), headers: headers);

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return body['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<Map<String, dynamic>?> checkIn(double lat, double lng, {String? image, String? deviceId, bool isMocked = false}) async {
    try {
      final headers = await getHeaders();
      headers['Content-Type'] = 'application/json';
      final response = await http.post(
        Uri.parse('$baseUrl/attendance/check-in'),
        headers: headers,
        body: jsonEncode({
          'latitude': lat, 
          'longitude': lng, 
          'image': image,
          'device_id': deviceId,
          'is_mocked': isMocked,
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return null;
    }
  }

  static Future<Map<String, dynamic>?> checkOut(double lat, double lng, {String? image, String? deviceId, bool isMocked = false}) async {
    try {
      final headers = await getHeaders();
      headers['Content-Type'] = 'application/json';
      final response = await http.post(
        Uri.parse('$baseUrl/attendance/check-out'),
        headers: headers,
        body: jsonEncode({
          'latitude': lat, 
          'longitude': lng, 
          'image': image,
          'device_id': deviceId,
          'is_mocked': isMocked,
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return null;
    }
  }

  // ============ NOTIFICATIONS ============

  static Future<List<dynamic>?> getNotifications() async {
    try {
      final headers = await getHeaders();
      final response = await http.get(Uri.parse('$baseUrl/notifications'), headers: headers);

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
      final response = await http.put(Uri.parse('$baseUrl/notifications/$id/read'), headers: headers);
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  static Future<Map<String, dynamic>> clearNotificationsWithStatus() async {
    try {
      final headers = await getHeaders();
      final response = await http.post(Uri.parse('$baseUrl/notifications-clear'), headers: headers);
      return {
        'success': response.statusCode >= 200 && response.statusCode < 300,
        'status': response.statusCode,
        'body': response.body
      };
    } catch (e) {
      return {'success': false, 'status': 0, 'error': e.toString()};
    }
  }

  static Future<List<dynamic>?> getHolidays() async {
    try {
      final headers = await getHeaders();
      final response = await http.get(Uri.parse('$baseUrl/holidays'), headers: headers);
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return body['data']['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<List<dynamic>?> getAnnouncements() async {
    try {
      final headers = await getHeaders();
      final response = await http.get(Uri.parse('$baseUrl/announcements'), headers: headers);
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return body['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<bool> clearNotifications() async {
    final res = await clearNotificationsWithStatus();
    return res['success'];
  }

  static Future<Map<String, dynamic>> updateFcmToken(String token) async {
    try {
      final headers = await getHeaders();
      headers['Content-Type'] = 'application/json';
      final response = await http.post(
        Uri.parse('$baseUrl/notifications/fcm-token'),
        headers: headers,
        body: jsonEncode({'fcm_token': token}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'status': 'error', 'message': e.toString()};
    }
  }

  // ============ LEAVE (CUTI) ============

  static Future<List<dynamic>?> getLeaves() async {
    try {
      final headers = await getHeaders();
      final response = await http.get(Uri.parse('$baseUrl/leave'), headers: headers);
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return body['data']['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<Map<String, dynamic>> submitLeave(Map<String, dynamic> data) async {
    try {
      final headers = await getHeaders();
      headers['Content-Type'] = 'application/json';
      final response = await http.post(
        Uri.parse('$baseUrl/leave'),
        headers: headers,
        body: jsonEncode(data),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'status': 'error', 'message': 'Koneksi gagal.'};
    }
  }

  // ============ OVERTIME (LEMBUR) ============

  static Future<List<dynamic>?> getOvertimes() async {
    try {
      final headers = await getHeaders();
      final response = await http.get(Uri.parse('$baseUrl/overtimes'), headers: headers);
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return body['data']['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<Map<String, dynamic>> submitOvertime(Map<String, dynamic> data) async {
    try {
      final headers = await getHeaders();
      headers['Content-Type'] = 'application/json';
      final response = await http.post(
        Uri.parse('$baseUrl/overtimes'),
        headers: headers,
        body: jsonEncode(data),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'status': 'error', 'message': 'Koneksi gagal.'};
    }
  }

  // ============ SALARY (GAJI) ============

  static Future<List<dynamic>?> getSalaries() async {
    try {
      final headers = await getHeaders();
      final response = await http.get(Uri.parse('$baseUrl/salary'), headers: headers);
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return body['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // ============ TASKS (TUGAS) ============

  static Future<List<dynamic>?> getTasks() async {
    try {
      final headers = await getHeaders();
      final response = await http.get(Uri.parse('$baseUrl/tasks'), headers: headers);
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return body['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<Map<String, dynamic>> updateTaskStatus(int taskId, String status) async {
    try {
      final headers = await getHeaders();
      headers['Content-Type'] = 'application/json';
      final response = await http.post(
        Uri.parse('$baseUrl/tasks/$taskId/status'),
        headers: headers,
        body: jsonEncode({'status': status}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'status': 'error', 'message': 'Koneksi gagal.'};
    }
  }

  // ============ REIMBURSEMENT ============
  
  static Future<List<dynamic>?> getReimbursements() async {
    try {
      final headers = await getHeaders();
      final response = await http.get(Uri.parse('$baseUrl/reimbursements'), headers: headers);
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return body['data']['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<Map<String, dynamic>> submitReimbursement(Map<String, String> data, {String? filePath}) async {
    try {
      final headers = await getHeaders();
      final uri = Uri.parse('$baseUrl/reimbursements');
      
      var request = http.MultipartRequest('POST', uri);
      request.headers.addAll(headers);
      request.fields.addAll(data);


      if (filePath != null) {
        final extension = p.extension(filePath).toLowerCase();
        String mimeType = 'image/jpeg';
        if (extension == '.png') mimeType = 'image/png';
        if (extension == '.webp') mimeType = 'image/webp';
        
        request.files.add(await http.MultipartFile.fromPath(
          'attachment', 
          filePath,
          contentType: MediaType.parse(mimeType),
          filename: 'receipt_${DateTime.now().millisecondsSinceEpoch}$extension',
        ));
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      
      return jsonDecode(response.body);
    } catch (e) {
      return {'status': 'error', 'message': 'Koneksi gagal: ${e.toString()}'};
    }
  }

  // ============ SETTINGS ============

  static Future<Map<String, dynamic>> changePassword(String current, String newPwd, String confirm) async {
    try {
      final headers = await getHeaders();
      headers['Content-Type'] = 'application/json';

      final response = await http.post(
        Uri.parse('$baseUrl/user/change-password'),
        headers: headers,
        body: jsonEncode({
          'current_password': current,
          'new_password': newPwd,
          'new_password_confirmation': confirm,
        }),
      );

      final body = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {'success': true, 'message': body['message'] ?? 'Kata sandi berhasil diubah.'};
      } else {
        String errorMsg = body['message'] ?? 'Gagal mengubah kata sandi.';
        if (body['errors'] != null) {
          final errors = body['errors'] as Map;
          errorMsg = errors.values.map((v) => (v as List).first).join('\n');
        }
        return {'success': false, 'message': errorMsg};
      }
    } catch (e) {
      return {'success': false, 'message': 'Koneksi gagal.'};
    }
  }

  // ============ KPI REVIEWS ============

  static Future<List<dynamic>?> getKpis() async {
    try {
      final headers = await getHeaders();
      final response = await http.get(Uri.parse('$baseUrl/kpi-reviews'), headers: headers);
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return body['data']['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // ============ MANAGER ============

  static Future<Map<String, dynamic>?> getManagerPendingCount() async {
    try {
      final headers = await getHeaders();
      final response = await http.get(Uri.parse('$baseUrl/manager/pending-count'), headers: headers);
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return body['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<List<dynamic>?> getManagerPendingRequests(String type) async {
    try {
      final headers = await getHeaders();
      final response = await http.get(Uri.parse('$baseUrl/manager/pending-requests?type=$type'), headers: headers);
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return body['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<Map<String, dynamic>> updateManagerRequestStatus(String type, int id, String status, {String? remark}) async {
    try {
      final headers = await getHeaders();
      headers['Content-Type'] = 'application/json';
      final response = await http.post(
        Uri.parse('$baseUrl/manager/update-status'),
        headers: headers,
        body: jsonEncode({
          'type': type,
          'id': id,
          'status': status,
          'remark': remark,
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'status': 'error', 'message': 'Koneksi gagal.'};
    }
  }

  static Future<List<dynamic>?> getTeamAttendance() async {
    try {
      final headers = await getHeaders();
      final response = await http.get(Uri.parse('$baseUrl/manager/team-attendance'), headers: headers);
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return body['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<void> launchPdf(String type, int id) async {
    final prefs = await SharedPreferences.getInstance();
    String? token = prefs.getString('token');
    final url = Uri.parse('$baseUrl/export/$type/$id?token=$token');
    
    if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
      throw Exception('Could not launch $url');
    }
  }
}
