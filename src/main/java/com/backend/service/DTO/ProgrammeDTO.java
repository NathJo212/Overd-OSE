package com.backend.service.DTO;

import com.backend.modele.Programme;

public enum ProgrammeDTO {

    P180_A0("180.A0 Soins infirmiers"),
    P180_B0("180.B0 Soins infirmiers pour auxiliaires"),
    P200_B1("200.B1 Sciences de la nature"),
    P200_Z1("200.Z1 Baccalauréat international en Sciences de la nature Option Sciences de la santé"),
    P221_A0("221.A0 Technologie de l’architecture"),
    P221_B0("221.B0 Technologie du génie civil"),
    P221_D0("221.D0 Technologie de l’estimation et de l’évaluation en bâtiment"),
    P243_D0("243.D0 Technologie du génie électrique: automatisation et contrôle"),
    P244_A0("244.A0 Technologie du génie physique"),
    P300_A1_ADMIN("300.A1 Sciences humaines – profil Administration et économie"),
    P300_A1_MATH("300.A1 Sciences humaines – profil avec mathématiques"),
    P300_A1_RELATIONS("300.A1 Sciences humaines – profil Individu et relations humaines"),
    P300_A1_MONDE("300.A1 Sciences humaines – profil Monde en action"),
    P322_A1("322.A1 Techniques d’éducation à l’enfance"),
    P388_A1("388.A1 Techniques de travail social"),
    P410_A1("410.A1 Gestion des opérations et de la chaîne logistique"),
    P410_G0("410.G0 Techniques d’administration et de gestion (TAG)"),
    P420_B0("420.B0 Techniques de l’informatique"),
    P500_AF("500.AF Photographie et design graphique"),
    P500_AG("500.AG Cinéma"),
    P500_AJ("500.AJ Journalisme multimédia"),
    P500_AL("500.AL Langues – profil Trilinguisme et cultures");


    private final String label;

    ProgrammeDTO(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static ProgrammeDTO toDTO(Programme modele) {
        return ProgrammeDTO.valueOf(modele.name());
    }
}