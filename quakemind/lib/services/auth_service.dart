import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/user_profile.dart';
import 'bridge_client.dart';

class AuthUnavailableException extends BridgeUnavailableException {
  const AuthUnavailableException({
    required super.message,
    required super.instructions,
    super.bridgeBaseUrl,
    super.lastError,
  });
}

const _authUnavailable = AuthUnavailableException(
  message: 'Kimlik dogrulama sunucusuna ulasilamadi.',
  instructions: [
    'Backend IP ayarini kontrol edin (Panel > Sunucu Ayari).',
    'Telefon ve bilgisayarin ayni agda (hotspot) oldugundan emin olun.',
  ],
);

class AuthService {
  const AuthService();

  static const _httpClient = BridgeHttpClient(
    configuredBaseUrl: '',
    defaultPort: 8000,
  );
  static const _userKey = 'qm_auth_user';
  static const _tokenKey = 'qm_auth_token';

  Future<AuthResult> login({
    required String email,
    required String password,
    String? role,
  }) async {
    final json = await _httpClient.postJson(
      endpoint: '/api/auth/login',
      payload: {
        'email': email,
        'password': password,
        if (role != null) 'role': role,
      },
      unavailableException: _authUnavailable,
    );
    final result = AuthResult.fromJson(json);
    await _persist(result);
    return result;
  }

  Future<AuthResult> register({
    required String name,
    required String email,
    required String password,
    required String role,
    String? city,
    String? unit,
  }) async {
    final json = await _httpClient.postJson(
      endpoint: '/api/auth/register',
      payload: {
        'name': name,
        'email': email,
        'password': password,
        'role': role,
        if (city != null) 'city': city,
        if (unit != null) 'unit': unit,
      },
      unavailableException: _authUnavailable,
    );
    final result = AuthResult.fromJson(json);
    await _persist(result);
    return result;
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userKey);
    await prefs.remove(_tokenKey);
  }

  Future<AuthResult?> restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    final userRaw = prefs.getString(_userKey);
    final token = prefs.getString(_tokenKey);
    if (userRaw == null || token == null) return null;
    try {
      final user = UserProfile.fromJson(
        jsonDecode(userRaw) as Map<String, dynamic>,
      );
      return AuthResult(user: user, token: token);
    } catch (_) {
      return null;
    }
  }

  Future<void> _persist(AuthResult result) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(result.user.toJson()));
    await prefs.setString(_tokenKey, result.token);
  }
}
