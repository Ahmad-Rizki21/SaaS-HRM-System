import 'dart:convert';
import 'package:http/http.dart' as http;
import '../api_client.dart';

/// Repository untuk fitur Dokumen (SK & Regulations).
/// Menangani: getDocuments.
class DocumentRepository {
  static Future<List<dynamic>?> getDocuments({String? type}) async {
    try {
      final headers = await ApiClient.getHeaders();
      String url = '${ApiClient.baseUrl}/documents';
      if (type != null) url += '?type=$type';

      print('[Documents] Fetching: $url');
      final response = await ApiClient.client.get(Uri.parse(url), headers: headers);
      print('[Documents] Status: ${response.statusCode}');
      print(
        '[Documents] Body: ${response.body.length > 200 ? response.body.substring(0, 200) : response.body}',
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return body['data'];
      }
      print('[Documents] Error: HTTP ${response.statusCode}');
      return null;
    } catch (e) {
      print('[Documents] Exception: $e');
      return null;
    }
  }
}
