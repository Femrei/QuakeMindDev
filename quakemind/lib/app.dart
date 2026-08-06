import 'package:flutter/material.dart';

import 'models/user_profile.dart';
import 'screens/auth/login_screen.dart';
import 'screens/responder/responder_shell.dart';
import 'screens/splash_screen.dart';
import 'screens/survivor/survivor_shell.dart';
import 'services/auth_controller.dart';
import 'theme/app_theme.dart';

class QuakeMindApp extends StatefulWidget {
  const QuakeMindApp({super.key});

  @override
  State<QuakeMindApp> createState() => _QuakeMindAppState();
}

class _QuakeMindAppState extends State<QuakeMindApp> {
  final _auth = AuthController.instance;

  @override
  void initState() {
    super.initState();
    _auth.bootstrap();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'QuakeMind Mobile',
      theme: AppTheme.theme,
      home: ListenableBuilder(
        listenable: _auth,
        builder: (context, _) {
          if (!_auth.ready) return const SplashScreen();
          if (_auth.user == null) return const LoginScreen();
          return _auth.user!.role == UserRole.survivor
              ? const SurvivorShell()
              : const ResponderShell();
        },
      ),
    );
  }
}
