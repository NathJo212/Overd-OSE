import 'package:flutter/material.dart';
import 'package:frontend_mobile/pages/auth_screen.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        colorScheme: .fromSeed(seedColor: Color.fromARGB(255, 0, 60, 255)),
      ),
      home: AuthScreen(),
    );
  }
}
