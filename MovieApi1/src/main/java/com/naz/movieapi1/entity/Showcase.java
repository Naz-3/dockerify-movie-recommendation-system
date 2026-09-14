package com.naz.movieapi1.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "showcases")
public class Showcase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String triggerReason;
    private String status;
    @Column(unique = true)
    private UUID correlationId;
    private String generationStatus;
    @Column(length = 2000)
    private String generationError;
    private UUID resultEventId;

    private String city;
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
    private LocalDate scheduledDate;

    @OneToMany(mappedBy = "showcase", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<ShowcaseItem> items;

    public Showcase() {
        this.createdAt = LocalDateTime.now();
    }
}
