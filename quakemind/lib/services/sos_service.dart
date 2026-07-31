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
}
