import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:path/path.dart' as p;
import '../api_client.dart';

/// Repository untuk fitur Profil.
/// Menangani: getProfile, updateProfile, uploadProfilePhoto.
class ProfileRepository {
  static Future<Map<String, dynamic>?> getProfile() async {
    try {
      final headers = await ApiClient.getHeaders();
      final response = await ApiClient.client.get(
        Uri.parse('${ApiClient.baseUrl}/user'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return body['data']['user'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<Map<String, dynamic>> updateProfile(
    Map<String, String> data,
  ) async {
    try {
      final headers = await ApiClient.getHeaders();
      headers['Content-Type'] = 'application/json';

      final response = await ApiClient.client.post(
        Uri.parse('${ApiClient.baseUrl}/profile/update'),
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
      return {
        'success': false,
        'needs_approval': false,
        'message': 'Koneksi gagal.',
      };
    }
  }

  static Future<Map<String, dynamic>> uploadProfilePhoto(
    String filePath,
  ) async {
    try {
      final headers = await ApiClient.getHeaders();
      final uri = Uri.parse('${ApiClient.baseUrl}/profile/upload-photo');

      var request = http.MultipartRequest('POST', uri);
      request.headers.addAll(headers);

      final extension = p.extension(filePath).toLowerCase();
      String mimeType = 'image/jpeg';
      if (extension == '.png') mimeType = 'image/png';
      if (extension == '.webp') mimeType = 'image/webp';

      request.files.add(
        await http.MultipartFile.fromPath(
          'photo',
          filePath,
          contentType: MediaType.parse(mimeType),
        ),
      );

      final streamedResponse = await ApiClient.client.send(request);
      final response = await http.Response.fromStream(streamedResponse);

      final body = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': body['message'] ?? 'Foto berhasil diunggah.',
          'url': body['data']['profile_photo_url'],
        };
      } else {
        return {
          'success': false,
          'message': body['message'] ?? 'Gagal mengunggah foto.',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Koneksi gagal: ${e.toString()}'};
    }
  }
}
