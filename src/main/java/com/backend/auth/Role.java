package com.backend.auth;

import java.util.HashSet;
import java.util.Set;

public enum Role {

    EMPLOYEUR("ROLE_EMPLOYEUR"),
    ETUDIANT("ROLE_ETUDIANT"),
//    EMPRUNTEUR("ROLE_EMPRUNTEUR"),
    ;

    private final String string;
    private final Set<Role> managedRoles = new HashSet<>();

    static{
//        EMPLOYEUR.managedRoles.add(EMPLOYEUR);
//        EMPLOYEUR.managedRoles.add(EMPRUNTEUR);
    }

    Role(String string){
        this.string = string;
    }

    @Override
    public String toString(){
        return string;
    }
}
