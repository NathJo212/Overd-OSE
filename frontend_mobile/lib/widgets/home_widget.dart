import 'package:flutter/material.dart';
import 'package:frontend_mobile/pages/auth_screen.dart';
import 'package:frontend_mobile/services/etudiant_service.dart';
import 'package:frontend_mobile/models/offre_dto.dart';

class HomeWidget extends StatefulWidget {
  const HomeWidget({Key? key}) : super(key: key);

  @override
  State<HomeWidget> createState() => _HomeWidgetState();
}

class _HomeWidgetState extends State<HomeWidget> {
  bool _loading = true;
  List<OffreDTO> _offres = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadOffres();
  }

  Future<void> _loadOffres() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final listes = await EtudiantService.getOffres();
      setState(() {
        _offres = listes;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  void _logout() async {
    final result = await EtudiantService.logout();

    if (result) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => const AuthScreen()),
      );
    } else {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("error")));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Déconnexion',
            onPressed: () {
              _logout();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadOffres,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
            ? ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Text('Erreur: $_error'),
                  ),
                ],
              )
            : _offres.isEmpty
            ? ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: const [
                  SizedBox(height: 200),
                  Center(child: Text('Aucune offre disponible')),
                ],
              )
            : ListView.builder(
                itemCount: _offres.length,
                itemBuilder: (context, index) {
                  final o = _offres[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12.0,
                      vertical: 6.0,
                    ),
                    child: Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(8),
                        child: Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      o.titre ?? 'Sans titre',
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    if (o.employeurNomEntreprise != null ||
                                        o.employeurTelephone != null ||
                                        o.employeurContact != null)
                                      Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          if (o.employeurNomEntreprise != null)
                                            Text(
                                              'Employeur: ${o.employeurNomEntreprise}',
                                              style: TextStyle(
                                                fontSize: 13,
                                                fontWeight: FontWeight.w600,
                                                color: Theme.of(
                                                  context,
                                                ).primaryColor,
                                              ),
                                            ),
                                        ],
                                      ),
                                    const SizedBox(height: 6),
                                    if ((o.description ?? '').isNotEmpty)
                                      Text(
                                        o.description!,
                                        style: const TextStyle(fontSize: 14),
                                      ),
                                    const SizedBox(height: 6),
                                    if (o.dateLimite != null)
                                      Text(
                                        'Date limite d\'application: ${o.dateLimite}',
                                        textAlign: TextAlign.right,
                                        style: const TextStyle(fontSize: 12),
                                      ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }
}
