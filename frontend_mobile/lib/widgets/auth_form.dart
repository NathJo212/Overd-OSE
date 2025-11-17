import 'package:flutter/material.dart';
import 'package:frontend_mobile/l10n/app_localizations.dart';

class AuthFormWidget extends StatefulWidget {
  final void Function(String email, String password) _submitForm;
  const AuthFormWidget(this._submitForm, {super.key});

  @override
  State<AuthFormWidget> createState() => _AuthFormWidgetState();
}

class _AuthFormWidgetState extends State<AuthFormWidget> {
  final _key = GlobalKey<FormState>();
  String _userEmail = "";
  String _userPassword = "";

  void _submit() {
    final isValid = _key.currentState?.validate();
    FocusScope.of(context).unfocus();

    if (isValid ?? false) {
      _key.currentState?.save();

      widget._submitForm(_userEmail.trim(), _userPassword.trim());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 16.0),
          child: Text(
            AppLocalizations.of(context)!.authTitle,
            style: TextStyle(
              fontSize: 34,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(bottom: 16.0),
          child: Text(
            AppLocalizations.of(context)!.authSubtitle,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
        ),
        SizedBox(height: 150),
        Center(
          child: Card(
            margin: EdgeInsets.all(20),
            child: SingleChildScrollView(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Form(
                  key: _key,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      TextFormField(
                        key: ValueKey("email"),
                        keyboardType: TextInputType.emailAddress,
                        decoration: InputDecoration(
                          labelText: AppLocalizations.of(context)!.emailLabel,
                        ),
                        validator: (val) {
                          if (val!.isEmpty || val.length < 8) {
                            return AppLocalizations.of(context)!.minChars;
                          }
                          return null;
                        },
                        onSaved: (value) {
                          _userEmail = value!;
                        },
                      ),
                      TextFormField(
                        decoration: InputDecoration(
                          labelText: AppLocalizations.of(
                            context,
                          )!.passwordLabel,
                        ),
                        key: ValueKey("password"),
                        obscureText: true,
                        validator: (val) {
                          if (val!.isEmpty || val.length < 8) {
                            return AppLocalizations.of(context)!.minChars;
                          }
                          return null;
                        },
                        onSaved: (value) {
                          _userPassword = value!;
                        },
                      ),
                      SizedBox(height: 12),
                      OutlinedButton(
                        onPressed: (() {
                          _submit();
                        }),
                        child: Text(AppLocalizations.of(context)!.signInButton),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
