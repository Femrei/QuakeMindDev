import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';

import '../services/auth_controller.dart';
import '../services/chat_service.dart';
import '../theme/app_theme.dart';

/// Floating collapsible team-chat bubble, mirroring the web dashboard's
/// bottom-right widget. Only meaningful for responder/admin accounts --
/// callers should only mount this inside the responder shell.
class TeamChatOverlay extends StatefulWidget {
  const TeamChatOverlay({super.key});

  @override
  State<TeamChatOverlay> createState() => _TeamChatOverlayState();
}

class _TeamChatOverlayState extends State<TeamChatOverlay> {
  static const _service = ChatService();

  bool _open = false;
  List<ChatMessage> _messages = [];
  String? _lastSeenId;
  int _unread = 0;
  Timer? _timer;
  final _draftController = TextEditingController();
  final _scrollController = ScrollController();
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _poll();
    _timer = Timer.periodic(const Duration(seconds: 5), (_) => _poll());
  }

  @override
  void dispose() {
    _timer?.cancel();
    _draftController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _poll() async {
    final token = AuthController.instance.token;
    if (token == null) return;
    try {
      final latest = await _service.fetchMessages(token: token, limit: 50);
      if (!mounted) return;
      final sameLength = latest.length == _messages.length;
      setState(() {
        if (latest.isNotEmpty) {
          final newestId = latest.last.id;
          if (_open) {
            _lastSeenId = newestId;
            _unread = 0;
          } else if (_lastSeenId != null && newestId != _lastSeenId) {
            final seenIndex = latest.indexWhere((m) => m.id == _lastSeenId);
            _unread = seenIndex >= 0 ? latest.length - 1 - seenIndex : latest.length;
          } else if (_lastSeenId == null) {
            _lastSeenId = newestId;
          }
        }
        _messages = latest;
      });
      if (_open && !sameLength) {
        WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
      }
    } catch (_) {
      // Silent -- polling failures shouldn't disrupt the rest of the app.
    }
  }

  void _scrollToBottom() {
    if (!_scrollController.hasClients) return;
    _scrollController.animateTo(
      _scrollController.position.maxScrollExtent,
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeOut,
    );
  }

  Future<void> _send() async {
    final text = _draftController.text.trim();
    final token = AuthController.instance.token;
    if (text.isEmpty || token == null || _sending) return;
    setState(() => _sending = true);
    try {
      final sent = await _service.send(token: token, text: text);
      if (!mounted) return;
      setState(() {
        _messages = [..._messages, sent];
        _lastSeenId = sent.id;
        _draftController.clear();
      });
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
    } catch (_) {
      // Leave the draft so the user can retry.
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthController.instance.user;
    return Positioned(
      right: 16,
      bottom: 16,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (_open) _buildPanel(user?.id),
          const SizedBox(height: 10),
          _buildBubble(),
        ],
      ),
    );
  }

  Widget _buildBubble() {
    return GestureDetector(
      onTap: () {
        setState(() {
          _open = !_open;
          if (_open) {
            _unread = 0;
            if (_messages.isNotEmpty) _lastSeenId = _messages.last.id;
            WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
          }
        });
      },
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.panelHigh,
              border: Border.all(color: AppTheme.neonCyan.withValues(alpha: 0.55)),
              boxShadow: [
                const BoxShadow(color: Color(0x66000000), blurRadius: 18, offset: Offset(0, 8)),
                BoxShadow(color: AppTheme.neonCyan.withValues(alpha: 0.22), blurRadius: 16),
              ],
            ),
            child: Icon(
              _open ? Icons.close : Icons.forum_outlined,
              color: Colors.white,
            ),
          ),
          if (!_open && _unread > 0)
            Positioned(
              top: -2,
              right: -2,
              child: Container(
                padding: const EdgeInsets.all(4),
                constraints: const BoxConstraints(minWidth: 20, minHeight: 20),
                decoration: const BoxDecoration(
                  color: AppTheme.danger,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Text(
                  _unread > 9 ? '9+' : '$_unread',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildPanel(String? myId) {
    final user = AuthController.instance.user;
    return ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(
          width: 300,
          height: 380,
          decoration: BoxDecoration(
            color: AppTheme.panelHigh.withValues(alpha: 0.92),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: AppTheme.glassStroke),
            boxShadow: const [
              BoxShadow(color: Color(0x66000000), blurRadius: 24, offset: Offset(0, 12)),
            ],
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: AppTheme.glassStroke)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Ekip Sohbeti',
                            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                          ),
                          if (user != null)
                            Text(
                              '${user.name}${user.unit != null ? " - ${user.unit}" : ""}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 10.5,
                                color: AppTheme.textSecondary,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: _messages.isEmpty
                    ? const Center(
                        child: Padding(
                          padding: EdgeInsets.all(20),
                          child: Text(
                            'Henuz mesaj yok. Ekibinle konusmaya basla.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 11.5, color: AppTheme.textSecondary),
                          ),
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(12),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final message = _messages[index];
                          final mine = message.senderId == myId;
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: Column(
                              crossAxisAlignment:
                                  mine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                              children: [
                                if (!mine)
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: 3, left: 4),
                                    child: Text(
                                      message.senderUnit != null
                                          ? '${message.senderName} - ${message.senderUnit}'
                                          : message.senderName,
                                      style: const TextStyle(
                                        fontSize: 10,
                                        color: AppTheme.textSecondary,
                                      ),
                                    ),
                                  ),
                                Container(
                                  constraints: const BoxConstraints(maxWidth: 220),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 9,
                                  ),
                                  decoration: BoxDecoration(
                                    color: mine
                                        ? AppTheme.accent.withValues(alpha: 0.82)
                                        : AppTheme.sand,
                                    borderRadius: BorderRadius.only(
                                      topLeft: const Radius.circular(14),
                                      topRight: const Radius.circular(14),
                                      bottomLeft: Radius.circular(mine ? 14 : 4),
                                      bottomRight: Radius.circular(mine ? 4 : 14),
                                    ),
                                  ),
                                  child: Text(
                                    message.text,
                                    style: const TextStyle(fontSize: 12.5, color: Colors.white),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: const BoxDecoration(
                  border: Border(top: BorderSide(color: AppTheme.glassStroke)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _draftController,
                        style: const TextStyle(fontSize: 12.5),
                        decoration: const InputDecoration(
                          isDense: true,
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          hintText: 'Mesaj yaz...',
                        ),
                        onSubmitted: (_) => _send(),
                      ),
                    ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: _send,
                      child: Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: AppTheme.accent,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        alignment: Alignment.center,
                        child: _sending
                            ? const SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(Icons.send, color: Colors.white, size: 16),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
