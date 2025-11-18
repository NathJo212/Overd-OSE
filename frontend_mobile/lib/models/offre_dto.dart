class OffreDTO {
  final int? id;
  final String? titre;
  final String? description;
  final String? date_debut;
  final String? date_fin;
  final String? progEtude;
  final String? lieuStage;
  final String? remuneration;
  final String? dateLimite;
  final String? nomEntreprise;

  OffreDTO({
    this.id,
    this.titre,
    this.description,
    this.date_debut,
    this.date_fin,
    this.progEtude,
    this.lieuStage,
    this.remuneration,
    this.dateLimite,
    this.nomEntreprise,
  });

  factory OffreDTO.fromJson(Map<String, dynamic> json) {
    final idValue = json['id'];
    final id = idValue is int
        ? idValue
        : (idValue is double
              ? idValue.toInt()
              : (idValue is String ? int.tryParse(idValue) : null));

    // nomEntreprise provient de l'objet employeurDTO.nomEntreprise
    String? nomEntreprise;
    try {
      final emp = json['employeurDTO'];
      if (emp is Map<String, dynamic>) {
        nomEntreprise = emp['nomEntreprise']?.toString();
      }
    } catch (_) {
      nomEntreprise = null;
    }

    return OffreDTO(
      id: id,
      titre: json['titre']?.toString(),
      description: json['description']?.toString(),
      date_debut: json['date_debut']?.toString(),
      date_fin: json['date_fin']?.toString(),
      progEtude: json['progEtude']?.toString(),
      lieuStage: json['lieuStage']?.toString(),
      remuneration: json['remuneration']?.toString(),
      dateLimite: json['dateLimite']?.toString(),
      nomEntreprise: nomEntreprise,
    );
  }
}
