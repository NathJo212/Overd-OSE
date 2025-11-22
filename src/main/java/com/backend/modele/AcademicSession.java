package com.backend.modele;

import java.time.LocalDate;
import java.time.Month;

/**
 * Classe utilitaire pour gérer les sessions académiques et les années académiques.
 * Une année académique s'étend du 25 août au 24 août de l'année suivante.
 * Elle est composée de trois sessions: Automne, Hiver, Été.
 */
public class AcademicSession {

    /**
     * Enum représentant les sessions académiques
     */
    public enum Session {
        AUTOMNE,  // 25 août → 23 décembre
        HIVER,    // 22 janvier → 29 mai (période de stage)
        ETE       // 1er juin → 31 juillet
    }

    /**
     * Représente une année académique complète
     */
    public static class AcademicYear {
        private final int startYear;
        private final int endYear;

        public AcademicYear(int startYear) {
            this.startYear = startYear;
            this.endYear = startYear + 1;
        }

        public int getStartYear() {
            return startYear;
        }

        public int getEndYear() {
            return endYear;
        }

        /**
         * Retourne la représentation string de l'année académique (ex: "2025-2026")
         */
        public String getYearString() {
            return startYear + "-" + endYear;
        }

        /**
         * Retourne seulement l'année de début (ex: 2025)
         */
        public String getStartYearString() {
            return String.valueOf(startYear);
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            AcademicYear that = (AcademicYear) o;
            return startYear == that.startYear;
        }

        @Override
        public int hashCode() {
            return Integer.hashCode(startYear);
        }

        @Override
        public String toString() {
            return getYearString();
        }
    }

    /**
     * Calcule l'année académique courante basée sur la date du jour
     * Une année académique commence le 25 août et se termine le 24 août de l'année suivante
     */
    public static AcademicYear getCurrentAcademicYear() {
        LocalDate today = LocalDate.now();
        return getAcademicYearForDate(today);
    }

    /**
     * Calcule l'année académique pour une date donnée
     */
    public static AcademicYear getAcademicYearForDate(LocalDate date) {
        int year = date.getYear();
        int month = date.getMonthValue();
        int day = date.getDayOfMonth();

        // Si on est avant le 25 août, on est dans l'année académique (année-1)-(année)
        if (month < 8 || (month == 8 && day < 25)) {
            return new AcademicYear(year - 1);
        }
        // Sinon, on est dans l'année académique (année)-(année+1)
        return new AcademicYear(year);
    }

    /**
     * Calcule la session courante basée sur la date du jour
     */
    public static Session getCurrentSession() {
        LocalDate today = LocalDate.now();
        return getSessionForDate(today);
    }

    /**
     * Calcule la session pour une date donnée
     */
    public static Session getSessionForDate(LocalDate date) {
        int month = date.getMonthValue();
        int day = date.getDayOfMonth();

        // Automne: 25 août → 23 décembre
        if ((month == 8 && day >= 25) || month == 9 || month == 10 || month == 11 || (month == 12 && day <= 23)) {
            return Session.AUTOMNE;
        }
        // Hiver: 22 janvier → 29 mai
        else if ((month == 1 && day >= 22) || month == 2 || month == 3 || month == 4 || (month == 5 && day <= 29)) {
            return Session.HIVER;
        }
        // Été: 1er juin → 31 juillet
        else if (month == 6 || month == 7 || (month == 8 && day < 25)) {
            return Session.ETE;
        }
        // Période de transition (24 décembre - 21 janvier)
        // On considère cette période comme faisant partie de l'Hiver
        else {
            return Session.HIVER;
        }
    }

    /**
     * Retourne la date de début d'une session pour une année académique donnée
     */
    public static LocalDate getSessionStartDate(AcademicYear academicYear, Session session) {
        return switch (session) {
            case AUTOMNE -> LocalDate.of(academicYear.getStartYear(), Month.AUGUST, 25);
            case HIVER -> LocalDate.of(academicYear.getEndYear(), Month.JANUARY, 22);
            case ETE -> LocalDate.of(academicYear.getEndYear(), Month.JUNE, 1);
        };
    }

    /**
     * Retourne la date de fin d'une session pour une année académique donnée
     */
    public static LocalDate getSessionEndDate(AcademicYear academicYear, Session session) {
        return switch (session) {
            case AUTOMNE -> LocalDate.of(academicYear.getStartYear(), Month.DECEMBER, 23);
            case HIVER -> LocalDate.of(academicYear.getEndYear(), Month.MAY, 29);
            case ETE -> LocalDate.of(academicYear.getEndYear(), Month.JULY, 31);
        };
    }

    /**
     * Vérifie si une date est dans la session courante
     */
    public static boolean isInCurrentSession(LocalDate date) {
        AcademicYear currentYear = getCurrentAcademicYear();
        Session currentSession = getCurrentSession();
        AcademicYear dateYear = getAcademicYearForDate(date);
        Session dateSession = getSessionForDate(date);

        return currentYear.equals(dateYear) && currentSession == dateSession;
    }

    /**
     * Vérifie si une année académique est la courante
     */
    public static boolean isCurrentAcademicYear(AcademicYear year) {
        return year.equals(getCurrentAcademicYear());
    }

    /**
     * Vérifie si une année académique (représentée par son année de début) est la courante
     */
    public static boolean isCurrentAcademicYear(int startYear) {
        return startYear == getCurrentAcademicYear().getStartYear();
    }

    /**
     * Parse une string représentant une année académique (ex: "2025" ou "2025-2026")
     */
    public static AcademicYear parseAcademicYear(String yearString) {
        if (yearString == null || yearString.isEmpty()) {
            return getCurrentAcademicYear();
        }

        // Format "2025-2026"
        if (yearString.contains("-")) {
            String[] parts = yearString.split("-");
            return new AcademicYear(Integer.parseInt(parts[0]));
        }

        // Format "2025"
        return new AcademicYear(Integer.parseInt(yearString));
    }
}


