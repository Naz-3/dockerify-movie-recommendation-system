package com.naz.movieapi1.repositories;

import com.naz.movieapi1.entity.Actor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ActorRepository extends JpaRepository<Actor, Long> {

    Optional<Actor> findByName(String name);

    @Query("""
        SELECT a
        FROM Actor a
        LEFT JOIN a.contents c
        GROUP BY a
        ORDER BY COUNT(c) DESC
    """)
    List<Actor> findMostFeaturedActors(Pageable pageable);
}