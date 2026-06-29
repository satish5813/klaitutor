import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:youtube_player_iframe/youtube_player_iframe.dart';

final navigatorKey = GlobalKey<NavigatorState>();

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
        final id = msg.message.trim();
        if (id.isNotEmpty) {
          navigatorKey.currentState?.push(
            MaterialPageRoute(builder: (_) => VideoPage(videoId: id)),
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
  const VideoPage({super.key, required this.videoId});
  @override
  State<VideoPage> createState() => _VideoPageState();
}

class _VideoPageState extends State<VideoPage> {
  late final YoutubePlayerController _yc = YoutubePlayerController.fromVideoId(
    videoId: widget.videoId,
    autoPlay: true,
    params: const YoutubePlayerParams(showFullscreenButton: true),
  );

  @override
  void dispose() {
    _yc.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return YoutubePlayerScaffold(
      controller: _yc,
      aspectRatio: 16 / 9,
      builder: (context, player) => Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: const Color(0xFFC8102E),
          foregroundColor: Colors.white,
          title: const Text('Video lecture'),
        ),
        body: Center(child: player),
      ),
    );
  }
}
