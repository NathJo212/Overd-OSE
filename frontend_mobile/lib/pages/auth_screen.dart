import 'package:flutter/material.dart';
import 'package:frontend_mobile/pages/home.dart';
import '../widgets/auth_form.dart';
import '../services/etudiant_service.dart';
import 'package:frontend_mobile/l10n/app_localizations.dart';

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
    ).showSnackBar(SnackBar(content: Text(AppLocalizations.of(context)!.connexionInProgress)));

    final result = await EtudiantService.login(email, password);

    ScaffoldMessenger.of(context).hideCurrentSnackBar();

    if (result.success) {
      Navigator.of(
        context,
      ).pushReplacement(MaterialPageRoute(builder: (context) => const home()));
    } else {
      // Map service error codes to localized messages
      final loc = AppLocalizations.of(context)!;
      String message;
      switch (result.error) {
        case 'refusedAccess':
          message = loc.refusedAccess;
          break;
        case 'authentificationError':
          message = loc.authentificationError;
          break;
        case 'connexionInProgress':
          message = loc.connexionInProgress;
          break;
        default:
          message = loc.errorMessage(result.error ?? '');
      }

      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
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
