import '../models/sos_alert_result.dart';
import 'bridge_client.dart';

class SosBridgeUnavailableException extends BridgeUnavailableException {
  const SosBridgeUnavailableException({
    required super.message,
    required super.instructions,
    super.bridgeBaseUrl,
    super.lastError,
  });
}

class SosService {
  const SosService();

  static const _httpClient = BridgeHttpClient(
    configuredBaseUrl: '',
    defaultPort: 8000,
  );

  Future<SosAlertResult> sendAlert({
    required double latitude,
    required double longitude,
    double? accuracy,
    String? message,
    String? userId,
  }) async {
    final jsonMap = await _httpClient.postJson(
      endpoint: '/api/sos/alert',
      payload: {
        'latitude': latitude,
        'longitude': longitude,
        if (accuracy != null) 'accuracy': accuracy,
        if (message != null && message.trim().isNotEmpty)
          'message': message.trim(),
        if (userId != null && userId.trim().isNotEmpty) 'userId': userId.trim(),
      },
      unavailableException: const SosBridgeUnavailableException(
        message: 'SOS sunucusuna baglanilamadi.',
        instructions: [
          'Ayarlardan API adresini (IP:Port) dogru girdiginizden emin olun.',
          'Konumunuz yine de haritada gosterilir; baglanti duzelince tekrar gonderebilirsiniz.',
        ],
      ),
      timeoutSeconds: 15,
    );

    return SosAlertResult.fromJson(jsonMap);
  }

  Future<List<SosAlertSummary>> fetchAlerts() async {
    final json = await _httpClient.getJson(
      endpoint: '/api/sos/alerts',
      timeoutSeconds: 8,
    );
    final list = json['alerts'] as List<dynamic>? ?? const [];
    return list
        .map((item) => SosAlertSummary.fromJson(item as Map<String, dynamic>))
        .toList()
        .reversed
        .toList();
  }
}

class SosAlertSummary {
  const SosAlertSummary({
    required this.id,
    required this.latitude,
    required this.longitude,
    this.accuracy,
    this.message,
    this.userId,
    required this.receivedAt,
  });

  factory SosAlertSummary.fromJson(Map<String, dynamic> json) {
    return SosAlertSummary(
      id: json['id'] as String? ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0,
      accuracy: (json['accuracy'] as num?)?.toDouble(),
      message: json['message'] as String?,
      userId: json['userId'] as String?,
      receivedAt: json['receivedAt'] as String? ?? '',
    );
  }

  final String id;
  final double latitude;
  final double longitude;
  final double? accuracy;
  final String? message;
  final String? userId;
  final String receivedAt;
}
