import 'package:flutter/material.dart';
import '../../widgets/auth_form.dart';
import '../../services/auth_service.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({Key? key}) : super(key: key);

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  void _submitAuthForm(String email, String password) async {
    // Afficher un indicateur de progression léger via SnackBar
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Connexion...')));

    final result = await AuthService.login(email, password);

    ScaffoldMessenger.of(context).hideCurrentSnackBar();

    if (result.success) {
      print("login marche");
    } else {
      final message = result.error ?? 'Erreur d\'authentification';
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).primaryColor,
      body: AuthFormWidget(_submitAuthForm),
    );
  }
}
