import 'package:flutter/material.dart';
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
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Déconnexion',
            onPressed: () {
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
                      )
                    ],
                  )
                : _offres.isEmpty
                    ? ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: const [
                          SizedBox(height: 200),
                          Center(child: Text('Aucune offre disponible'))
                        ],
                      )
                    : ListView.builder(
                        itemCount: _offres.length,
                        itemBuilder: (context, index) {
                          final o = _offres[index];
                          return ListTile(
                            title: Text(o.titre ?? 'Sans titre'),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if ((o.description ?? '').isNotEmpty) Text(o.description!),
                                const SizedBox(height: 6),
                                if (o.employeurNomEntreprise != null)
                                  Text('Employeur: ${o.employeurNomEntreprise}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                                if (o.employeurTelephone != null)
                                  Text('Téléphone: ${o.employeurTelephone}', style: const TextStyle(fontSize: 12)),
                                if (o.employeurContact != null)
                                  Text('Contact: ${o.employeurContact}', style: const TextStyle(fontSize: 12)),
                              ],
                            ),
                            trailing: o.dateLimite != null ? Text('Date limite\n${o.dateLimite}', textAlign: TextAlign.right, style: const TextStyle(fontSize: 11)) : null,
                            isThreeLine: true,
                          );
                        },
                      ),
      ),
    );
  }
}
