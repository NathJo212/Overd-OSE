package com.backend.controller;

import com.backend.service.AiService;
import com.backend.service.GestionnaireService;
import com.backend.service.DTO.ChatRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@WebMvcTest(controllers = GestionnaireControlleur.class)
@AutoConfigureMockMvc(addFilters = false)
class ChatClientControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AiService aiService;
    @MockitoBean
    private GestionnaireService gestionnaireService;

    private void setAuthWithRole(String role) {
        List<GrantedAuthority> auths = List.of(new SimpleGrantedAuthority(role));
        TestingAuthenticationToken auth = new TestingAuthenticationToken("user","pw", auths);
        auth.setAuthenticated(true);
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/chatclient returns 400 when message blank")
    void chatclient_badRequest_blank() throws Exception {
        setAuthWithRole("GESTIONNAIRE");
        ChatRequest req = new ChatRequest("   ");
        mockMvc.perform(post("/OSEGestionnaire/chatclient")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("message is required"));
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/chatclient returns 401 when not gestionnaire")
    void chatclient_unauthorized() throws Exception {
        SecurityContextHolder.clearContext();
        ChatRequest req = new ChatRequest("Any message");
        mockMvc.perform(post("/OSEGestionnaire/chatclient")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/chatclient success returns AI answer and respects Accept-Language")
    void chatclient_success() throws Exception {
        setAuthWithRole("GESTIONNAIRE");
        when(aiService.answer(anyString(), anyString())).thenReturn("Réponse AI");
        ChatRequest req = new ChatRequest("Liste toutes les offres");
        mockMvc.perform(post("/OSEGestionnaire/chatclient")
                        .header("Accept-Language","fr")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(content().string("Réponse AI"));
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/chatclient returns 500 on unexpected error")
    void chatclient_internalError() throws Exception {
        setAuthWithRole("GESTIONNAIRE");
        org.mockito.Mockito.doThrow(new RuntimeException("boom"))
                .when(aiService).answer(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.nullable(String.class));
        ChatRequest req = new ChatRequest("Offer list");
        mockMvc.perform(post("/OSEGestionnaire/chatclient")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Chat error: boom")));
    }
}
