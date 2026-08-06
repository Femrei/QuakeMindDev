import 'bridge_client.dart';

class EmergencyAlert {
  const EmergencyAlert({
    required this.id,
    required this.title,
    required this.body,
    required this.severity,
    this.location,
    this.magnitude,
    required this.timestamp,
  });

  factory EmergencyAlert.fromJson(Map<String, dynamic> json) {
    return EmergencyAlert(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      body: json['body'] as String? ?? '',
      severity: json['severity'] as String? ?? 'info',
      location: json['location'] as String?,
      magnitude: (json['magnitude'] as num?)?.toDouble(),
      timestamp: json['timestamp'] as String? ?? '',
    );
  }

  final String id;
  final String title;
  final String body;
  final String severity;
  final String? location;
  final double? magnitude;
  final String timestamp;
}

class NotificationsService {
  const NotificationsService();

  static const _httpClient = BridgeHttpClient(
    configuredBaseUrl: '',
    defaultPort: 8000,
  );

  Future<EmergencyAlert?> fetchActive() async {
    final json = await _httpClient.getJson(
      endpoint: '/api/notifications/active',
      timeoutSeconds: 6,
    );
    final activeAlert = json['activeAlert'];
    if (activeAlert is Map<String, dynamic>) {
      return EmergencyAlert.fromJson(activeAlert);
    }
    return null;
  }
}
