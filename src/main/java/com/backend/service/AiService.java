package com.backend.service;

import com.backend.modele.*;
import com.backend.persistence.*;
import com.backend.ai.*;
import org.springframework.stereotype.Service;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;

import java.util.*;
import java.util.regex.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AiService {
    private final OffreRepository offreRepository;
    private final EntenteStageRepository ententeStageRepository;
    private final CandidatureRepository candidatureRepository;
    private final ConvocationEntrevueRepository convocationEntrevueRepository;
    private final EvaluationEtudiantParEmployeurRepository evalEtudiantRepository;
    private final EvaluationMilieuStageParProfesseurRepository evalMilieuRepository;
    private final NotificationRepository notificationRepository;
    private final ChatClient chatClient;
    private final AiPrompts prompts;

    // Générateurs de contexte
    private final OfferContextBuilder offerBuilder;
    private final EntenteContextBuilder ententeBuilder;
    private final CandidatureContextBuilder candidatureBuilder;
    private final ConvocationContextBuilder convocationBuilder;
    private final EvalEtudiantContextBuilder evalEtuBuilder;
    private final EvalMilieuContextBuilder evalMilieuBuilder;

    private static final Pattern OFFER_ID_PATTERN = Pattern.compile("(?i)(?:offre(?:\\s*de\\s*stage)?|offrestage)[^0-9]{0,40}(?:#|n°|numero|numéro|no|id)?\\s*(\\d+)");
    private static final Pattern ENTENTE_ID_PATTERN = Pattern.compile("(?i)entente[^0-9]{0,40}(?:#|n°|numero|numéro|no|id)?\\s*(\\d+)");
    private static final Pattern CANDIDATURE_ID_PATTERN = Pattern.compile("(?i)candidature[^0-9]{0,40}(?:#|n°|numero|numéro|no|id)?\\s*(\\d+)");
    private static final Pattern CONVOCATION_ID_PATTERN = Pattern.compile("(?i)convocation[^0-9]{0,40}(?:#|n°|numero|numéro|no|id)?\\s*(\\d+)");
    private static final Pattern EVAL_ETUDIANT_ID_PATTERN = Pattern.compile("(?i)(?:évaluation|evaluation)[^\n]{0,40}etudiant[^0-9]{0,40}(?:#|n°|numero|numéro|no|id)?\\s*(\\d+)");
    private static final Pattern EVAL_MILIEU_ID_PATTERN = Pattern.compile("(?i)(?:évaluation|evaluation)[^\n]{0,40}milieu[^0-9]{0,40}(?:#|n°|numero|numéro|no|id)?\\s*(\\d+)");
    private static final Pattern LIST_OFFRES_PATTERN = Pattern.compile(
            "(?i)(?:liste|toutes?|all|every|list|show|give(?:\\s+me)?)\\s+(?:.*?\\b)?(?:offre|offer)s?(?:\\s+de\\s+stage|\\s+de\\s+stages|\\s+internship|\\s+internships)?"
    );
    private static final Pattern LIST_ENTENTES_PATTERN = Pattern.compile("(?i)(?:liste|toutes?|all).*ententes?");
    private static final Pattern LIST_CANDIDATURES_PATTERN = Pattern.compile("(?i)(?:liste|toutes?|all).*candidatures?");
    private static final Pattern LIST_CONVOCATIONS_PATTERN = Pattern.compile("(?i)(?:liste|toutes?|all).*convocations?");
    private static final Pattern LIST_EVAL_ETU_PATTERN = Pattern.compile("(?i)(?:liste|toutes?|all).*(?:évaluations|evaluations).*(etudiant)");
    private static final Pattern LIST_EVAL_MIL_PATTERN = Pattern.compile("(?i)(?:liste|toutes?|all).*(?:évaluations|evaluations).*(milieu)");

    private static final Pattern GENERIC_OFFER_QUERY = Pattern.compile("(?i)\\b(offre|offer)\\b");

    private static final int MAX_LIST = 5;

    public AiService(OffreRepository offreRepository,
                     EntenteStageRepository ententeStageRepository,
                     CandidatureRepository candidatureRepository,
                     ConvocationEntrevueRepository convocationEntrevueRepository,
                     EvaluationEtudiantParEmployeurRepository evalEtudiantRepository,
                     EvaluationMilieuStageParProfesseurRepository evalMilieuRepository,
                     NotificationRepository notificationRepository,
                     ChatClient chatClient,
                     AiPrompts prompts,
                     OfferContextBuilder offerBuilder,
                     EntenteContextBuilder ententeBuilder,
                     CandidatureContextBuilder candidatureBuilder,
                     ConvocationContextBuilder convocationBuilder,
                     EvalEtudiantContextBuilder evalEtuBuilder,
                     EvalMilieuContextBuilder evalMilieuBuilder) {
        this.offreRepository = offreRepository;
        this.ententeStageRepository = ententeStageRepository;
        this.candidatureRepository = candidatureRepository;
        this.convocationEntrevueRepository = convocationEntrevueRepository;
        this.evalEtudiantRepository = evalEtudiantRepository;
        this.evalMilieuRepository = evalMilieuRepository;
        this.notificationRepository = notificationRepository;
        this.chatClient = chatClient;
        this.prompts = prompts;
        this.offerBuilder = offerBuilder;
        this.ententeBuilder = ententeBuilder;
        this.candidatureBuilder = candidatureBuilder;
        this.convocationBuilder = convocationBuilder;
        this.evalEtuBuilder = evalEtuBuilder;
        this.evalMilieuBuilder = evalMilieuBuilder;
    }

    // Normalise une chaîne de statut : minuscule, retire espaces, tirets bas, accents
    private String normalizeStatus(String status) {
        if (status == null) return "";
        String s = status.toLowerCase(Locale.ROOT)
            .replaceAll("[ _]", "")
            .replaceAll("é|è|ê|ë", "e")
            .replaceAll("à|â|ä", "a")
            .replaceAll("î|ï", "i")
            .replaceAll("ô|ö", "o")
            .replaceAll("ù|û|ü", "u")
            .replaceAll("ç", "c");
        return s;
    }

    // Mappe les synonymes de statut vers le statut canonique pour une offre
    private String canonicalOffreStatus(String input) {
        String norm = normalizeStatus(input);
        if (norm.matches("(enattente|attente|pending)")) return "enattente";
        if (norm.matches("(approuve|approved)")) return "approuve";
        if (norm.matches("(refuse|refused|rejected)")) return "refuse";
        return norm;
    }

    // Retourne le bon libellé d'entité (singulier/pluriel) dans la bonne langue
    private String getEntityLabel(String entityKey, long count, boolean fr) {
        Map<String, String> enLabels = Map.of(
            "offre", count > 1 ? "offers" : "offer",
            "candidature", count > 1 ? "applications" : "application",
            "entente", count > 1 ? "agreements" : "agreement",
            "convocation", count > 1 ? "interviews" : "interview",
            "évaluation", count > 1 ? "evaluations" : "evaluation",
            "evaluation", count > 1 ? "evaluations" : "evaluation",
            "notification", count > 1 ? "notifications" : "notification"
        );
        Map<String, String> frLabels = Map.of(
            "offre", count > 1 ? "offres" : "offre",
            "candidature", count > 1 ? "candidatures" : "candidature",
            "entente", count > 1 ? "ententes" : "entente",
            "convocation", count > 1 ? "convocations" : "convocation",
            "évaluation", count > 1 ? "évaluations" : "évaluation",
            "evaluation", count > 1 ? "évaluations" : "évaluation",
            "notification", count > 1 ? "notifications" : "notification"
        );
        if (fr) {
            return frLabels.getOrDefault(entityKey, entityKey + (count > 1 ? "s" : ""));
        } else {
            return enLabels.getOrDefault(entityKey, entityKey + (count > 1 ? "s" : ""));
        }
    }

    // Normalise la clé d'entité à partir de la question
    private String extractEntityKey(String question) {
        String q = question.toLowerCase(Locale.ROOT);
        if (q.matches(".*\\b(offre|offer|offres|offers)\\b.*")) return "offre";
        if (q.matches(".*\\b(candidature|application|candidatures|applications)\\b.*")) return "candidature";
        if (q.matches(".*\\b(entente|agreement|ententes|agreements)\\b.*")) return "entente";
        if (q.matches(".*\\b(convocation|interview|convocations|interviews)\\b.*")) return "convocation";
        if (q.matches(".*\\b(évaluation|evaluation|évaluations|evaluations)\\b.*")) return "évaluation";
        return null;
    }

    private enum QueryType { COUNT, LIST, DETAIL, GREETING, FALLBACK }

    // Détecte le type de requête
    private QueryType detectQueryType(String question) {
        String q = question == null ? "" : question.toLowerCase();
        if (OFFER_ID_PATTERN.matcher(q).find() || ENTENTE_ID_PATTERN.matcher(q).find() || CANDIDATURE_ID_PATTERN.matcher(q).find()) return QueryType.DETAIL;
        if (q.matches(".*\\b(bonjour|salut|hello|hi)\\b.*")) return QueryType.GREETING;
        if (q.matches(".*\\b(combien|how many|nombre|y a-t-il|il y a)\\b.*")) return QueryType.COUNT;
        if (q.matches(".*\\b(liste|toutes|all|every|show|give|affiche|montre|list)\\b.*")) return QueryType.LIST;
        if (q.matches(".*\\b(id|numéro|numero|n°|no|#)\\b.*")) return QueryType.DETAIL;
        return QueryType.FALLBACK;
    }

    public String answer(String question) {
        return answer(question, null);
    }

    public String answer(String question, String acceptLanguage) {
        boolean fr = detectFrench(question, acceptLanguage);
        QueryType queryType = detectQueryType(question);
        String entityKey = extractEntityKey(question);
        StatusAccessor<Candidature> candidatureStatus = c -> c.getStatut() != null ? c.getStatut().toString().toLowerCase() : "";
        StatusAccessor<Offre> offreStatus = o -> o.getStatutApprouve() != null ? o.getStatutApprouve().toString().toLowerCase() : "";
        StatusAccessor<EntenteStage> ententeNoStatus = e -> "";
        StatusAccessor<ConvocationEntrevue> convocationNoStatus = c -> "";
        StatusAccessor<EvaluationEtudiantParEmployeur> evalEtudiantNoStatus = e -> "";
        StatusAccessor<Notification> notificationNoStatus = n -> "";
        Map<String, EntityQuery<?>> entityMap = Map.of(
            "candidature", new EntityQuery<>(candidatureRepository.findAll(), candidatureStatus),
            "offre", new EntityQuery<>(offreRepository.findAll(), offreStatus),
            "entente", new EntityQuery<>(ententeStageRepository.findAll(), ententeNoStatus),
            "convocation", new EntityQuery<>(convocationEntrevueRepository.findAll(), convocationNoStatus),
            "évaluation", new EntityQuery<>(evalEtudiantRepository.findAll(), evalEtudiantNoStatus),
            "evaluation", new EntityQuery<>(evalEtudiantRepository.findAll(), evalEtudiantNoStatus),
            "notification", new EntityQuery<>(notificationRepository.findAll(), notificationNoStatus)
        );

        if (queryType == QueryType.GREETING) {
            return fr ? "Bonjour ! Comment puis-je vous aider ?" : "Hello! How can I assist you today?";
        }
        if (queryType == QueryType.COUNT && entityKey != null) {
            EntityQuery<?> entityQuery = entityMap.get(entityKey);
            long count = entityQuery != null ? entityQuery.all.size() : 0;
            String entityLabel = getEntityLabel(entityKey, count, fr);
            return fr ? ("Il y a " + count + " " + entityLabel + ".") : ("There are " + count + " " + entityLabel + ".");
        }
        if (queryType == QueryType.DETAIL) {
            Optional<String> contextOpt = trySingleEntityContext(question);
            if (contextOpt.isEmpty()) {
                return fr ? "Aucune entité trouvée avec cet identifiant." : "No entity found with this ID.";
            }
            return invokeModel(fr, List.of(contextOpt.get()), question, QueryType.DETAIL);
        }
        if (queryType == QueryType.LIST && entityKey != null) {
            List<String> listContexts = tryListContexts(question);
            if (!listContexts.isEmpty()) {
                return invokeModel(fr, listContexts, question, QueryType.LIST);
            } else {
                return fr ? "Aucune donnée à lister." : "No data to list.";
            }
        }
        Optional<String> contextOpt = trySingleEntityContext(question);
        if (contextOpt.isPresent()) {
            return invokeModel(fr, List.of(contextOpt.get()), question, QueryType.DETAIL);
        }
        List<String> listContexts = tryListContexts(question);
        if (!listContexts.isEmpty()) {
            return invokeModel(fr, listContexts, question, QueryType.LIST);
        }
        return basicNoContext(fr, question != null ? question : "(User message missing)");
    }

    // Appelle le modèle avec le contexte et le type de requête
    private String invokeModel(boolean fr, List<String> contexts, String question, QueryType queryType) {
        String instruction = "";
        switch (queryType) {
            case LIST:
                instruction = fr ? "Réponds par une liste détaillée, chaque offre sur une ligne séparée." : "Reply with a detailed list, each offer on a separate line.";
                break;
            case DETAIL:
                instruction = fr ? "Réponds avec tous les détails de l'offre ou de l'entité demandée." : "Reply with all details of the requested offer or entity.";
                break;
            case COUNT:
                instruction = fr ? "Réponds uniquement avec le nombre d'entités." : "Reply only with the number of entities.";
                break;
            case GREETING:
                instruction = fr ? "Réponds avec une salutation appropriée." : "Reply with an appropriate greeting.";
                break;
            default:
                instruction = fr ? "Réponds de façon utile selon le contexte." : "Reply helpfully according to the context.";
        }
        String system = getLanguageInstruction(fr) + " " + prompts.systemCore(fr) + " " + instruction + (contexts.isEmpty() ? (fr? " " + prompts.missingContext(true): " " + prompts.missingContext(false)) : "");
        String joined = String.join("\n", contexts);
        SystemMessage systemMessage = new SystemMessage(system + "\nCONTEXT:\n" + joined);
        UserMessage userMessage = new UserMessage(question);
        String response = chatClient.prompt()
                .messages(systemMessage, userMessage)
                .call()
                .content();
        return postProcess(response, fr, joined, queryType);
    }

    // Nettoie et formate la réponse du modèle
    private String postProcess(String raw, boolean fr, String ctx, QueryType queryType) {
        if (queryType == QueryType.DETAIL) {
            raw = raw == null ? "" : raw;
            raw = raw.replaceAll("(?i)je\\s+ne\\s+peux\\s+pas\\s+acc[èe]?[cd]er?\\s+aux?\\s+donn[ée]?[e]?s?[^.]*\\.\\s*", "");
            raw = raw.replaceAll("(?i)je\\s+n'?ai\\s+pas\\s+acc[èe]?[cd]es?\\s+aux?\\s+donn[ée]?[e]?s?[^.]*\\.\\s*", "");
            raw = raw.replaceAll("(?i)i\\s+(?:do\\s+not|don't)\\s+have\\s+access[^.]*\\.\\s*", "");
            raw = raw.replaceAll("(?i)je\\s+ne\\s+peux\\s+pas\\s+accder\\s+aux\\s+donnes[^.]*\\.\\s*", "");
            raw = raw.replaceAll("(?i)je\\s+n'?ai\\s+pas\\s+accdes\\s+aux\\s+donnes[^.]*\\.\\s*", "");
            raw = raw.trim();
            String detailLabel = fr ? "Détails de l'entité :\n" : "Entity details:\n";
            return detailLabel + raw;
        }
        if (raw == null || raw.isBlank()) {
            return fr ? "(Aucune réponse)" + (ctx!=null?"\nDonnées:\n"+ctx:"") : "(No answer)" + (ctx!=null?"\nData:\n"+ctx:"");
        }
        raw = raw.replaceAll("(?i)je\\s+ne\\s+peux\\s+pas\\s+acc[èe]?[cd]er?\\s+aux?\\s+donn[ée]?[e]?s?[^.]*\\.\\s*", "");
        raw = raw.replaceAll("(?i)je\\s+n'?ai\\s+pas\\s+acc[èe]?[cd]es?\\s+aux?\\s+donn[ée]?[e]?s?[^.]*\\.\\s*", "");
        raw = raw.replaceAll("(?i)i\\s+(?:do\\s+not|don't)\\s+have\\s+access[^.]*\\.\\s*", "");
        raw = raw.replaceAll("(?i)je\\s+ne\\s+peux\\s+pas\\s+accder\\s+aux\\s+donnes[^.]*\\.\\s*", "");
        raw = raw.replaceAll("(?i)je\\s+n'?ai\\s+pas\\s+accdes\\s+aux\\s+donnes[^.]*\\.\\s*", "");
        raw = raw.trim();
        if (queryType == QueryType.LIST && !raw.startsWith("- ") && !raw.contains("\n- ")) {
            String[] lines = raw.split("\n");
            StringBuilder sb = new StringBuilder();
            for (String line : lines) {
                if (!line.isBlank()) sb.append("- ").append(line.trim()).append("\n");
            }
            return sb.toString().trim();
        }
        return raw.isBlank() ? (fr?"(Nettoyé vide)":"(Cleaned empty)") : raw;
    }

    // Construit le contexte pour une entité unique à partir de la question
    private Optional<String> trySingleEntityContext(String q) {
        Matcher m = OFFER_ID_PATTERN.matcher(q);
        if (m.find()) {
            return offreRepository.findById(Long.parseLong(m.group(1))).map(offerBuilder::build);
        }
        m = ENTENTE_ID_PATTERN.matcher(q);
        if (m.find()) {
            return ententeStageRepository.findById(Long.parseLong(m.group(1))).map(ententeBuilder::build);
        }
        m = CANDIDATURE_ID_PATTERN.matcher(q);
        if (m.find()) {
            return candidatureRepository.findById(Long.parseLong(m.group(1))).map(candidatureBuilder::build);
        }
        m = CONVOCATION_ID_PATTERN.matcher(q);
        if (m.find()) {
            return convocationEntrevueRepository.findById(Long.parseLong(m.group(1))).map(convocationBuilder::build);
        }
        m = EVAL_ETUDIANT_ID_PATTERN.matcher(q);
        if (m.find()) {
            return evalEtudiantRepository.findById(Long.parseLong(m.group(1))).map(evalEtuBuilder::build);
        }
        m = EVAL_MILIEU_ID_PATTERN.matcher(q);
        if (m.find()) {
            return evalMilieuRepository.findById(Long.parseLong(m.group(1))).map(evalMilieuBuilder::build);
        }
        return Optional.empty();
    }

    // Construit le contexte pour une liste d'entités à partir de la question
    private List<String> tryListContexts(String q) {
        List<String> contexts = new ArrayList<>();
        if (LIST_OFFRES_PATTERN.matcher(q).find() || GENERIC_OFFER_QUERY.matcher(q).find() || q.toLowerCase().matches(".*\\b(offre|offer|stage|internship|stages|internships)\\b.*")) {
            contexts.addAll(offreRepository.findAll().stream().limit(MAX_LIST).map(offerBuilder::build).toList());
        }
        String lowerQ = q.toLowerCase();
        boolean isPendingQuery = lowerQ.matches(".*\\b(en cours|pending|in progress|in process|en attente|attente)\\b.*");
        if (LIST_CANDIDATURES_PATTERN.matcher(q).find() || lowerQ.matches(".*\\b(candidature|candidatures|application|applications|en cours|pending|en attente|in progress|in process)\\b.*")) {
            List<Candidature> candidatures = candidatureRepository.findAll();
            if (isPendingQuery) {
                contexts.addAll(candidatures.stream()
                    .filter(c -> {
                        String status = c.getStatut() != null ? c.getStatut().toString().toLowerCase() : "";
                        return status.contains("en cours") || status.contains("pending") || status.contains("in progress") || status.contains("in process") || status.contains("en attente") || status.contains("attente");
                    })
                    .limit(MAX_LIST)
                    .map(candidatureBuilder::build)
                    .toList());
            } else {
                contexts.addAll(candidatures.stream().limit(MAX_LIST).map(candidatureBuilder::build).toList());
            }
        }
        if (LIST_ENTENTES_PATTERN.matcher(q).find()) {
            contexts.addAll(ententeStageRepository.findAll().stream().limit(MAX_LIST).map(ententeBuilder::build).toList());
        }
        if (LIST_CONVOCATIONS_PATTERN.matcher(q).find()) {
            contexts.addAll(convocationEntrevueRepository.findAll().stream().limit(MAX_LIST).map(convocationBuilder::build).toList());
        }
        if (LIST_EVAL_ETU_PATTERN.matcher(q).find()) {
            contexts.addAll(evalEtudiantRepository.findAll().stream().limit(MAX_LIST).map(evalEtuBuilder::build).toList());
        }
        if (LIST_EVAL_MIL_PATTERN.matcher(q).find()) {
            contexts.addAll(evalMilieuRepository.findAll().stream().limit(MAX_LIST).map(evalMilieuBuilder::build).toList());
        }
        return contexts;
    }

    // Retourne l'instruction de langue pour le modèle
    private String getLanguageInstruction(boolean fr) {
        return fr ? "Réponds toujours en français." : "Always reply in English.";
    }

    // Détecte si la question ou l'en-tête Accept-Language est en français
    private boolean detectFrench(String q, String acceptLanguage) {
        // Priorité au paramètre explicite reçu (ex: header Accept-Language ou param envoyé par le frontend)
        if (acceptLanguage != null && !acceptLanguage.isBlank()) {
            String al = acceptLanguage.toLowerCase(Locale.ROOT);
            return al.startsWith("fr");
        }
        // Si aucune langue explicite fournie, utiliser un fallback simple basé sur quelques mots-clés
        if (q == null || q.isBlank()) return true; // par défaut francais si message vide/absent
        String text = q.toLowerCase(Locale.ROOT);
        return text.matches(".*\\b(bonjour|salut|merci|svp|offre|stage|entente|candidature|convocation|évaluation|evaluation)\\b.*");
    }

    // Classe utilitaire pour les requêtes génériques d'entité
    private static class EntityQuery<T> {
        public final List<T> all;
        public final StatusAccessor<T> statusAccessor;
        public EntityQuery(List<T> all, StatusAccessor<T> statusAccessor) {
            this.all = all;
            this.statusAccessor = statusAccessor;
        }
    }
    @FunctionalInterface
    private interface StatusAccessor<T> {
        String getStatus(T obj);
    }

    // Réponse de secours pour les requêtes sans contexte
    private String basicNoContext(boolean fr, String question) {
        String instruction = fr ? "Réponds de façon utile selon le contexte." : "Reply helpfully according to the context.";
        String system = getLanguageInstruction(fr) + " " + prompts.systemCore(fr) + " " + instruction + " " + (fr ? prompts.missingContext(true) : prompts.missingContext(false));
        SystemMessage systemMessage = new SystemMessage(system + "\nCONTEXT:\n");
        UserMessage userMessage = new UserMessage(question);
        String response = chatClient.prompt()
                .messages(systemMessage, userMessage)
                .call()
                .content();
        return postProcess(response, fr, "", QueryType.FALLBACK);
    }
}
