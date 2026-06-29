import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

final navigatorKey = GlobalKey<NavigatorState>();
const backendUrl = 'https://cslb1vf6s48f99qk99x5a8b1.187.127.135.148.sslip.io';
const langs = [
  ['en', 'English'], ['hi', 'हिन्दी'], ['te', 'తెలుగు'], ['ta', 'தமிழ்'], ['kn', 'ಕನ್ನಡ'],
  ['ml', 'മലയാളം'], ['mr', 'मराठी'], ['bn', 'বাংলা'], ['gu', 'ગુજરાતી'], ['ur', 'اردو'],
  ['ar', 'العربية'], ['es', 'Español'], ['fr', 'Français'], ['de', 'Deutsch'],
  ['zh-CN', '中文'], ['ja', '日本語'], ['ru', 'Русский'], ['pt', 'Português'],
];
String fmtTime(int s) => '${s ~/ 60}:${(s % 60).toString().padLeft(2, '0')}';

void main() {
  final binding = WidgetsFlutterBinding.ensureInitialized();
  // keep the green KL splash visible until the app UI has loaded
  FlutterNativeSplash.preserve(widgetsBinding: binding);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Color(0xFFFFFFFF),
    statusBarIconBrightness: Brightness.dark,
    statusBarBrightness: Brightness.light,
  ));
  runApp(const KLStudentApp());
}

class KLStudentApp extends StatelessWidget {
  const KLStudentApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'KL Student',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: const Color(0xFFC8102E),
        scaffoldBackgroundColor: const Color(0xFFFFFFFF),
      ),
      home: const WebShell(),
    );
  }
}

class WebShell extends StatefulWidget {
  const WebShell({super.key});
  @override
  State<WebShell> createState() => _WebShellState();
}

class _WebShellState extends State<WebShell> {
  late final WebViewController _controller;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setUserAgent('Mozilla/5.0 (Linux; Android 12; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36')
      ..setBackgroundColor(const Color(0xFFFFFFFF))
      ..enableZoom(false)
      ..addJavaScriptChannel('PlayVideo', onMessageReceived: (msg) {
        String id = msg.message.trim();
        List<dynamic> tr = const [];
        try {
          final data = jsonDecode(msg.message);
          id = (data['id'] ?? '').toString().trim();
          final t = data['transcript'];
          if (t != null && t.toString().isNotEmpty) {
            tr = jsonDecode(t.toString()) as List<dynamic>;
          }
        } catch (_) {/* not JSON → treat the message as a bare video id */}
        if (id.isNotEmpty) {
          navigatorKey.currentState?.push(
            MaterialPageRoute(builder: (_) => VideoPage(videoId: id, transcript: tr)),
          );
        }
      })
      ..setNavigationDelegate(NavigationDelegate(
        onPageFinished: (_) {
          setState(() => _loading = false);
          FlutterNativeSplash.remove();
        },
        onNavigationRequest: (req) async {
          // Open top-level external links (e.g. "Watch on YouTube") in the real
          // browser / YouTube app instead of replacing the in-app WebView.
          // The embedded YouTube <iframe> is a sub-frame, so it is NOT affected.
          if (req.isMainFrame &&
              (req.url.startsWith('http://') || req.url.startsWith('https://'))) {
            final uri = Uri.parse(req.url);
            if (await canLaunchUrl(uri)) {
              await launchUrl(uri, mode: LaunchMode.externalApplication);
            }
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
      ))
      ..loadFlutterAsset('assets/www/index.html');
    // let YouTube / HTML5 video play inline without requiring a programmatic gesture
    if (_controller.platform is AndroidWebViewController) {
      (_controller.platform as AndroidWebViewController).setMediaPlaybackRequiresUserGesture(false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        top: true,
        bottom: false,
        child: Stack(
          children: [
            WebViewWidget(controller: _controller),
            if (_loading)
              const Center(
                child: CircularProgressIndicator(color: Color(0xFFC8102E)),
              ),
          ],
        ),
      ),
    );
  }
}

/// Native in-app YouTube player screen (opened when a video is tapped).
class VideoPage extends StatefulWidget {
  final String videoId;
  final List<dynamic> transcript; // [[seconds, text], ...]
  const VideoPage({super.key, required this.videoId, this.transcript = const []});
  @override
  State<VideoPage> createState() => _VideoPageState();
}

class _VideoPageState extends State<VideoPage> {
  late final YoutubePlayerController _yc = YoutubePlayerController(
    initialVideoId: widget.videoId,
    flags: const YoutubePlayerFlags(autoPlay: true, mute: false),
  );
  final ScrollController _scroll = ScrollController();
  List<List<dynamic>> _orig = []; // original (English)
  List<List<dynamic>> _lines = []; // current (maybe translated)
  int _cur = -1;
  String _lang = 'en';
  bool _translating = false;

