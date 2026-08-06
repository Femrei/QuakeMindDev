import 'package:flutter/foundation.dart';

import '../models/user_profile.dart';
import 'auth_service.dart';

/// App-wide auth state. A plain [ChangeNotifier] singleton is enough here --
/// no state-management package is in pubspec.yaml and the app has a single
/// logged-in-user concept, so adding one would just be indirection.
class AuthController extends ChangeNotifier {
  AuthController._();

  static final AuthController instance = AuthController._();

  static const _service = AuthService();

  UserProfile? user;
  String? token;
  bool ready = false;

  Future<void> bootstrap() async {
    final restored = await _service.restoreSession();
    user = restored?.user;
    token = restored?.token;
    ready = true;
    notifyListeners();
  }

  Future<void> login({
    required String email,
    required String password,
    String? role,
  }) async {
    final result = await _service.login(
      email: email,
      password: password,
      role: role,
    );
    user = result.user;
    token = result.token;
    notifyListeners();
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    required String role,
    String? city,
    String? unit,
  }) async {
    final result = await _service.register(
      name: name,
      email: email,
      password: password,
      role: role,
      city: city,
      unit: unit,
    );
    user = result.user;
    token = result.token;
    notifyListeners();
  }

  Future<void> logout() async {
    await _service.logout();
    user = null;
    token = null;
    notifyListeners();
  }
}
