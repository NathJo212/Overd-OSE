class OffreDTO {
  final int? id;
  final String? titre;
  final String? description;
  final String? dateLimite; // ISO date string
  final String? employeurNomEntreprise;
  final String? employeurTelephone;
  final String? employeurContact;
  final String? employeurEmail;

  OffreDTO({
    this.id,
    this.titre,
    this.description,
    this.dateLimite,
    this.employeurNomEntreprise,
    this.employeurTelephone,
    this.employeurContact,
    this.employeurEmail,
  });

  factory OffreDTO.fromJson(Map<String, dynamic> json) {
    String? nomEntreprise;
    String? telephone;
    String? contact;
    String? email;
    try {
      final emp = json['employeurDTO'];
      if (emp is Map<String, dynamic>) {
        nomEntreprise = emp['nomEntreprise'] ?? emp['nom'] ?? emp['nomEmployeur'] ?? emp['companyName'] ?? emp['raisonSociale'] ?? emp['entreprise'];
        telephone = emp['telephone']?.toString();
        contact = emp['contact']?.toString();
        email = emp['email']?.toString();
      }
    } catch (_) {
      nomEntreprise = null;
      telephone = null;
      contact = null;
      email = null;
    }

    return OffreDTO(
      id: json['id'] is int ? json['id'] : (json['id'] is double ? (json['id'] as double).toInt() : null),
      titre: json['titre']?.toString(),
      description: json['description']?.toString(),
      dateLimite: json['dateLimite']?.toString() ?? json['date_limite']?.toString(),
      employeurNomEntreprise: nomEntreprise,
      employeurTelephone: telephone,
      employeurContact: contact,
      employeurEmail: email,
    );
  }
}
