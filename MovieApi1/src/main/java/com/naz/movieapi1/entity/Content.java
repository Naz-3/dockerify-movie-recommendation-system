package com.naz.movieapi1.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.naz.movieapi1.ContentSource;
import com.naz.movieapi1.ContentType;
import com.naz.movieapi1.FilmType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "contents")
@Getter
@Setter
@NoArgsConstructor

public class Content {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(name = "imdb_id", unique = true)
    private String imdbId;
    @Column(nullable = false)
    @Size(max = 40) String title;
    private Integer year;
    private String type;
    private String genre;
    @Max(10) private Double rating;
    private String runtime;
    private String director;
    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "content_actor",
            joinColumns = @JoinColumn(name = "content_id"),
            inverseJoinColumns = @JoinColumn(name = "actor_id")
    )
    private List<Actor> actors = new ArrayList<>();
    @Column(length = 5000)
    private String plot;
    private String status;
    private String writer;
    private String composer;
    private String language;
    private String country;
    private String awards;

    @Column(length = 1000)
    private String Poster;
    @OneToMany(
            mappedBy = "content",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Episode> episodes = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private ContentSource source;
    @Enumerated(EnumType.STRING)
    private ContentType contentType;
    @Enumerated(EnumType.STRING)
    private FilmType filmType;

    private Integer durationInMinutes;

    //watch history iliskisi
    @OneToMany(
            mappedBy = "content",
            cascade = CascadeType.ALL
    )
    @JsonIgnore //content çekildiğinde WatchHistory listesine girip devasa döngü yaratmasını engellesin
    private List<WatchHistory> watchHistories = new ArrayList<>();
}