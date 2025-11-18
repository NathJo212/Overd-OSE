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
        when(offerBuilder.build(o)).thenReturn("{\n  \"type\": \"offre\",\n  \"id\": 42\n}");
        when(chatClient.prompt().messages(any(SystemMessage.class), any(UserMessage.class)).call().content()).thenReturn("Réponse");

        String out = svc.answer("Donne moi l'offre id 42", "fr");
        assertThat(out).isEqualTo("Réponse");

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
        when(offerBuilder.build(any(Offre.class))).thenReturn("{\n  \"type\": \"offre\"\n}");
        when(chatClient.prompt().messages(any(SystemMessage.class), any(UserMessage.class)).call().content()).thenReturn("Answer");

        String out = svc.answer("Give me a list of every offer", "en");
        assertThat(out).isEqualTo("Answer");
        ArgumentCaptor<SystemMessage> sysCap = ArgumentCaptor.forClass(SystemMessage.class);
        verify(chatClient.prompt()).messages(sysCap.capture(), any(UserMessage.class));
        String text = sysCap.getValue().getText();
        long occurrences = text.lines().filter(l -> l.contains("\"type\": \"offre\"")).count();
        assertThat(occurrences).isGreaterThanOrEqualTo(3);
        assertThat(text).contains("You are a domain assistant");
    }

    @Test
    @DisplayName("answer() generic offer fallback returns single sample")
    void answerGenericOfferFallback() {
        AiService svc = buildService();
        List<Offre> offers = List.of(sampleOffre(10), sampleOffre(11));
        when(offreRepository.findAll()).thenReturn(offers);
        when(offerBuilder.build(offers.get(0))).thenReturn("{\n  \"type\": \"offre\", \n  \"id\": 10\n}");
        when(chatClient.prompt().messages(any(SystemMessage.class), any(UserMessage.class)).call().content()).thenReturn("Answer");

        String out = svc.answer("I want an offer", "en");
        assertThat(out).isEqualTo("Answer");
        ArgumentCaptor<SystemMessage> sysCap = ArgumentCaptor.forClass(SystemMessage.class);
        verify(chatClient.prompt()).messages(sysCap.capture(), any(UserMessage.class));
        String content = sysCap.getValue().getText();
        assertThat(content).contains("CONTEXT:");
        assertThat(content).contains("\"type\": \"offre\"");
        assertThat(content).doesNotContain("Specify entity and id");
    }

    @Test
    @DisplayName("postProcess removes access refusal hallucinations")
    void postProcessRemovesAccessRefusal() {
        AiService svc = buildService();
        when(chatClient.prompt().messages(any(SystemMessage.class), any(UserMessage.class)).call().content())
                .thenReturn("Je ne peux pas accéder aux données. Voici une réponse utile.");
        String out = svc.answer("Donne moi quelque chose", "fr");
        assertThat(out).doesNotContain("Je ne peux pas accéder");
        assertThat(out).contains("réponse utile");
    }

    @Test
    @DisplayName("language detection: Accept-Language overrides content")
    void languageDetectionHeaderPriority() {
        AiService svc = buildService();
        when(chatClient.prompt().messages(any(SystemMessage.class), any(UserMessage.class)).call().content()).thenReturn("Answer");
        svc.answer("bonjour this is mixed", "en");
        ArgumentCaptor<SystemMessage> sysCap = ArgumentCaptor.forClass(SystemMessage.class);
        verify(chatClient.prompt()).messages(sysCap.capture(), any(UserMessage.class));
        assertThat(sysCap.getValue().getText()).contains("You are a domain assistant");
    }
}
