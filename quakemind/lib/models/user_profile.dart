/// Which of the two portals a logged-in user belongs to -- mirrors the
/// backend's `role: str = "survivor" # "survivor" | "responder"` field on
/// UserRegisterRequest/UserLoginRequest (QuakeMindBackend/fastapi_app.py).
enum UserRole { responder, survivor }

UserRole userRoleFromString(String? value) {
  switch (value) {
    case 'responder':
      return UserRole.responder;
    case 'survivor':
    default:
      return UserRole.survivor;
  }
}

String userRoleToString(UserRole role) {
  switch (role) {
    case UserRole.responder:
      return 'responder';
    case UserRole.survivor:
      return 'survivor';
  }
}

/// Mirrors the `user` object returned by /api/auth/login and
/// /api/auth/register (QuakeMindBackend/fastapi_app.py `auth_login` /
/// `auth_register`).
class UserProfile {
  const UserProfile({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.city,
    this.unit,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      role: userRoleFromString(json['role'] as String?),
      city: json['city'] as String?,
      unit: json['unit'] as String?,
    );
  }

  final String id;
  final String name;
  final String email;
  final UserRole role;
  final String? city;
  final String? unit;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'role': userRoleToString(role),
        if (city != null) 'city': city,
        if (unit != null) 'unit': unit,
      };
}

/// Mirrors the top-level shape of the /api/auth/login and
/// /api/auth/register responses: {status, message, token, user}.
class AuthResult {
  const AuthResult({required this.user, required this.token});

  factory AuthResult.fromJson(Map<String, dynamic> json) {
    return AuthResult(
      user: UserProfile.fromJson(json['user'] as Map<String, dynamic>? ?? const {}),
      token: json['token'] as String? ?? '',
    );
  }

  final UserProfile user;
  final String token;
}
