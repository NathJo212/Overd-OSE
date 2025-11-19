package com.backend.ai;

import org.springframework.stereotype.Component;

@Component
public class AiPrompts {
    public String systemCore(boolean fr) {
        return fr ? "Tu es un assistant métier. Tu réponds uniquement avec les données fournies. Ne prétends jamais manquer d'accès." : "You are a domain assistant. Answer ONLY with supplied data. Never claim missing access.";
    }
    public String missingContext(boolean fr) {
        return fr ? "Précise l'entité et l'id (ex: 'offre id 3')." : "Specify entity and id (e.g. 'offer id 3').";
    }
}

