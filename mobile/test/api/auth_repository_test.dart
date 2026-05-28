import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:http/http.dart' as http;
import 'package:hrm_mobile/api/api_client.dart';
import 'package:hrm_mobile/api/repositories/auth_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

import 'auth_repository_test.mocks.dart';

// Anotasi ini akan men-generate mock class untuk http.Client
@GenerateMocks([http.Client])
void main() {
  group('AuthRepository Unit Tests', () {
    late MockClient mockClient;

    setUp(() async {
      // Mock SharedPreferences
      SharedPreferences.setMockInitialValues({});
      
      // Mock ApiClient Device ID to avoid DeviceInfoPlugin error
      ApiClient.mockDeviceId = 'test_device_id';

      // Setup mock client
      mockClient = MockClient();
      
      // Override ApiClient's global client with our mock
      ApiClient.client = mockClient;
    });

    test('searchCompanies returns a list of companies on success', () async {
      final String query = 'Tech';
      final mockResponse = {
        'data': [
          {'id': 1, 'name': 'Tech Corp'},
          {'id': 2, 'name': 'Tech Solutions'}
        ]
      };

      // Arrange: Saat client.get dipanggil, kembalikan respons sukses
      when(mockClient.get(
        Uri.parse('${ApiClient.baseUrl}/companies/search?q=$query'),
        headers: anyNamed('headers'),
      )).thenAnswer((_) async => http.Response(jsonEncode(mockResponse), 200));

      // Act: Panggil repository
      final result = await AuthRepository.searchCompanies(query);

      // Assert: Pastikan hasilnya sesuai dan jumlahnya benar
      expect(result.length, 2);
      expect(result[0]['name'], 'Tech Corp');
    });

    test('login returns success on valid credentials', () async {
      final mockResponse = {
        'data': {
          'access_token': 'dummy_access',
          'refresh_token': 'dummy_refresh',
          'expires_in': 3600,
          'user': {'id': 1, 'name': 'Admin'}
        }
      };

      when(mockClient.post(
        Uri.parse('${ApiClient.baseUrl}/login'),
        headers: anyNamed('headers'),
        body: anyNamed('body'),
      )).thenAnswer((_) async => http.Response(jsonEncode(mockResponse), 200));

      final result = await AuthRepository.login('admin@tech.com', 'password', 'Tech Corp');

      expect(result['success'], true);
      expect(result['message'], 'Login Berhasil!');
    });

    test('login returns failure message on error', () async {
      final mockResponse = {
        'message': 'Invalid credentials'
      };

      when(mockClient.post(
        Uri.parse('${ApiClient.baseUrl}/login'),
        headers: anyNamed('headers'),
        body: anyNamed('body'),
      )).thenAnswer((_) async => http.Response(jsonEncode(mockResponse), 401));

      final result = await AuthRepository.login('admin@tech.com', 'wrongpassword', 'Tech Corp');

      expect(result['success'], false);
      expect(result['message'], 'Invalid credentials');
    });
  });
}
