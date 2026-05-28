import 'dart:convert';
import 'package:http/http.dart' as http;
import '../api_client.dart';

/// Repository untuk fitur Koreksi Absensi (Attendance Corrections).
/// Menangani: getAttendanceCorrections, submitAttendanceCorrection, toggleWfh.
class AttendanceCorrectionRepository {
  static Future<List<dynamic>?> getAttendanceCorrections() async {
    try {
      final headers = await ApiClient.getHeaders();
      final response = await ApiClient.client.get(
        Uri.parse('${ApiClient.baseUrl}/attendance-corrections'),
        headers: headers,
      );
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        if (body['data'] is Map && body['data']['data'] is List) {
          return body['data']['data'];
        }
        return body['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<Map<String, dynamic>> submitAttendanceCorrection(
    Map<String, dynamic> data,
  ) async {
    try {
      final headers = await ApiClient.getHeaders();
      headers['Content-Type'] = 'application/json';
      final response = await ApiClient.client.post(
        Uri.parse('${ApiClient.baseUrl}/attendance-corrections'),
        headers: headers,
        body: jsonEncode(data),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'status': 'error', 'message': 'Koneksi gagal.'};
    }
  }

  static Future<Map<String, dynamic>> toggleWfh(int userId) async {
    try {
      final headers = await ApiClient.getHeaders();
      headers['Content-Type'] = 'application/json';
      final response = await ApiClient.client.post(
        Uri.parse('${ApiClient.baseUrl}/employees/$userId/toggle-wfh'),
        headers: headers,
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'status': 'error', 'message': 'Koneksi gagal.'};
    }
  }
}
