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
        if (token == null && data.containsKey('accessToken')) {
          token = data['accessToken'];
        }
        if (token == null && data.containsKey('jwt')) token = data['jwt'];

        if (token == null) {
          return AuthResult(success: false, error: 'Accès refusé');
        }

        // Décoder le payload du JWT pour vérifier le rôle/authorities
        try {
          final parts = token.split('.');
          if (parts.length < 2) {
            return AuthResult(success: false, error: 'Accès refusé');
          }
          String payloadPart = parts[1];

          // Ajouter le padding nécessaire pour base64Url
          final mod = payloadPart.length % 4;
          if (mod == 2)
            payloadPart += '==';
          else if (mod == 3)
            payloadPart += '=';
          else if (mod == 1) {
            return AuthResult(success: false, error: 'Accès refusé');
          }

          final decoded = utf8.decode(base64Url.decode(payloadPart));
          final Map<String, dynamic> payload = jsonDecode(decoded);

          String? userType;

          if (payload.containsKey('authorities') &&
              payload['authorities'] is List) {
            final List a = payload['authorities'] as List;
            if (a.isNotEmpty) {
              final first = a[0];
              if (first is Map && first.containsKey('authority')) {
                userType = first['authority']?.toString();
              } else {
                userType = first.toString();
              }
            }
          } else if (payload.containsKey('roles') && payload['roles'] is List) {
            final List r = payload['roles'] as List;
            if (r.isNotEmpty) userType = r[0].toString();
          } else if (payload.containsKey('role')) {
            userType = payload['role']?.toString();
          }

          if (userType == null) {
            return AuthResult(success: false, error: 'Accès refusé');
          }

          final lowered = userType.toLowerCase();
          final isEtudiant = lowered.contains('etudiant');

          if (!isEtudiant) {
            return AuthResult(success: false, error: 'Accès refusé');
          }

          // Autorisé : conserver le token
          _token = token;
          return AuthResult(success: true, token: token);
        } catch (e) {
          return AuthResult(success: false, error: 'Accès refusé');
        }
      }

      return AuthResult(success: false, error: 'Accès refusé');
    } catch (e) {
      return AuthResult(success: false, error: "Accès refusé");
    }
  }

  static Future<bool> logout() async {
    try {
      final uri = Uri.parse('$_baseUrl/OSE/logout');
      final headers = {'Content-Type': 'application/json'};
      if (_token != null && _token!.isNotEmpty) {
        headers['Authorization'] = 'Bearer $_token';
      }
      final resp = await http.post(uri, headers: headers);

      if (resp.statusCode == 200) {
        _token = null;
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

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
        if (body is Map<String, dynamic>) {
          final list = body['offres'] ?? body['data'] ?? body['result'];
          if (list is List) {
            return list
                .map((e) => OffreDTO.fromJson(Map<String, dynamic>.from(e)))
                .toList();
          }
        }
        return <OffreDTO>[];
      }

      return <OffreDTO>[];
    } catch (e) {
      return <OffreDTO>[];
    }
  }
}
