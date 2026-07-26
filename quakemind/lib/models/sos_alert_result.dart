class SosAlertResult {
  const SosAlertResult({
    required this.id,
    required this.latitude,
    required this.longitude,
    required this.accuracy,
    required this.receivedAt,
    required this.totalAlerts,
  });

  factory SosAlertResult.fromJson(Map<String, dynamic> json) {
    return SosAlertResult(
      id: json['id'] as String? ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0,
      accuracy: (json['accuracy'] as num?)?.toDouble(),
      receivedAt: json['receivedAt'] as String? ?? '',
      totalAlerts: (json['totalAlerts'] as num?)?.toInt() ?? 0,
    );
  }

  final String id;
  final double latitude;
  final double longitude;
  final double? accuracy;
  final String receivedAt;
  final int totalAlerts;
}
