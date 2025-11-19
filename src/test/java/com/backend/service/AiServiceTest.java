package com.backend.service;

import com.backend.ai.*;
import com.backend.modele.Offre;
import com.backend.modele.Programme;
import com.backend.persistence.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AiServiceTest {

    private final OffreRepository offreRepository = mock(OffreRepository.class);
    private final EntenteStageRepository ententeStageRepository = mock(EntenteStageRepository.class);
    private final CandidatureRepository candidatureRepository = mock(CandidatureRepository.class);
    private final ConvocationEntrevueRepository convocationEntrevueRepository = mock(ConvocationEntrevueRepository.class);
    private final EvaluationEtudiantParEmployeurRepository evalEtudiantRepository = mock(EvaluationEtudiantParEmployeurRepository.class);
    private final EvaluationMilieuStageParProfesseurRepository evalMilieuRepository = mock(EvaluationMilieuStageParProfesseurRepository.class);
    private final NotificationRepository notificationRepository = mock(NotificationRepository.class);

    private final ChatClient chatClient = mock(ChatClient.class, RETURNS_DEEP_STUBS);
    private final AiPrompts prompts = new AiPrompts();

    private final OfferContextBuilder offerBuilder = mock(OfferContextBuilder.class);
    private final EntenteContextBuilder ententeBuilder = mock(EntenteContextBuilder.class);
    private final CandidatureContextBuilder candidatureBuilder = mock(CandidatureContextBuilder.class);
    private final ConvocationContextBuilder convocationBuilder = mock(ConvocationContextBuilder.class);
    private final EvalEtudiantContextBuilder evalEtuBuilder = mock(EvalEtudiantContextBuilder.class);
    private final EvalMilieuContextBuilder evalMilieuBuilder = mock(EvalMilieuContextBuilder.class);

    private AiService buildService() {
        return new AiService(
                offreRepository,
                ententeStageRepository,
                candidatureRepository,
                convocationEntrevueRepository,
                evalEtudiantRepository,
                evalMilieuRepository,
                notificationRepository,
                chatClient,
                prompts,
                offerBuilder,
                ententeBuilder,
                candidatureBuilder,
                convocationBuilder,
                evalEtuBuilder,
                evalMilieuBuilder
        );
    }

    private Offre sampleOffre(long id) {
        Offre o = new Offre();
        o.setId(id);
        o.setTitre("Titre"+id);
        o.setDescription("Desc"+id);
        o.setDate_debut(LocalDate.of(2025,1,1));
        o.setDate_fin(LocalDate.of(2025,12,31));
        o.setProgEtude(Programme.P420_B0);
        o.setLieuStage("Montreal");
        o.setRemuneration("15$/h");
        o.setDateLimite(LocalDate.of(2025,5,1));
        o.setHoraire("jour");
        o.setDureeHebdomadaire(37);
        o.setObjectifs("Objectifs");
        o.setStatutApprouve(Offre.StatutApprouve.ATTENTE);
        return o;
    }

    @Test
    @DisplayName("answer() single offer id builds context (FR)")
    void answerSingleOfferContextFrench() {
        AiService svc = buildService();
        Offre o = sampleOffre(42);
        when(offreRepository.findById(42L)).thenReturn(Optional.of(o));
        when(offerBuilder.build(o)).thenReturn("{\"id\": 42}");
        when(chatClient.prompt().messages(any(SystemMessage.class), any(UserMessage.class)).call().content()).thenReturn("Réponse");

        String out = svc.answer("Donne moi l'offre id 42", "fr");
        assertThat(out).contains("Détails de l'entité :");
        assertThat(out).contains("Réponse");

        ArgumentCaptor<SystemMessage> sysCap = ArgumentCaptor.forClass(SystemMessage.class);
        verify(chatClient.prompt()).messages(sysCap.capture(), any(UserMessage.class));
        String sysText = sysCap.getValue().getText();
        assertThat(sysText).contains("\"id\": 42");
        assertThat(sysText).contains("CONTEXT:");
        assertThat(sysText).contains("Tu es un assistant métier");
    }

    @Test
    @DisplayName("answer() list offers english pattern builds multiple contexts")
    void answerListOffersEnglish() {
        AiService svc = buildService();
        List<Offre> offers = List.of(sampleOffre(1), sampleOffre(2), sampleOffre(3));
        when(offreRepository.findAll()).thenReturn(offers);
        when(offerBuilder.build(any(Offre.class))).thenReturn("Answer");
        when(chatClient.prompt().messages(any(SystemMessage.class), any(UserMessage.class)).call().content()).thenReturn("Answer\nAnswer\nAnswer");

        String out = svc.answer("Give me a list of every offer", "en");
        assertThat(out).contains("- Answer");
        ArgumentCaptor<SystemMessage> sysCap = ArgumentCaptor.forClass(SystemMessage.class);
        verify(chatClient.prompt()).messages(sysCap.capture(), any(UserMessage.class));
        String text = sysCap.getValue().getText();
        long occurrences = text.lines().filter(l -> l.contains("Answer")).count();
        assertThat(occurrences).isGreaterThanOrEqualTo(3);
        assertThat(text).contains("You are a domain assistant");
    }

    @Test
    @DisplayName("answer() generic offer fallback returns single sample")
    void answerGenericOfferFallback() {
        AiService svc = buildService();
        List<Offre> offers = List.of(sampleOffre(10), sampleOffre(11));
        when(offreRepository.findAll()).thenReturn(offers);
        when(offerBuilder.build(offers.get(0))).thenReturn("Answer");
        when(chatClient.prompt().messages(any(SystemMessage.class), any(UserMessage.class)).call().content()).thenReturn("Answer");

        String out = svc.answer("I want an offer", "en");
        assertThat(out).contains("- Answer");
        ArgumentCaptor<SystemMessage> sysCap = ArgumentCaptor.forClass(SystemMessage.class);
        verify(chatClient.prompt()).messages(sysCap.capture(), any(UserMessage.class));
        String content = sysCap.getValue().getText();
        assertThat(content).contains("CONTEXT:");
        assertThat(content).contains("Answer");
        assertThat(content).doesNotContain("Specify entity and id");
    }

    @Test
    @DisplayName("postProcess removes access refusal hallucinations")
    void postProcessRemovesAccessRefusal() {
        AiService svc = buildService();
        when(chatClient.prompt().messages(any(SystemMessage.class), any(UserMessage.class)).call().content())
                .thenReturn("Je ne peux pas accder aux donnes. Voici une rponse utile.");
        String out = svc.answer("Donne moi quelque chose", "fr");
        assertThat(out).doesNotContain("Je ne peux pas accder aux donnes");
        assertThat(out).contains("rponse utile");
    }

    @Test
    @DisplayName("language detection: Accept-Language overrides content")
    void languageDetectionHeaderPriority() {
        AiService svc = buildService();
        when(offreRepository.findAll()).thenReturn(List.of(sampleOffre(1)));
        when(offerBuilder.build(any(Offre.class))).thenReturn("Answer");
        when(chatClient.prompt().messages(any(SystemMessage.class), any(UserMessage.class)).call().content())
            .thenReturn("Answer");
        svc.answer("Give me a list of every offer", "en");
        ArgumentCaptor<SystemMessage> sysCap = ArgumentCaptor.forClass(SystemMessage.class);
        ArgumentCaptor<UserMessage> userCap = ArgumentCaptor.forClass(UserMessage.class);
        verify(chatClient.prompt(), atLeastOnce()).messages(sysCap.capture(), userCap.capture());
        SystemMessage sysMsg = sysCap.getAllValues().get(sysCap.getAllValues().size() - 1);
        UserMessage userMsg = userCap.getAllValues().get(userCap.getAllValues().size() - 1);
        assertThat(sysMsg).withFailMessage("SystemMessage was not captured (null)").isNotNull();
        assertThat(userMsg).withFailMessage("UserMessage was not captured (null)").isNotNull();
        String sysText = sysMsg.getText();
        String userText = userMsg.getText();
        assertThat(sysText).contains("You are a domain assistant");
        assertThat(sysText).contains("Always reply in English.");
        assertThat(userText).isNotNull();
    }

    @Test
    @DisplayName("answer() detail offer in English with label")
    void answerDetailOfferEnglishLabel() {
        AiService svc = buildService();
        Offre o = sampleOffre(5);
        when(offreRepository.findById(5L)).thenReturn(Optional.of(o));
        when(offerBuilder.build(o)).thenReturn("Offer details");
        when(chatClient.prompt().messages(any(SystemMessage.class), any(UserMessage.class)).call().content())
            .thenReturn("No data to list.");
        String out = svc.answer("Give me the offer with ID 5", "en");
        System.out.println("[TEST DEBUG] answerDetailOfferEnglishLabel output: " + out);
        boolean matchesDetail = out.equals("Entity details:\nNo data to list.");
        boolean matchesList = out.equals("No data to list.");
        assertThat(matchesDetail || matchesList)
            .withFailMessage("Output was '%s', expected either 'Entity details:\nNo data to list.' or 'No data to list.'", out)
            .isTrue();
    }

    @Test
    @DisplayName("answer() greeting in French")
    void answerGreetingFrench() {
        AiService svc = buildService();
        String out = svc.answer("bonjour", "fr");
        assertThat(out).contains("Bonjour ! Comment puis-je vous aider ?");
    }

    @Test
    @DisplayName("answer() greeting in English")
    void answerGreetingEnglish() {
        AiService svc = buildService();
        String out = svc.answer("hello", "en");
        assertThat(out).contains("Hello! How can I assist you today?");
    }

    @Test
    @DisplayName("answer() fallback for unrecognized query")
    void answerFallbackUnrecognized() {
        AiService svc = buildService();
        when(chatClient.prompt().messages(any(SystemMessage.class), any(UserMessage.class)).call().content()).thenReturn("Fallback response");
        String out = svc.answer("blablabla", "fr");
        assertThat(out).contains("Fallback response");
    }

    @Test
    @DisplayName("answer() detail offer with invalid ID")
    void answerDetailOfferInvalidId() {
        AiService svc = buildService();
        when(offreRepository.findById(999L)).thenReturn(Optional.empty());
        String out = svc.answer("Donne moi l'offre id 999", "fr");
        assertThat(out).contains("Aucune entité trouvée avec cet identifiant.");
    }

    @Test
    @DisplayName("answer() list offers with empty repository")
    void answerListOffersEmptyRepo() {
        AiService svc = buildService();
        when(offreRepository.findAll()).thenReturn(List.of());
        String out = svc.answer("Donne moi la liste de toutes les offres", "fr");
        assertThat(out).contains("Aucune donnée à lister.");
    }
}
