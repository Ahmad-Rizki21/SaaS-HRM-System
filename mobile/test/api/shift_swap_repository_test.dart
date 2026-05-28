import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:http/http.dart' as http;
import 'package:hrm_mobile/api/api_client.dart';
import 'package:hrm_mobile/api/repositories/shift_swap_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'auth_repository_test.mocks.dart';

void main() {
  group('ShiftSwapRepository Unit Tests', () {
    late MockClient mockClient;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      ApiClient.mockDeviceId = 'test_device_id';
      mockClient = MockClient();
      ApiClient.client = mockClient;
    });
  });
}
