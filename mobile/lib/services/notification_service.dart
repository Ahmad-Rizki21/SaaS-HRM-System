import 'dart:async';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../api/api_service.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notificationsPlugin = FlutterLocalNotificationsPlugin();
  
  Timer? _pollingTimer;
  int? _lastNotifId;
  bool _isInitialized = false;
  bool _isEnabled = true;

  bool get isEnabled => _isEnabled;

  Future<void> setEnabled(bool value) async {
    _isEnabled = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('notifications_enabled', value);
  }

  Future<void> init() async {
    if (_isInitialized) return;

    final prefs = await SharedPreferences.getInstance();
    _isEnabled = prefs.getBool('notifications_enabled') ?? true;

    // 1. Android settings
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    // 2. iOS settings
    const DarwinInitializationSettings initializationSettingsIOS =
        DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const InitializationSettings initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: initializationSettingsIOS,
    );

    await _notificationsPlugin.initialize(initializationSettings);

    _isInitialized = true;
  }

  void startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(Duration(seconds: 10), (timer) {
      _checkNewNotifications();
    });
    // First check
    _checkNewNotifications();
  }

  void stopPolling() {
    _pollingTimer?.cancel();
  }

  Future<void> _checkNewNotifications() async {
    final notifications = await ApiService.getNotifications();
    if (notifications != null && notifications.isNotEmpty) {
      final latest = notifications.first;
      final currentId = latest['id'];

      // Jika ID berubah dan bukan null (pertama kali load kita simpan ID lama agar tidak bunyi saat login)
      if (_lastNotifId != null && _lastNotifId != currentId) {
        showNotification(
          latest['id'],
          latest['title'] ?? 'Notifikasi Baru',
          latest['message'] ?? '',
        );
      }
      _lastNotifId = currentId;
    }
  }

  Future<void> showNotification(int id, String title, String body) async {
    if (!_isEnabled) return; // JANGAN TAMPILKAN JIKA DIMATIKAN
    try {
      // Show Banner with custom sound
      const AndroidNotificationDetails androidPlatformChannelSpecifics =
          AndroidNotificationDetails(
        'hrm_notif_channel_v2', // Ganti ID channel agar system reload sound baru
        'HRM Notifications',
        channelDescription: 'Channel untuk notifikasi aplikasi HRM',
        importance: Importance.max,
        priority: Priority.high,
        playSound: true,
        // sound: RawResourceAndroidNotificationSound('notif_sound'), // Temporarily commented to ensure default works
        showWhen: true,
      );

      const NotificationDetails platformChannelSpecifics =
          NotificationDetails(
        android: androidPlatformChannelSpecifics,
        iOS: DarwinNotificationDetails(
          presentSound: true,
          sound: 'notif_sound.wav', // File di assets atau bundle
        ),
      );

      await _notificationsPlugin.show(
        id,
        title,
        body,
        platformChannelSpecifics,
      );
    } catch (e) {
      print("Error showing notification: $e");
    }
  }
}
