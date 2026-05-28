import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:http/http.dart' as http;
import 'package:hrm_mobile/api/api_client.dart';
import 'package:hrm_mobile/api/repositories/task_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'auth_repository_test.mocks.dart';

void main() {
  group('TaskRepository Unit Tests', () {
    late MockClient mockClient;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      ApiClient.mockDeviceId = 'test_device_id';
      mockClient = MockClient();
      ApiClient.client = mockClient;
    });
  });
}