  static const _red = Color(0xFFC8102E);

  @override
  void initState() {
    super.initState();
    _orig = widget.transcript
        .where((e) => e is List && e.length >= 2)
        .map<List<dynamic>>((e) => [(e[0] as num).toInt(), e[1].toString()])
        .toList();
    _lines = _orig;
    _yc.addListener(_sync);
  }

  void _sync() {
    if (!mounted || !_yc.value.isReady || _lines.isEmpty) return;
    final pos = _yc.value.position.inSeconds;
    int idx = -1;
    for (int i = 0; i < _lines.length; i++) {
      if (_lines[i][0] <= pos) {
        idx = i;
      } else {
        break;
      }
    }
    if (idx != _cur) {
      setState(() => _cur = idx);
      if (idx >= 0 && _scroll.hasClients) {
        _scroll.animateTo((idx * 64.0).clamp(0, _scroll.position.maxScrollExtent),
            duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
      }
    }
  }

  Future<void> _setLang(String code) async {
    if (code == 'en') {
      setState(() { _lang = 'en'; _lines = _orig; });
      return;
    }
    setState(() => _translating = true);
    try {
      final res = await http.post(
        Uri.parse('$backendUrl/api/translate'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'lang': code, 'texts': _orig.map((l) => l[1]).toList()}),
      );
      final tx = jsonDecode(res.body)['texts'] as List;
      setState(() {
        _lang = code;
        _lines = List.generate(_orig.length, (i) => [_orig[i][0], (tx[i] ?? _orig[i][1]).toString()]);
      });
    } catch (_) {/* keep original on failure */}
    if (mounted) setState(() => _translating = false);
  }

  @override
  void dispose() {
    _yc.removeListener(_sync);
    _yc.dispose();
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return YoutubePlayerBuilder(
      player: YoutubePlayer(controller: _yc, showVideoProgressIndicator: true, progressIndicatorColor: _red),
      builder: (context, player) => Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: _red,
          foregroundColor: Colors.white,
          title: const Text('Video lecture'),
          actions: [
            if (_orig.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _lang,
                    dropdownColor: Colors.white,
                    iconEnabledColor: Colors.white,
                    selectedItemBuilder: (c) => langs
                        .map((l) => Align(alignment: Alignment.center,
                            child: Text(l[1], style: const TextStyle(color: Colors.white))))
                        .toList(),
                    items: langs
                        .map((l) => DropdownMenuItem(value: l[0],
                            child: Text(l[1], style: const TextStyle(color: Colors.black87))))
                        .toList(),
                    onChanged: (v) { if (v != null) _setLang(v); },
                  ),
                ),
              ),
          ],
        ),
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            player,
            if (_orig.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                child: Row(children: [
                  const Icon(Icons.subtitles, size: 18, color: _red),
                  const SizedBox(width: 6),
                  const Text('Transcript', style: TextStyle(fontWeight: FontWeight.w600)),
                  if (_translating)
                    const Padding(padding: EdgeInsets.only(left: 10),
                        child: SizedBox(width: 14, height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2, color: _red))),
                ]),
              ),
            Expanded(
              child: _orig.isEmpty
                  ? const Center(
                      child: Padding(padding: EdgeInsets.all(24),
                          child: Text('No transcript available for this video.',
                              style: TextStyle(color: Colors.black54))))
                  : ListView.builder(
                      controller: _scroll,
                      padding: const EdgeInsets.fromLTRB(12, 0, 12, 24),
                      itemCount: _lines.length,
                      itemBuilder: (c, i) {
                        final on = i == _cur;
                        return InkWell(
                          onTap: () => _yc.seekTo(Duration(seconds: _lines[i][0])),
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            decoration: BoxDecoration(
                                color: on ? const Color(0xFFFFF0F2) : null,
                                borderRadius: BorderRadius.circular(12)),
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
                            margin: const EdgeInsets.symmetric(vertical: 2),
                            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              SizedBox(width: 46,
                                  child: Text(fmtTime(_lines[i][0]),
                                      style: const TextStyle(color: _red, fontWeight: FontWeight.w700, fontSize: 12))),
                              Expanded(
                                  child: Text(_lines[i][1],
                                      style: TextStyle(fontSize: 14, height: 1.4,
                                          fontWeight: on ? FontWeight.w600 : FontWeight.w400,
                                          color: on ? Colors.black : Colors.black87))),
                            ]),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
