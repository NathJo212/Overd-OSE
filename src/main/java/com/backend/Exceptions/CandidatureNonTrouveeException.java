package com.backend.Exceptions;

public class CandidatureNonTrouveeException extends RuntimeException {
  public CandidatureNonTrouveeException(String message) {
    super(message);
  }
}
