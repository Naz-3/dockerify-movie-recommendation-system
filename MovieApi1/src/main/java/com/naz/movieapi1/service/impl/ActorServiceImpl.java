package com.naz.movieapi1.service.impl;

import com.naz.movieapi1.dto.ActorDto;
import com.naz.movieapi1.entity.Content;
import com.naz.movieapi1.repositories.ContentRepository;
import com.naz.movieapi1.dto.search.MovieItemDto;
import com.naz.movieapi1.service.ActorService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import com.naz.movieapi1.entity.Actor;
import com.naz.movieapi1.repositories.ActorRepository;
import com.naz.movieapi1.exception.MovieNotFoundException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class ActorServiceImpl implements ActorService {

    private final ContentRepository repository;
    private final ActorRepository actorRepository;

    public ActorServiceImpl(ContentRepository repository,
                            ActorRepository actorRepository) {

        this.repository = repository;
        this.actorRepository = actorRepository;
    }

    @Override
    public List<ActorDto> getActors() {

        List<Content> contents = repository.findAll();

        Map<String, ActorDto> actorMap = new HashMap<>();

        for (Content content : contents) {

            if (content.getActors() == null || content.getActors().isEmpty()) {
                continue;
            }

            for (Actor actorEntity : content.getActors()) {

                String actorName = actorEntity.getName();

                if (!actorMap.containsKey(actorName)) {

                    ActorDto actor = new ActorDto();

                    actor.setId(actorEntity.getId());
                    actor.setName(actorName);
                    actor.setMovieCount(0);
                    actor.setSeriesCount(0);
                    actor.setHighestRating(0.0);
                    actor.setFilmography(new ArrayList<>());

                    actorMap.put(actorName, actor);
                }

                ActorDto actor = actorMap.get(actorName);

                MovieItemDto movie = createMovieDto(content);

                actor.getFilmography().add(movie);

                if ("movie".equalsIgnoreCase(content.getType())) {
                    actor.setMovieCount(actor.getMovieCount() + 1);
                }

                if ("series".equalsIgnoreCase(content.getType())) {
                    actor.setSeriesCount(actor.getSeriesCount() + 1);
                }

                if (content.getRating() != null &&
                        content.getRating() > actor.getHighestRating()) {

                    actor.setHighestRating(content.getRating());
                    actor.setTopMovie(movie);
                }
            }
        }
        for (ActorDto actor : actorMap.values()) {

            actor.getFilmography().sort((m1, m2) -> {

                Double rating1 = m1.getRating() == null ? 0.0 : m1.getRating();
                Double rating2 = m2.getRating() == null ? 0.0 : m2.getRating();

                return rating2.compareTo(rating1);
            });
        }
        List<ActorDto> actors = new ArrayList<>(actorMap.values());
        ///*map'i listeye ceviriyor, controllera liste döndürme daha uygun.*///

        actors.sort((a1, a2) ->
                Integer.compare(a2.getMovieCount() + a2.getSeriesCount(),
                        a1.getMovieCount() + a1.getSeriesCount()));

        return actors;
    }

    private MovieItemDto createMovieDto(Content content) {

        MovieItemDto movie = new MovieItemDto();

        movie.setId(content.getId());
        movie.setTitle(content.getTitle());
        movie.setYear(content.getYear());
        movie.setType(content.getType());
        movie.setRating(content.getRating());
        movie.setPoster(content.getPoster());
        movie.setGenre(content.getGenre());

        return movie;
    }

    @Override
    public void removeActorFromContent(Integer contentId, Long actorId) {

        Content content = repository.findById(contentId)
                .orElseThrow(() ->
                        new MovieNotFoundException("İçerik bulunamadı."));

        Actor actor = actorRepository.findById(actorId)
                .orElseThrow(() ->
                        new RuntimeException("Oyuncu bulunamadı."));

        content.getActors().remove(actor);

        repository.save(content);
    }

    @Override
    public void deleteActor(Long actorId) {

        Actor actor = actorRepository.findById(actorId)
                .orElseThrow(() ->
                        new RuntimeException("Oyuncu bulunamadı."));

        for (Content content : new ArrayList<>(actor.getContents())) {

            content.getActors().remove(actor);

            repository.save(content);
        }

        actorRepository.delete(actor);
    }

    @Override
    public void addActorToContent(Integer contentId, Long actorId) {

        Content content = repository.findById(contentId)
                .orElseThrow(() ->
                        new MovieNotFoundException("İçerik bulunamadı."));

        Actor actor = actorRepository.findById(actorId)
                .orElseThrow(() ->
                        new RuntimeException("Oyuncu bulunamadı."));

        if (!content.getActors().contains(actor)) {
            content.getActors().add(actor);
        }

        repository.save(content);
    }

    @Override
    public ActorDto updateActor(Long actorId, ActorDto actorDto) {

        Actor actor = actorRepository.findById(actorId)
                .orElseThrow(() ->
                        new RuntimeException("Oyuncu bulunamadı."));

        actor.setName(actorDto.getName());

        actorRepository.save(actor);

        ActorDto dto = new ActorDto();

        dto.setId(actor.getId());
        dto.setName(actor.getName());
        dto.setMovieCount(0);
        dto.setSeriesCount(0);
        dto.setHighestRating(0.0);
        dto.setFilmography(new ArrayList<>());

        return dto;
    }

    @Override
    public List<ActorDto> getMostFeaturedActors() {

        List<Actor> actors =
                actorRepository.findMostFeaturedActors(
                        PageRequest.of(0,5)
                );

        return actors.stream()
                .map(actor -> {

                    ActorDto dto = new ActorDto();
                    dto.setId(actor.getId());
                    dto.setName(actor.getName());
                    dto.setContentCount(
                            actor.getContents().size()
                    );
                    return dto;
                })
                .toList();
    }
}