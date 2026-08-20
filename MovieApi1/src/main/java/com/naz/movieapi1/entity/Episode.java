package com.naz.movieapi1.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "episodes")
@Getter
@Setter
@NoArgsConstructor
public class Episode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "imdb_id", unique = true)
    private String imdbId;

    private Integer seasonNumber;

    private Integer episodeNumber;

    private String title;

    @Column(length = 5000)
    private String plot;

    @Column(length = 1000)
    private String poster;

    private String runtime;

    private Double rating;

    private Boolean posterCustomized = false;

    private Boolean plotCustomized = false;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_id", nullable = false)
    private Content content;
}