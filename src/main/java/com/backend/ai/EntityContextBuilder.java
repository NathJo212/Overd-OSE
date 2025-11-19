package com.backend.ai;

public interface EntityContextBuilder<T> {
    String build(T entity);
    String getType();
}

