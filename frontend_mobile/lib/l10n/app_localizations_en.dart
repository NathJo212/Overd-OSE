// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get helloWorld => 'Hello world!';

  @override
  String get appuse => 'This device uses';

  @override
  String get localplat => 'Local from the Platform is';

  @override
  String get hardcodedtext => 'This is a Text that is not hardcoded';

  @override
  String get achat => 'A purchase of';

  @override
  String get itis => 'It is';

  @override
  String get logoutTooltip => 'Logout';

  @override
  String errorMessage(Object error) {
    return 'Error: $error';
  }

  @override
  String get noOffers => 'No offers available';

  @override
  String get untitled => 'Untitled';

  @override
  String limitDate(Object date) {
    return 'Deadline\n$date';
  }

  @override
  String periodRange(Object debut, Object sep, Object fin) {
    return 'Period: $debut$sep$fin';
  }

  @override
  String get authTitle => '📚 Overd-OSE';

  @override
  String get authSubtitle => 'Access your student space';

  @override
  String get emailLabel => 'Email address';

  @override
  String get passwordLabel => 'Password';

  @override
  String get minChars => 'At least 7 characters.';

  @override
  String get signInButton => 'Sign in';

  @override
  String get logoutError => 'Error: unable to logout';

  @override
  String get refusedAccess => 'Access denied';

  @override
  String get authentificationError => 'Authentication error';

  @override
  String get connexionInProgress => 'Connection...';
}
