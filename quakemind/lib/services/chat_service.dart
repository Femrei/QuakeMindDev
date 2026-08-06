import 'bridge_client.dart';

class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.senderId,
    required this.senderName,
    this.senderUnit,
    required this.text,
    required this.timestamp,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String? ?? '',
      senderId: json['senderId'] as String? ?? '',
      senderName: json['senderName'] as String? ?? 'Ekip Uyesi',
      senderUnit: json['senderUnit'] as String?,
      text: json['text'] as String? ?? '',
      timestamp: DateTime.tryParse(json['timestamp'] as String? ?? '') ??
          DateTime.now(),
    );
  }

  final String id;
  final String senderId;
  final String senderName;
  final String? senderUnit;
  final String text;
  final DateTime timestamp;
}

class ChatUnavailableException extends BridgeUnavailableException {
  const ChatUnavailableException({
    required super.message,
    required super.instructions,
    super.bridgeBaseUrl,
    super.lastError,
  });
}

class ChatService {
  const ChatService();

  static const _httpClient = BridgeHttpClient(
    configuredBaseUrl: '',
    defaultPort: 8000,
  );

  Future<ChatMessage> send({required String token, required String text}) async {
    final json = await _httpClient.postJson(
      endpoint: '/api/chat/send',
      payload: {'token': token, 'text': text},
      unavailableException: const ChatUnavailableException(
        message: 'Mesaj gonderilemedi.',
        instructions: ['Sunucu baglantisini kontrol edin.'],
      ),
      timeoutSeconds: 15,
    );
    return ChatMessage.fromJson(json['message'] as Map<String, dynamic>);
  }

  Future<List<ChatMessage>> fetchMessages({
    required String token,
    int limit = 50,
  }) async {
    final json = await _httpClient.getJson(
      endpoint: '/api/chat/messages?token=$token&limit=$limit',
      timeoutSeconds: 8,
    );
    final list = json['messages'] as List<dynamic>? ?? const [];
    return list
        .map((item) => ChatMessage.fromJson(item as Map<String, dynamic>))
        .toList();
  }
}
