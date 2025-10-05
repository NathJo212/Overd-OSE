package com.backend.Exceptions;

public class CVNonExistantException extends RuntimeException {
  public CVNonExistantException(String message) {
    super(message);
  }
}
