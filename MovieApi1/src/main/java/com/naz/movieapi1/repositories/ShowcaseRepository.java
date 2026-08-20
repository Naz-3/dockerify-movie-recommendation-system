package com.naz.movieapi1.repositories;

import com.naz.movieapi1.entity.Showcase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ShowcaseRepository extends JpaRepository<Showcase, Long> {
    List<Showcase> findByStatus(String status);

    //belirli iki tarih arasindaki onaylanmis-planlanmis vitrinler icin
    List<Showcase> findByScheduledDateBetween(LocalDate startDate, LocalDate endDate);
}