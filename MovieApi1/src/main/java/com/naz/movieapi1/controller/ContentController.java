package com.naz.movieapi1.controller;

import com.naz.movieapi1.dto.SeasonDto;
import com.naz.movieapi1.dto.details.MovieDetailDto;
import com.naz.movieapi1.dto.search.SearchResultDto;
import com.naz.movieapi1.entity.Content;
import com.naz.movieapi1.service.ActorService;
import com.naz.movieapi1.service.ContentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/content")
@CrossOrigin(origins = {
        "http://127.0.0.1:5500",
        "http://localhost:5500"
})
public class ContentController {

    private final ContentService service;
    private final ActorService actorService;

    // Çift enjeksiyon temizlendi, sadece gerekli bağımlılıklar bırakıldı.
    public ContentController(ContentService service, ActorService actorService) {
        this.service = service;
        this.actorService = actorService;
    }

    @GetMapping
    public List<Content> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Content getById(@PathVariable Integer id) {
        return service.getById(id);
    }

    @PostMapping
    public Content save(@RequestBody Content content) {
        return service.save(content);
    }

    @PutMapping("/{id}")
    public Content update(
            @PathVariable Integer id,
            @RequestBody Content content) {
        return service.update(id, content);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }

    @GetMapping("/search")
    public List<SearchResultDto> search(@RequestParam String title) {
        return service.searchAll(title);
    }

    @GetMapping("/details")
    public MovieDetailDto details(@RequestParam String imdbId) {
        return service.getOmdbDetails(imdbId);
    }

    @GetMapping("/{id}/details")
    public MovieDetailDto databaseDetails(@PathVariable Integer id) {
        return service.getDetails(id);
    }

    @PostMapping("/import")
    public Content importMovie(@RequestParam String imdbId) {
        return service.importMovie(imdbId);
    }

    // Hata durumunda 500 atmak yerine hatayı yakalayacak şekilde güncellendi
    @PostMapping("/import/bulk")
    public ResponseEntity<?> importBulkMovies(@RequestBody List<String> imdbIds) {
        try {
            if (imdbIds == null || imdbIds.isEmpty()) {
                return ResponseEntity.badRequest().body("Aktarılacak içerik ID'si bulunamadı.");
            }
            List<Content> importedContents = service.importBulkMovies(imdbIds);
            return ResponseEntity.ok(importedContents);
        } catch (Exception e) {
            e.printStackTrace(); // Konsola hatayı detaylı basar
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Toplu aktarım sırasında hata oluştu: " + e.getMessage());
        }
    }

    @PatchMapping("/{id}/status")
    public Content updateStatus(
            @PathVariable Integer id,
            @RequestParam String status) {
        return service.updateStatus(id, status);
    }

    @PatchMapping("/sync-all")
    public ResponseEntity<Void> syncAllContents() {
        service.syncAllContents();
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/sync/{id}")
    public Content syncMovie(@PathVariable Integer id) {
        return service.syncMovie(id);
    }

    @DeleteMapping("/{contentId}/actors/{actorId}")
    public void removeActorFromContent(
            @PathVariable Integer contentId,
            @PathVariable Long actorId) {
        actorService.removeActorFromContent(contentId, actorId);
    }

    @PostMapping("/{contentId}/actors/{actorId}")
    public void addActorToContent(
            @PathVariable Integer contentId,
            @PathVariable Long actorId) {
        actorService.addActorToContent(contentId, actorId);
    }

    @GetMapping("/{id}/seasons")
    public List<SeasonDto> getSeasons(@PathVariable Integer id) {
        Content content = service.getById(id);
        return service.getSeasons(content.getImdbId());
    }

    @GetMapping("/{id}/season/{season}")
    public SeasonDto getSeasonDetails(
            @PathVariable Integer id,
            @PathVariable Integer season) {
        Content content = service.getById(id);
        return service.getSeasonDetails(content.getImdbId(), season);
    }

    @PostMapping("/custom")
    public Content createCustom(@RequestBody Content content) {
        return service.createCustomContent(content);
    }
}