import 'road_damage_result.dart';

/// Envelope returned by GET /api/road_damage/status/{analysisId} while
/// polling an analysis job started via RoadDamageService.analyzeArea.
class RoadDamageJobStatus {
  const RoadDamageJobStatus({
    required this.status,
    this.result,
    this.errorMessage,
    this.progress = 0,
    this.progressMessage,
  });

  factory RoadDamageJobStatus.fromJson(Map<String, dynamic> json) {
    final status = json['status'] as String? ?? 'error';
    if (status == 'done') {
      return RoadDamageJobStatus(
        status: status,
        result: RoadDamageResult.fromJson(json),
        progress: 100,
      );
    }
    if (status == 'error') {
      return RoadDamageJobStatus(
        status: status,
        errorMessage: json['error'] as String? ?? 'Analiz basarisiz oldu.',
      );
    }
    return RoadDamageJobStatus(
      status: status,
      progress: (json['progress'] as num?)?.toInt() ?? 0,
      progressMessage: json['progressMessage'] as String?,
    );
  }

  /// "queued", "done", "error", or "not_found" (synthesized locally when the
  /// backend returns 404 -- see RoadDamageService.pollAnalysis).
  final String status;
  final RoadDamageResult? result;
  final String? errorMessage;

  /// 0-100. The analysis can run for minutes on CPU, so the backend reports
  /// real stage-by-stage progress (satellite -> roads -> inference -> ...)
  /// rather than leaving the UI on an indeterminate spinner.
  final int progress;
  final String? progressMessage;

  bool get isTerminal => status == 'done' || status == 'error' || status == 'not_found';
}
