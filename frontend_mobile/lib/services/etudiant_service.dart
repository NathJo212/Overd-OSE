import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:frontend_mobile/models/offre_dto.dart';

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
  // Stocke le token JWT après login pour réutilisation dans les appels protégés
  static String? _token;

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
        String? token;
        if (data.containsKey('token')) token = data['token'];
        if (token == null && data.containsKey('accessToken'))
          token = data['accessToken'];
        if (token == null && data.containsKey('jwt')) token = data['jwt'];
        // Sauvegarde le token pour les futurs appels
        _token = token;
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

  /// Récupère la liste des offres approuvées depuis le backend.
  static Future<List<OffreDTO>> getOffres() async {
    try {
      final uri = Uri.parse('$_baseUrl/OSEetudiant/voirOffres');
      final headers = {'Content-Type': 'application/json'};
      if (_token != null && _token!.isNotEmpty) {
        headers['Authorization'] = 'Bearer $_token';
      }
      final resp = await http.get(uri, headers: headers);

      if (resp.statusCode == 200) {
        final dynamic body = jsonDecode(resp.body);
        if (body is List) {
          return body.map((e) {
            if (e is Map<String, dynamic>) return OffreDTO.fromJson(e);
            return OffreDTO.fromJson(Map<String, dynamic>.from(e));
          }).toList();
        }
        // Si le backend renvoie un objet avec une propriété contenant la liste
        if (body is Map<String, dynamic>) {
          final list = body['offres'] ?? body['data'] ?? body['result'];
          if (list is List) {
            return list.map((e) => OffreDTO.fromJson(Map<String, dynamic>.from(e))).toList();
          }
        }
        return <OffreDTO>[];
      }

      // En cas d'erreur, renvoyer une liste vide
      return <OffreDTO>[];
    } catch (e) {
      return <OffreDTO>[];
    }
  }
}
