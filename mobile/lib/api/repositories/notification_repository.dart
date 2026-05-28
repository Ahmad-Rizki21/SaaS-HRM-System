import 'dart:convert';
import 'package:http/http.dart' as http;
import '../api_client.dart';

/// Repository untuk fitur Notifikasi.
/// Menangani: getNotifications, markNotificationAsRead, clearNotifications,
///            getHolidays, getAnnouncements, updateFcmToken.
class NotificationRepository {
  static Future<List<dynamic>?> getNotifications() async {
    try {
      final headers = await ApiClient.getHeaders();
      final response = await ApiClient.client.get(
        Uri.parse('${ApiClient.baseUrl}/notifications'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        // Backend now returns paginated data: body['data']['data']
        if (body['data'] is Map && body['data'].containsKey('data')) {
          return body['data']['data'];
        }
        return body['data']; // Fallback for list
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<bool> markNotificationAsRead(int id) async {
    try {
      final headers = await ApiClient.getHeaders();
      final response = await ApiClient.client.put(
        Uri.parse('${ApiClient.baseUrl}/notifications/$id/read'),
        headers: headers,
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  static Future<Map<String, dynamic>> clearNotificationsWithStatus() async {
    try {
      final headers = await ApiClient.getHeaders();
      final response = await ApiClient.client.post(
        Uri.parse('${ApiClient.baseUrl}/notifications-clear'),
        headers: headers,
      );
      return {
        'success': response.statusCode >= 200 && response.statusCode < 300,
        'status': response.statusCode,
        'body': response.body,
      };
    } catch (e) {
      return {'success': false, 'status': 0, 'error': e.toString()};
    }
  }

  static Future<bool> clearNotifications() async {
    final res = await clearNotificationsWithStatus();
    return res['success'];
  }

  static Future<List<dynamic>?> getHolidays() async {
    try {
      final headers = await ApiClient.getHeaders();
      final response = await ApiClient.client.get(
        Uri.parse('${ApiClient.baseUrl}/holidays'),
        headers: headers,
      );
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
      final headers = await ApiClient.getHeaders();
      final response = await ApiClient.client.get(
        Uri.parse('${ApiClient.baseUrl}/announcements'),
        headers: headers,
      );
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        // Backend returns paginated data: body['data']['data']
        if (body['data'] is Map && body['data'].containsKey('data')) {
          return body['data']['data'];
        }
        return body['data']; // Fallback for direct list
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<Map<String, dynamic>> updateFcmToken(String token) async {
    try {
      final headers = await ApiClient.getHeaders();
      headers['Content-Type'] = 'application/json';
      final response = await ApiClient.client.post(
        Uri.parse('${ApiClient.baseUrl}/notifications/fcm-token'),
        headers: headers,
        body: jsonEncode({'fcm_token': token}),
      );
      print("FCM Token update response: ${response.body}");
      return jsonDecode(response.body);
    } catch (e) {
      return {'status': 'error', 'message': e.toString()};
    }
  }
}
