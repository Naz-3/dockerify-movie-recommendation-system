package com.naz.movieapi1.controller;

import com.naz.movieapi1.dto.ActorDto;
import com.naz.movieapi1.service.ActorService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/actors")
@CrossOrigin(origins = {
        "http://127.0.0.1:5500",
        "http://localhost:5500"
})

public class ActorController {

    private final ActorService service;

    public ActorController(ActorService service) {
        this.service = service;
    }

    @GetMapping
    public List<ActorDto> getActors() {
        return service.getActors();
    }

    @PutMapping("/{actorId}")
    public ActorDto updateActor(
            @PathVariable Long actorId,
            @RequestBody ActorDto actorDto) {

        return service.updateActor(actorId, actorDto);
    }

    @DeleteMapping("/{actorId}")
    public void deleteActor(
            @PathVariable Long actorId) {

        service.deleteActor(actorId);
    }

    @GetMapping("/featured")
    public List<ActorDto> getFeaturedActors() {

        return service.getMostFeaturedActors();

    }
}