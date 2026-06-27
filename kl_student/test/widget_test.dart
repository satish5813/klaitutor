import 'package:flutter_test/flutter_test.dart';
import 'package:kl_student/main.dart';

void main() {
  testWidgets('App builds', (WidgetTester tester) async {
    await tester.pumpWidget(const KLStudentApp());
    expect(find.byType(WebShell), findsOneWidget);
  });
}
