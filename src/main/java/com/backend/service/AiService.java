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
    private static final Pattern NOTIFICATION_WORD_PATTERN = Pattern.compile("(?i)notification(s)?");

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

    public String answer(String question) {
        return answer(question, null);
    }

    public String answer(String question, String acceptLanguage) {
        boolean fr = detectFrench(question, acceptLanguage);
        // Tentative de récupération ciblée par entité
        Optional<String> contextOpt = trySingleEntityContext(question);
        if (contextOpt.isPresent()) {
            return invokeModel(fr, List.of(contextOpt.get()), question);
        }
        // Listes
        List<String> listContexts = tryListContexts(question);
        if (!listContexts.isEmpty()) {
            return invokeModel(fr, listContexts, question);
        }
        // Résumé des notifications
        if (NOTIFICATION_WORD_PATTERN.matcher(question).find()) {
            long total = notificationRepository.count();
            String ctx = "{\n  \"type\": \"notificationsSummary\",\n  \"total\": " + total + "\n}";
            return invokeModel(fr, List.of(ctx), question);
        }
        // Exemple d'offre générique
        if (GENERIC_OFFER_QUERY.matcher(question).find()) {
            List<Offre> all = offreRepository.findAll();
            if (!all.isEmpty()) {
                String sample = offerBuilder.build(all.get(0));
                return invokeModel(fr, List.of(sample), question);
            }
        }
        // Secours sans contexte
        return basicNoContext(fr, question);
    }

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

    private List<String> tryListContexts(String q) {
        List<String> contexts = new ArrayList<>();
        if (LIST_OFFRES_PATTERN.matcher(q).find()) {
            contexts.addAll(offreRepository.findAll().stream().limit(MAX_LIST).map(offerBuilder::build).toList());
        }
        if (LIST_ENTENTES_PATTERN.matcher(q).find()) {
            contexts.addAll(ententeStageRepository.findAll().stream().limit(MAX_LIST).map(ententeBuilder::build).toList());
        }
        if (LIST_CANDIDATURES_PATTERN.matcher(q).find()) {
            contexts.addAll(candidatureRepository.findAll().stream().limit(MAX_LIST).map(candidatureBuilder::build).toList());
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

    private String invokeModel(boolean fr, List<String> contexts, String question) {
        String system = prompts.systemCore(fr) + (contexts.isEmpty() ? (fr? " " + prompts.missingContext(true): " " + prompts.missingContext(false)) : "");
        String joined = String.join("\n", contexts);
        SystemMessage systemMessage = new SystemMessage(system + "\nCONTEXT:\n" + joined);
        UserMessage userMessage = new UserMessage(question);
        String response = chatClient.prompt()
                .messages(systemMessage, userMessage)
                .call()
                .content();
        return postProcess(response, fr, joined);
    }

    private String basicNoContext(boolean fr, String question) {
        SystemMessage sys = new SystemMessage(prompts.systemCore(fr) + " " + prompts.missingContext(fr));
        UserMessage user = new UserMessage(question);
        String out = chatClient.prompt()
                .messages(sys, user)
                .call()
                .content();
        return postProcess(out, fr, null);
    }

    private String postProcess(String raw, boolean fr, String ctx) {
        if (raw == null || raw.isBlank()) {
            return fr ? "(Aucune réponse)" + (ctx!=null?"\nDonnées:\n"+ctx:"") : "(No answer)" + (ctx!=null?"\nData:\n"+ctx:"");
        }
        // Supprimer les hallucinations de refus d'accès (FR/EN) tout en gardant le contenu utile.
        raw = raw
                .replaceFirst("(?is)^(je\\s+ne\\s+peux\\s+pas\\s+acc\\p{L}+[^.]*\\.)\\s*", "")
                .replaceFirst("(?is)^(je\\s+n'?ai\\s+pas\\s+acc\\p{L}+[^.]*\\.)\\s*", "")
                .replaceFirst("(?is)^(i\\s+(?:do\\s+not|don't)\\s+have\\s+access[^.]*\\.)\\s*", "")
                .trim();
        return raw.isBlank() ? (fr?"(Nettoyé vide)":"(Cleaned empty)") : raw;
    }

    private boolean detectFrench(String q, String acceptLanguage) {
        // L'en-tête Accept-Language a priorité
        if (acceptLanguage != null) {
            String al = acceptLanguage.toLowerCase();
            if (al.startsWith("fr")) return true;
            if (al.startsWith("en")) return false;
        }
        String text = q == null ? "" : q.toLowerCase();
        // Aider à déterminer la langue
        String[] frWords = {"bonjour","svp","s'il","salut","merci","liste","toutes","tous","offre","stage","entente","candidature","convocation","évaluation","évaluations","evaluation","avec","toutes"};
        String[] enWords = {"hello","please","list","all","every","show","give","want","offer","contract","application","interview","evaluation"};
        int frHits = 0; int enHits = 0;
        for (String w : frWords) if (text.matches(".*\\b"+Pattern.quote(w)+"\\b.*")) frHits++;
        for (String w : enWords) if (text.matches(".*\\b"+Pattern.quote(w)+"\\b.*")) enHits++;
        boolean hasDiacritics = text.matches(".*[àâäéèêëîïôöùûüç].*");
        if (hasDiacritics && frHits >= enHits) return true;
        if (enHits > frHits) return false;
        if (frHits > enHits) return true;
        return false;
    }
}
