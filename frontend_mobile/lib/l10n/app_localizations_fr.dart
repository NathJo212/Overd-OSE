// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get helloWorld => 'Bonjour le monde!';

  @override
  String get appuse => 'Cet appareil utilise';

  @override
  String get localplat => 'Local from the Platform is';

  @override
  String get hardcodedtext => 'Voici un Text qui n\'est pas hardcodé';

  @override
  String get achat => 'Un achat de';

  @override
  String get itis => 'Il est';

  @override
  String get logoutTooltip => 'Déconnexion';

  @override
  String errorMessage(Object error) {
    return 'Erreur: $error';
  }

  @override
  String get noOffers => 'Aucune offre disponible';

  @override
  String get untitled => 'Sans titre';

  @override
  String limitDate(Object date) {
    return 'Limite\n$date';
  }

  @override
  String periodRange(Object debut, Object sep, Object fin) {
    return 'Période: $debut$sep$fin';
  }

  @override
  String get authTitle => '📚 Overd-OSE';

  @override
  String get authSubtitle => 'Accédez à votre espace étudiant';

  @override
  String get emailLabel => 'Adresse courriel';

  @override
  String get passwordLabel => 'Mot de passe';

  @override
  String get minChars => 'Au moins 7 caractères.';

  @override
  String get signInButton => 'Connexion';

  @override
  String get logoutError => 'Erreur: impossible de se déconnecter';

  @override
  String get refusedAccess => 'Accès refusé';

  @override
  String get authentificationError => 'Erreur d\'authentification';

  @override
  String get connexionInProgress => 'Connexion...';
}
