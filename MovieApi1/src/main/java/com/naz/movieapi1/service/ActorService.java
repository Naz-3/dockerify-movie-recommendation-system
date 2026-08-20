package com.naz.movieapi1.service;

import com.naz.movieapi1.dto.ActorDto;

import java.util.List;

public interface ActorService {

    List<ActorDto> getActors();

    void removeActorFromContent(Integer contentId, Long actorId);

    void deleteActor(Long actorId);

    void addActorToContent(Integer contentId, Long actorId);

    ActorDto updateActor(Long actorId, ActorDto actorDto);

    List<ActorDto> getMostFeaturedActors();
}