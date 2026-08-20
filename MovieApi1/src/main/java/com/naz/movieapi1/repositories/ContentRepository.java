package com.naz.movieapi1.repositories;

import com.naz.movieapi1.entity.Content;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ContentRepository extends JpaRepository<Content, Integer> {
    Optional<Content> findByImdbId(String imdbId);
    Optional<Content> findByTitleIgnoreCase(String title);
    List<Content> findByTitleContainingIgnoreCase(String title);
    boolean existsByTitle(String title);
    boolean existsByImdbId(String imdbId);

}