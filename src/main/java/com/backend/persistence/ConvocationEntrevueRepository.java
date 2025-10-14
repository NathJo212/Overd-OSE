package com.backend.persistence;

import com.backend.modele.ConvocationEntrevue;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConvocationEntrevueRepository extends JpaRepository<ConvocationEntrevue, Long> {
}
