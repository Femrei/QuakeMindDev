import 'dart:ui';

import 'package:flutter/material.dart';

import '../../models/user_profile.dart';
import '../../services/auth_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_widgets.dart';
import '../../widgets/ip_config_dialog.dart';

class _DemoAccount {
  const _DemoAccount(this.email, this.name, this.unit);
  final String email;
  final String name;
  final String unit;
}

const _demoResponders = [
  _DemoAccount('saha@quakemind.gov.tr', 'Afet Saha Ekibi', 'Arama Kurtarma Lideri'),
  _DemoAccount('saha2@quakemind.gov.tr', 'Zeynep Arslan', 'AKUT Operatoru'),
  _DemoAccount('saha3@quakemind.gov.tr', 'Mehmet Demir', 'IHA & Uydu Operatoru'),
  _DemoAccount('saha4@quakemind.gov.tr', 'Elif Kaya', 'UMKE Saglik Ekibi'),
  _DemoAccount('saha5@quakemind.gov.tr', 'Burak Ozturk', 'Itfaiye Arama Kurtarma'),
];

const _demoSurvivors = [
  _DemoAccount('afetzede@quakemind.gov.tr', 'Afetzede Vatandas', 'Sivil'),
  _DemoAccount('afetzede2@quakemind.gov.tr', 'Ali Yildiz', 'Sivil'),
  _DemoAccount('afetzede3@quakemind.gov.tr', 'Ayse Sahin', 'Sivil'),
];

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _auth = AuthController.instance;

  bool _isRegisterTab = false;
  UserRole _selectedRole = UserRole.responder;

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController(text: 'password123');
  final _cityController = TextEditingController(text: 'Hatay');

  bool _loading = false;
  String? _errorMessage;
  String? _successMessage;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
      _successMessage = null;
    });
    try {
      if (_isRegisterTab) {
        if (_nameController.text.trim().isEmpty) {
          throw Exception('Lutfen ad soyad girin.');
        }
        await _auth.register(
          name: _nameController.text.trim(),
          email: _emailController.text.trim(),
          password: _passwordController.text.isEmpty
              ? 'password123'
              : _passwordController.text,
          role: userRoleToString(_selectedRole),
          city: _cityController.text.trim(),
        );
      } else {
        final email = _emailController.text.trim().isEmpty
            ? (_selectedRole == UserRole.responder
                ? 'saha@quakemind.gov.tr'
                : 'afetzede@quakemind.gov.tr')
            : _emailController.text.trim();
        await _auth.login(
          email: email,
          password: _passwordController.text.isEmpty
              ? 'password123'
              : _passwordController.text,
          role: userRoleToString(_selectedRole),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _demoLogin(_DemoAccount account, UserRole role) async {
    setState(() {
      _loading = true;
      _errorMessage = null;
      _successMessage = null;
    });
    try {
      await _auth.login(
        email: account.email,
        password: 'password123',
        role: userRoleToString(role),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          const Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppTheme.bg, Color(0xFF0D1526), Color(0xFF0A1220)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
            ),
          ),
          Positioned(
            right: -70,
            top: -60,
            child: IgnorePointer(
              child: Container(
                width: 240,
                height: 240,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.accent.withValues(alpha: 0.14),
                ),
              ),
            ),
          ),
          Positioned(
            left: -60,
            bottom: 60,
            child: IgnorePointer(
              child: Container(
                width: 200,
                height: 200,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.teal.withValues(alpha: 0.10),
                ),
              ),
            ),
          ),
          SafeArea(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
              children: [
                Center(
                  child: Container(
                    width: 68,
                    height: 68,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF3276E8), Color(0xFF4CC9F0)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF3276E8).withValues(alpha: 0.35),
                          blurRadius: 24,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.shield_moon_outlined,
                      color: Colors.white,
                      size: 34,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'QUAKEMIND AFET KIMLIK MERKEZI',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 6),
                Text(
                  'PostGIS & AI Destekli Afet Ikaz & Operasyon Platformu',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 24),
                SectionCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildTabSwitch(),
                      const SizedBox(height: 20),
                      _buildRoleSelector(),
                      const SizedBox(height: 18),
                      if (_errorMessage != null) ...[
                        _buildBanner(
                          _errorMessage!,
                          const Color(0xFFE15B64),
                          Icons.error_outline,
                        ),
                        const SizedBox(height: 12),
                      ],
                      if (_successMessage != null) ...[
                        _buildBanner(
                          _successMessage!,
                          AppTheme.teal,
                          Icons.check_circle_outline,
                        ),
                        const SizedBox(height: 12),
                      ],
                      if (_isRegisterTab) ...[
                        TextField(
                          controller: _nameController,
                          decoration: const InputDecoration(
                            labelText: 'Ad Soyad',
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],
                      TextField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: InputDecoration(
                          labelText: 'E-Posta Adresi',
                          hintText: _selectedRole == UserRole.responder
                              ? 'saha@quakemind.gov.tr'
                              : 'afetzede@quakemind.gov.tr',
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _passwordController,
                        obscureText: true,
                        decoration: const InputDecoration(labelText: 'Sifre'),
                      ),
                      if (_isRegisterTab) ...[
                        const SizedBox(height: 12),
                        TextField(
                          controller: _cityController,
                          decoration: const InputDecoration(
                            labelText: 'Sehir / Il',
                          ),
                        ),
                      ],
                      const SizedBox(height: 18),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          onPressed: _loading ? null : _submit,
                          icon: _loading
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Icon(Icons.arrow_forward),
                          label: Text(
                            _isRegisterTab
                                ? 'Hesabimi Olustur ve Basla'
                                : 'Giris Yap ve Devam Et',
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton.icon(
                          onPressed: () async {
                            await showDialog(
                              context: context,
                              builder: (_) => const IpConfigDialog(),
                            );
                          },
                          icon: const Icon(Icons.settings_ethernet, size: 16),
                          label: const Text('Sunucu Ayari'),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'DEMO HESAPLARLA HIZLI GIRIS (TEST AMACLI)',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.4,
                  ),
                ),
                const SizedBox(height: 12),
                CardMasonryGrid(
                  children: [
                    _buildDemoGroup(
                      'SAHA EKIBI HESAPLARI',
                      const Color(0xFF3276E8),
                      _demoResponders,
                      UserRole.responder,
                    ),
                    _buildDemoGroup(
                      'VATANDAS HESAPLARI',
                      const Color(0xFFE15B64),
                      _demoSurvivors,
                      UserRole.survivor,
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  'Tum demo hesaplarin sifresi: password123',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBanner(String text, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        border: Border.all(color: color.withValues(alpha: 0.4)),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(text, style: TextStyle(color: color, fontSize: 12.5)),
          ),
        ],
      ),
    );
  }

  Widget _buildTabSwitch() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppTheme.ink,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.glassStroke),
      ),
      child: Row(
        children: [
          Expanded(
            child: _tabButton('Giris Yap', !_isRegisterTab, () {
              setState(() {
                _isRegisterTab = false;
                _errorMessage = null;
              });
            }),
          ),
          Expanded(
            child: _tabButton('Kayit Ol', _isRegisterTab, () {
              setState(() {
                _isRegisterTab = true;
                _errorMessage = null;
              });
            }),
          ),
        ],
      ),
    );
  }

  Widget _tabButton(String label, bool active, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: active ? const Color(0xFF3276E8) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            color: active ? Colors.white : AppTheme.textSecondary,
            fontWeight: FontWeight.w800,
            fontSize: 12.5,
          ),
        ),
      ),
    );
  }

  Widget _buildRoleSelector() {
    return Row(
      children: [
        Expanded(
          child: _roleCard(
            'SAHA EKIBI & KOMUTA',
            'AFAD, arama kurtarma, IHA & uydu operatoru.',
            UserRole.responder,
            const Color(0xFF3276E8),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _roleCard(
            'VATANDAS & AFETZEDE',
            'Tek tikla SOS, guvenli toplanma alani.',
            UserRole.survivor,
            const Color(0xFFE15B64),
          ),
        ),
      ],
    );
  }

  Widget _roleCard(String title, String subtitle, UserRole role, Color color) {
    final selected = _selectedRole == role;
    return GestureDetector(
      onTap: () => setState(() => _selectedRole = role),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: selected ? color.withValues(alpha: 0.16) : AppTheme.panel,
          border: Border.all(
            color: selected ? color : AppTheme.glassStroke,
            width: selected ? 1.4 : 1,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.w900,
                      fontSize: 11,
                      letterSpacing: 0.2,
                    ),
                  ),
                ),
                if (selected) Icon(Icons.check_circle, size: 16, color: color),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              subtitle,
              style: const TextStyle(fontSize: 10.5, color: AppTheme.textSecondary),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDemoGroup(
    String label,
    Color color,
    List<_DemoAccount> accounts,
    UserRole role,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 2, bottom: 6),
          child: Text(
            label,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w900,
              fontSize: 10.5,
              letterSpacing: 0.3,
            ),
          ),
        ),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: accounts.map((account) {
            return SizedBox(
              width: 170,
              child: GestureDetector(
                onTap: _loading ? null : () => _demoLogin(account, role),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 6, sigmaY: 6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.10),
                        border: Border.all(color: color.withValues(alpha: 0.35)),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            account.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: color,
                              fontWeight: FontWeight.w800,
                              fontSize: 12,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            account.unit,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 10,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}
