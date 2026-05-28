import 'dart:convert';
import 'package:http/http.dart' as http;
import '../api_client.dart';

/// Repository untuk fitur Pengaturan (Settings).
/// Menangani: changePassword.
class SettingsRepository {
  static Future<Map<String, dynamic>> changePassword(
    String current,
    String newPwd,
    String confirm,
  ) async {
    try {
      final headers = await ApiClient.getHeaders();
      headers['Content-Type'] = 'application/json';

      final response = await ApiClient.client.post(
        Uri.parse('${ApiClient.baseUrl}/user/change-password'),
        headers: headers,
        body: jsonEncode({
          'current_password': current,
          'new_password': newPwd,
          'new_password_confirmation': confirm,
        }),
      );

      final body = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': body['message'] ?? 'Kata sandi berhasil diubah.',
        };
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
}
