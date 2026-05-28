import 'dart:convert';
import 'package:http/http.dart' as http;
import '../api_client.dart';

/// Repository untuk fitur Absensi.
/// Menangani: getAttendanceHistory, getTodayAttendance, checkIn, checkOut.
class AttendanceRepository {
  static Future<List<dynamic>?> getAttendanceHistory() async {
    try {
      final headers = await ApiClient.getHeaders();
      final response = await ApiClient.client.get(
        Uri.parse('${ApiClient.baseUrl}/attendance/history'),
        headers: headers,
      );

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
      final headers = await ApiClient.getHeaders();
      final response = await ApiClient.client.get(
        Uri.parse('${ApiClient.baseUrl}/attendance/today'),
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

  static Future<Map<String, dynamic>?> checkIn(
    double lat,
    double lng, {
    String? image,
    String? deviceId,
    bool isMocked = false,
  }) async {
    try {
      final headers = await ApiClient.getHeaders();
      headers['Content-Type'] = 'application/json';
      final response = await ApiClient.client.post(
        Uri.parse('${ApiClient.baseUrl}/attendance/check-in'),
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

  static Future<Map<String, dynamic>?> checkOut(
    double lat,
    double lng, {
    String? image,
    String? deviceId,
    bool isMocked = false,
  }) async {
    try {
      final headers = await ApiClient.getHeaders();
      headers['Content-Type'] = 'application/json';
      final response = await ApiClient.client.post(
        Uri.parse('${ApiClient.baseUrl}/attendance/check-out'),
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
}
