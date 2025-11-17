import 'package:flutter/material.dart';
import 'package:frontend_mobile/l10n/app_localizations.dart';
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context)!.logoutError)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: AppLocalizations.of(context)!.logoutTooltip,
            onPressed: _logout,
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
                    child: Text(
                      AppLocalizations.of(context)!.errorMessage(_error ?? ''),
                    ),
                  ),
                ],
              )
            : _offres.isEmpty
            ? ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  const SizedBox(height: 200),
                  Center(child: Text(AppLocalizations.of(context)!.noOffers)),
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
                        onTap: () {},
                        child: Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      o.titre ??
                                          AppLocalizations.of(
                                            context,
                                          )!.untitled,
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    if (o.nomEntreprise != null)
                                      Text(
                                        o.nomEntreprise!,
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    const SizedBox(height: 6),
                                    if ((o.description ?? '').isNotEmpty)
                                      Text(
                                        o.description!,
                                        maxLines: 3,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontSize: 14),
                                      ),
                                    const SizedBox(height: 8),
                                    Wrap(
                                      spacing: 8,
                                      runSpacing: 4,
                                      children: [
                                        if (o.progEtude != null)
                                          Chip(
                                            label: Text(
                                              o.progEtude!,
                                              style: const TextStyle(
                                                fontSize: 12,
                                              ),
                                            ),
                                            visualDensity:
                                                VisualDensity.compact,
                                          ),
                                        if (o.lieuStage != null)
                                          Chip(
                                            label: Text(
                                              o.lieuStage!,
                                              style: const TextStyle(
                                                fontSize: 12,
                                              ),
                                            ),
                                            visualDensity:
                                                VisualDensity.compact,
                                          ),
                                        if (o.remuneration != null)
                                          Chip(
                                            label: Text(
                                              o.remuneration!,
                                              style: const TextStyle(
                                                fontSize: 12,
                                              ),
                                            ),
                                            visualDensity:
                                                VisualDensity.compact,
                                          ),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    if (o.date_debut != null ||
                                        o.date_fin != null)
                                      Text(
                                        AppLocalizations.of(
                                          context,
                                        )!.periodRange(
                                          o.date_debut ?? '',
                                          (o.date_debut != null &&
                                                  o.date_fin != null)
                                              ? ' — '
                                              : '',
                                          o.date_fin ?? '',
                                        ),
                                        style: const TextStyle(fontSize: 12),
                                      ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Column(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  if (o.dateLimite != null)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 6,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.red.shade50,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        AppLocalizations.of(
                                          context,
                                        )!.limitDate(o.dateLimite ?? ''),
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                          color: Colors.red.shade700,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                ],
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
