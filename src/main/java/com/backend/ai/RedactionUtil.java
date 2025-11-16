package com.backend.ai;

public final class RedactionUtil {
    private RedactionUtil() {}

    public static String sanitize(String s) {
        if (s == null) return null;
        String out = s.replaceAll("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}", "[REDACTED_EMAIL]");
        out = out.replaceAll("(?<!\\d)(\\d{7,})(?!\\d)", "[REDACTED_NUMBER]");
        return truncate(out);
    }

    public static String truncate(String s) {
        if (s == null) return null;
        int max = 400;
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }

    public static String escape(String s) {
        if (s == null) return null;
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", " ");
    }
}

