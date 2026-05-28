import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import '../api_client.dart';
import '../../services/secure_storage_service.dart';

/// Repository untuk fitur Gaji (Salary/Payroll).
/// Menangani: getSalaries, downloadSalarySlip, previewSalarySlip.
class SalaryRepository {
  static Future<List<dynamic>?> getSalaries() async {
    try {
      final headers = await ApiClient.getHeaders();
      final url = Uri.parse('${ApiClient.baseUrl}/payroll/my-history');
      print("Fetching Salaries from: $url");
      final response = await ApiClient.client.get(url, headers: headers);
      print("Salary Response Status: ${response.statusCode}");
      print("Salary Response Body: ${response.body}");

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        final data = body['data'];
        if (data is List) return data;
        if (data is Map && data['data'] is List) return data['data'];
        return [];
      }
      return null;
    } catch (e) {
      print("Error fetching salaries: $e");
      return null;
    }
  }

  static Future<void> downloadSalarySlip(int id) async {
    final secureStorage = await SecureStorageService.getInstance();
    String? token = await secureStorage.getAccessToken();
    final encodedToken = Uri.encodeComponent(token ?? '');
    final url = Uri.parse(
      '${ApiClient.baseUrl}/payroll/download-slip/$id?token=$encodedToken',
    );
    try {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } catch (e) {}
  }

  static Future<void> previewSalarySlip(int id) async {
    final secureStorage = await SecureStorageService.getInstance();
    String? token = await secureStorage.getAccessToken();
    final encodedToken = Uri.encodeComponent(token ?? '');
    final url = Uri.parse(
      '${ApiClient.baseUrl}/payroll/preview-slip/$id?token=$encodedToken',
    );
    try {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } catch (e) {}
  }
}
