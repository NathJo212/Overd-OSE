import 'dart:convert';

import 'package:http/http.dart' as http;

class AuthResult {
  final bool success;
  final String? token;
  final String? error;

  AuthResult({required this.success, this.token, this.error});
}

class EtudiantService {
  static const String _baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:8080',
  );

  static Future<AuthResult> login(String email, String password) async {
    try {
      final uri = Uri.parse('$_baseUrl/OSE/login');
      final resp = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      if (resp.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(resp.body);
        // Essayer plusieurs clés possibles pour le token
        String? token;
        if (data.containsKey('token')) token = data['token'];
        if (token == null && data.containsKey('accessToken'))
          token = data['accessToken'];
        if (token == null && data.containsKey('jwt')) token = data['jwt'];
        return AuthResult(success: true, token: token);
      }

      if (resp.statusCode == 401) {
        try {
          final Map<String, dynamic> e = jsonDecode(resp.body);
          final msg = e['message'] ?? e['error'] ?? resp.body;
          return AuthResult(success: false, error: msg.toString());
        } catch (_) {
          return AuthResult(success: false, error: 'Unauthorized');
        }
      }

      return AuthResult(
        success: false,
        error: 'Erreur serveur (${resp.statusCode})',
      );
    } catch (e) {
      return AuthResult(success: false, error: e.toString());
    }
  }

}
