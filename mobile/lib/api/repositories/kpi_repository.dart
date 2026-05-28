import 'dart:convert';
import 'package:http/http.dart' as http;
import '../api_client.dart';

/// Repository untuk fitur KPI Reviews.
/// Menangani: getKpis.
class KpiRepository {
  static Future<List<dynamic>?> getKpis() async {
    try {
      final headers = await ApiClient.getHeaders();
      final response = await ApiClient.client.get(
        Uri.parse('${ApiClient.baseUrl}/kpi-reviews'),
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
}
