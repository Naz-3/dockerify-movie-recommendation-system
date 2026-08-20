package com.naz.movieapi1.service.impl;

import com.naz.movieapi1.ContentSource;
import com.naz.movieapi1.dto.omdb.OmdbDto;
import com.naz.movieapi1.dto.omdb.OmdbSearchItemDto;
import com.naz.movieapi1.dto.omdb.OmdbSearchResponseDto;
import com.naz.movieapi1.dto.tmdb.TmdbMovieResponseDto;
import com.naz.movieapi1.dto.tmdb.TmdbSearchResponseDto;
import com.naz.movieapi1.entity.Content;
import com.naz.movieapi1.exception.MovieAlreadyExistsException;
import com.naz.movieapi1.exception.MovieNotFoundException;
import com.naz.movieapi1.repositories.ContentRepository;
import com.naz.movieapi1.service.ContentService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import com.naz.movieapi1.entity.Actor;
import com.naz.movieapi1.repositories.ActorRepository;
import com.naz.movieapi1.dto.omdb.OmdbSeasonDto;
import com.naz.movieapi1.dto.SeasonDto;
import com.naz.movieapi1.dto.EpisodeDto;
import com.naz.movieapi1.entity.Episode;
import com.naz.movieapi1.repositories.EpisodeRepository;
import com.naz.movieapi1.dto.search.SearchResultDto;
import com.naz.movieapi1.dto.details.MovieDetailDto;

import java.util.HashSet;
import java.util.Set;
import java.util.Collections;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;

@Service
public class ContentServiceImpl implements ContentService {

    private final ContentRepository repository;
    private final ActorRepository actorRepository;
    private final EpisodeRepository episodeRepository;
    private final RestClient restClient = RestClient.create();

    @Value("${omdb.api.key}")
    private String apiKey;

    @Value("${tmdb.api.key:}")
    private String tmdbApiKey;

    private final String tmdbBaseUrl = "https://api.themoviedb.org/3";
    private final String tmdbImageBaseUrl = "https://image.tmdb.org/t/p/w500";

    public ContentServiceImpl(ContentRepository repository,
                              ActorRepository actorRepository,
                              EpisodeRepository episodeRepository) {
        this.repository = repository;
        this.actorRepository = actorRepository;
        this.episodeRepository = episodeRepository;
    }

    @Override
    public List<Content> getAll() {
        return repository.findAll();
    }

    public Content getById(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new MovieNotFoundException("İçerik bulunamadı."));
    }

    public Content save(Content content) {
        return repository.save(content);
    }

    public void delete(Integer id) {
        Content content = getById(id);
        repository.delete(content);
    }

    public Content update(Integer id, Content updated) {
        Content content = getById(id);
        content.setTitle(updated.getTitle());
        content.setYear(updated.getYear());
        content.setGenre(updated.getGenre());
        content.setType(updated.getType());
        content.setPoster(updated.getPoster());
        content.setRating(updated.getRating());
        content.setRuntime(updated.getRuntime());

        content.setDirector(updated.getDirector());
        content.setWriter(updated.getWriter());
        content.setComposer(updated.getComposer());

        content.setCountry(updated.getCountry());
        content.setLanguage(updated.getLanguage());
        content.setAwards(updated.getAwards());

        String actorNames = "";
        if (updated.getActors() != null) {
            actorNames = updated.getActors()
                    .stream()
                    .map(Actor::getName)
                    .reduce((a, b) -> a + "," + b)
                    .orElse("");
        }
        content.setActors(convertActors(actorNames));
        content.setPlot(updated.getPlot());
        content.setStatus(updated.getStatus());
        return repository.save(content);
    }

    @Override
    public List<OmdbSearchItemDto> searchMovies(String title) {
        // 1. Önce TMDB'den arama yapmayı dene
        if (tmdbApiKey != null && !tmdbApiKey.isBlank()) {
            try {
                String tmdbUrl = tmdbBaseUrl + "/search/movie?api_key=" + tmdbApiKey + "&query=" + title;
                TmdbSearchResponseDto tmdbResponse = restClient.get()
                        .uri(tmdbUrl)
                        .retrieve()
                        .body(TmdbSearchResponseDto.class);

                if (tmdbResponse != null && tmdbResponse.getResults() != null && !tmdbResponse.getResults().isEmpty()) {
                    List<OmdbSearchItemDto> searchItems = new ArrayList<>();
                    for (TmdbMovieResponseDto movie : tmdbResponse.getResults()) {
                        OmdbSearchItemDto item = new OmdbSearchItemDto();
                        item.setTitle(movie.getTitle());
                        item.setYear(movie.getReleaseDate() != null && movie.getReleaseDate().contains("-")
                                ? movie.getReleaseDate().split("-")[0] : "");
                        item.setPoster(movie.getPosterPath() != null ? tmdbImageBaseUrl + movie.getPosterPath() : null);
                        item.setType("movie");

                        // TMDB ID'sinden gerçek IMDb ID'yi alıyoruz
                        String imdbId = getImdbIdFromTmdb(movie.getId());
                        item.setImdbId(imdbId != null ? imdbId : String.valueOf(movie.getId()));

                        searchItems.add(item);
                    }
                    return searchItems;
                }
            } catch (Exception e) {
                System.err.println("TMDB arama hatası, OMDb fallback kullanılıyor: " + e.getMessage());
            }
        }

        // 2. TMDB sonuç vermezse veya hata verirse OMDb Fallback
        String url = "https://www.omdbapi.com/?apikey=" + apiKey + "&s=" + title;
        OmdbSearchResponseDto response = restClient.get()
                .uri(url)
                .retrieve()
                .body(OmdbSearchResponseDto.class);

        if (response == null || response.getSearch() == null) {
            return Collections.emptyList();
        }
        return response.getSearch();
    }

    @Override
    public OmdbDto getMovieByImdbId(String imdbId) {
        String url = "https://www.omdbapi.com/?apikey=" + apiKey + "&i=" + imdbId;
        return restClient.get()
                .uri(url)
                .retrieve()
                .body(OmdbDto.class);
    }

    // ==========================================
    // İÇERİK AKTARIM (IMPORT) METODLARI
    // ==========================================

    @Override
    public Content importMovie(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new MovieNotFoundException("Geçersiz film tanımlayıcısı.");
        }

        // Parametre TMDb sayısal ID'si ise ("550" gibi) doğrudan TMDb ID Çözümlemesine Gönder
        if (!identifier.startsWith("tt") && identifier.matches("\\d+")) {
            return importTmdbMovie(identifier);
        }

        if (repository.existsByImdbId(identifier)) {
            throw new MovieAlreadyExistsException("Bu içerik zaten kayıtlı: " + identifier);
        }

        Content content = new Content();
        content.setImdbId(identifier);

        // 1. Önce TMDB Detayı Deneyelim
        MovieDetailDto tmdbDetails = getTmdbDetailsByImdbId(identifier);

        if (tmdbDetails != null) {
            content.setTitle(tmdbDetails.getTitle());
            content.setYear(tmdbDetails.getYear());
            content.setGenre(tmdbDetails.getGenre());
            content.setType(tmdbDetails.getType());
            content.setPoster(tmdbDetails.getPoster());
            content.setRating(tmdbDetails.getRating());
            content.setPlot(tmdbDetails.getPlot());
            content.setSource(ContentSource.OMDB);
        } else {
            // 2. TMDB yoksa OMDb'den Import Et
            OmdbDto movie = getMovieByImdbId(identifier);
            if (movie == null || movie.getTitle() == null) {
                throw new MovieNotFoundException("Film detayları OMDb'den alınamadı: " + identifier);
            }

            content.setTitle(movie.getTitle());
            content.setSource(ContentSource.OMDB);

            if (movie.getYear() != null && !movie.getYear().equals("N/A")) {
                String year = movie.getYear().replace("–", "-").trim();
                if (year.contains("-")) {
                    year = year.split("-")[0].trim();
                }
                try {
                    content.setYear(Integer.parseInt(year));
                } catch (NumberFormatException ignored) {}
            }
            content.setGenre(movie.getGenre());
            content.setType(movie.getType());
            content.setPoster(movie.getPoster());
            content.setRuntime(movie.getRuntime());
            content.setDirector(movie.getDirector());
            content.setWriter(movie.getWriter());
            content.setCountry(movie.getCountry());
            content.setLanguage(movie.getLanguage());
            content.setAwards(movie.getAwards());
            content.setActors(convertActors(movie.getActors()));
            content.setPlot(movie.getPlot());

            if (movie.getImdbRating() != null && !movie.getImdbRating().equals("N/A")) {
                try {
                    content.setRating(Double.parseDouble(movie.getImdbRating().trim()));
                } catch (NumberFormatException ignored) {}
            }
        }

        content.setStatus("İzlenecek");
        Content savedContent = repository.save(content);
        try {
            saveEpisodes(savedContent);
        } catch (Exception e) {
            System.err.println("Bölüm bilgileri kaydedilirken hata oluştu: " + e.getMessage());
        }
        return savedContent;
    }

    /**
     * TMDb ID'si ("550") üzerinden doğrudan import yapma
     */
    @Override
    public Content importTmdbMovie(String tmdbId) {
        if (tmdbId == null || tmdbId.isBlank()) {
            throw new MovieNotFoundException("TMDb ID boş olamaz.");
        }

        // TMDb ID'den IMDb ID çözmeyi dene (tt...)
        try {
            Long numericTmdbId = Long.parseLong(tmdbId.trim());
            String imdbId = getImdbIdFromTmdb(numericTmdbId);
            if (imdbId != null && !imdbId.isBlank()) {
                return importMovie(imdbId); // Ana akışa devret
            }
        } catch (NumberFormatException ignored) {}

        // IMDb ID bulunamazsa TMDb Direct Fallback Kaydı
        String fallbackImdbId = "tmdb-" + tmdbId.trim();
        if (repository.existsByImdbId(fallbackImdbId)) {
            throw new MovieAlreadyExistsException("Bu içerik zaten kayıtlı.");
        }

        Content content = new Content();
        content.setImdbId(fallbackImdbId);

        try {
            String url = tmdbBaseUrl + "/movie/" + tmdbId + "?api_key=" + tmdbApiKey;
            Map<?, ?> response = restClient.get().uri(url).retrieve().body(Map.class);

            if (response != null && response.containsKey("title")) {
                content.setTitle((String) response.get("title"));
                content.setPlot((String) response.get("overview"));

                String posterPath = (String) response.get("poster_path");
                if (posterPath != null) {
                    content.setPoster(tmdbImageBaseUrl + posterPath);
                }

                String releaseDate = (String) response.get("release_date");
                if (releaseDate != null && releaseDate.contains("-")) {
                    content.setYear(Integer.parseInt(releaseDate.split("-")[0].trim()));
                }

                Object voteAvg = response.get("vote_average");
                if (voteAvg != null) {
                    content.setRating(Double.parseDouble(voteAvg.toString().trim()));
                }

                content.setType("movie");
                content.setSource(ContentSource.OMDB);
                content.setStatus("İzlenecek");

                return repository.save(content);
            }
        } catch (Exception e) {
            throw new MovieNotFoundException("TMDb'den film çekilemedi: " + e.getMessage());
        }

        throw new MovieNotFoundException("Film bulunamadı.");
    }

    /**
     * OMDb / IMDb ID Listesi için Toplu Import (Hata Toleranslı)
     */
    @Override
    @Transactional
    public List<Content> importBulkMovies(List<String> imdbIds) {
        if (imdbIds == null || imdbIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Content> contentsToSave = new ArrayList<>();

        for (String imdbId : imdbIds) {
            if (imdbId == null || imdbId.isBlank()) {
                continue;
            }
            try {
                // Veritabanında zaten varsa atla, tüm süreci durdurma
                if (repository.existsByImdbId(imdbId)) {
                    System.out.println("Zaten kayıtlı, atlanıyor: " + imdbId);
                    continue;
                }
                Content imported = importMovie(imdbId.trim());
                if (imported != null) {
                    contentsToSave.add(imported);
                }
            } catch (MovieAlreadyExistsException e) {
                System.out.println("Zaten var olan film atlandı: " + imdbId);
            } catch (Exception e) {
                // Tekil film patlarsa hatayı konsola basıp sıradakine geç
                System.err.println("Toplu Aktarım Hatası (" + imdbId + "): " + e.getMessage());
            }
        }

        return contentsToSave;
    }

    /**
     * TMDb ID Listesi için Toplu Import (Hata Toleranslı)
     */
    @Override
    @Transactional
    public List<Content> importBulkTmdbMovies(List<String> tmdbIds) {
        if (tmdbIds == null || tmdbIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Content> contentsToSave = new ArrayList<>();

        for (String tmdbId : tmdbIds) {
            if (tmdbId == null || tmdbId.isBlank()) {
                continue;
            }
            try {
                Content imported = importTmdbMovie(tmdbId.trim());
                if (imported != null) {
                    contentsToSave.add(imported);
                }
            } catch (MovieAlreadyExistsException e) {
                System.out.println("Zaten var olan TMDb film atlandı: " + tmdbId);
            } catch (Exception e) {
                System.err.println("TMDb Bulk Import Hatası (" + tmdbId + "): " + e.getMessage());
            }
        }

        return contentsToSave;
    }

    public Content updateStatus(Integer id, String status) {
        Content content = getById(id);
        content.setStatus(status);
        return repository.save(content);
    }

    public Content syncMovie(Integer id) {
        Content content = getById(id);
        if (content.getImdbId() == null || content.getImdbId().isBlank()) {
            throw new MovieNotFoundException("IMDb ID bulunamadı.");
        }
        OmdbDto movie = getMovieByImdbId(content.getImdbId());
        if (movie == null) {
            throw new MovieNotFoundException("OMDb verisi bulunamadı.");
        }
        content.setTitle(movie.getTitle());
        if (movie.getYear() != null && !movie.getYear().equals("N/A")) {
            String year = movie.getYear().replace("–", "-").trim();
            if (year.contains("-")) {
                year = year.split("-")[0].trim();
            }
            try {
                content.setYear(Integer.parseInt(year));
            } catch (NumberFormatException ignored) {}
        }
        content.setGenre(movie.getGenre());
        content.setType(movie.getType());
        content.setPoster(movie.getPoster());
        content.setRuntime(movie.getRuntime());
        content.setDirector(movie.getDirector());
        content.setWriter(movie.getWriter());
        content.setCountry(movie.getCountry());
        content.setLanguage(movie.getLanguage());
        content.setAwards(movie.getAwards());

        content.setActors(convertActors(movie.getActors()));
        content.setPlot(movie.getPlot());
        if (movie.getImdbRating() != null && !movie.getImdbRating().equals("N/A")) {
            try {
                content.setRating(Double.parseDouble(movie.getImdbRating().trim()));
            } catch (NumberFormatException ignored) {}
        }
        return repository.save(content);
    }

    public void syncAllContents() {
        List<Content> contents = repository.findAll();
        for (Content content : contents) {
            try {
                syncMovie(content.getId());
            } catch (Exception e) {
                System.err.println("Senkronizasyon hatası ID (" + content.getId() + "): " + e.getMessage());
            }
        }
    }

    private List<Actor> convertActors(String actorsText) {
        List<Actor> actors = new ArrayList<>();
        if (actorsText == null || actorsText.isBlank() || actorsText.equals("N/A")) {
            return actors;
        }
        for (String actorName : actorsText.split(",")) {
            final String name = actorName.trim();
            if (name.isBlank()) continue;
            Actor actor = actorRepository
                    .findByName(name)
                    .orElseGet(() -> actorRepository.save(new Actor(name)));
            actors.add(actor);
        }
        return actors;
    }

    private void saveEpisodes(Content content) {
        if (!"series".equalsIgnoreCase(content.getType())) {
            return;
        }
        OmdbDto series = getMovieByImdbId(content.getImdbId());
        if (series == null || series.getTotalSeasons() == null || series.getTotalSeasons().equals("N/A")) {
            return;
        }
        int totalSeasons = Integer.parseInt(series.getTotalSeasons().trim());
        for (int season = 1; season <= totalSeasons; season++) {
            String seasonUrl = "https://www.omdbapi.com/?apikey=" + apiKey + "&i=" + content.getImdbId() + "&Season=" + season;
            OmdbSeasonDto omdbSeason = restClient.get()
                    .uri(seasonUrl)
                    .retrieve()
                    .body(OmdbSeasonDto.class);
            if (omdbSeason == null || omdbSeason.getEpisodes() == null) {
                continue;
            }
            for (EpisodeDto dto : omdbSeason.getEpisodes()) {
                if (episodeRepository.existsByImdbId(dto.getImdbId())) {
                    continue;
                }
                Episode detail = new Episode();
                EpisodeDto episodeDetail = getEpisodeDetails(dto.getImdbId());

                detail.setImdbId(episodeDetail.getImdbId());
                detail.setTitle(episodeDetail.getTitle());
                detail.setPlot(episodeDetail.getPlot());
                detail.setPoster(episodeDetail.getPoster());
                detail.setRuntime(episodeDetail.getRuntime());
                try {
                    detail.setRating(Double.parseDouble(episodeDetail.getImdbRating().trim()));
                } catch (Exception ignored) {}
                detail.setSeasonNumber(season);
                try {
                    detail.setEpisodeNumber(Integer.parseInt(dto.getEpisode().trim()));
                } catch (Exception ignored) {}
                detail.setContent(content);
                episodeRepository.save(detail);
            }
        }
    }

    @Override
    public List<SeasonDto> getSeasons(String imdbId) {
        String url = "https://www.omdbapi.com/?apikey=" + apiKey + "&i=" + imdbId;
        OmdbDto series = restClient.get().uri(url).retrieve().body(OmdbDto.class);
        if (series == null || series.getTotalSeasons() == null) return Collections.emptyList();

        int total = Integer.parseInt(series.getTotalSeasons().trim());
        List<SeasonDto> seasons = new ArrayList<>();
        for (int i = 1; i <= total; i++) {
            String seasonUrl = "https://www.omdbapi.com/?apikey=" + apiKey + "&i=" + imdbId + "&Season=" + i;
            OmdbSeasonDto omdbSeason = restClient.get().uri(seasonUrl).retrieve().body(OmdbSeasonDto.class);
            if (omdbSeason != null) {
                SeasonDto dto = new SeasonDto();
                dto.setTitle(omdbSeason.getTitle());
                dto.setSeason(omdbSeason.getSeason());
                dto.setEpisodeCount(omdbSeason.getEpisodes() != null ? omdbSeason.getEpisodes().size() : 0);
                seasons.add(dto);
            }
        }
        return seasons;
    }

    private EpisodeDto getEpisodeDetails(String imdbId) {
        String url = "https://www.omdbapi.com/?apikey=" + apiKey + "&i=" + imdbId;
        return restClient.get().uri(url).retrieve().body(EpisodeDto.class);
    }

    @Override
    public SeasonDto getSeasonDetails(String imdbId, Integer season) {
        String seasonUrl = "https://www.omdbapi.com/?apikey=" + apiKey + "&i=" + imdbId + "&Season=" + season;
        OmdbSeasonDto omdbSeason = restClient.get().uri(seasonUrl).retrieve().body(OmdbSeasonDto.class);

        if (omdbSeason == null || omdbSeason.getEpisodes() == null) return new SeasonDto();

        List<EpisodeDto> detailedEpisodes = new ArrayList<>();
        for (EpisodeDto episode : omdbSeason.getEpisodes()) {
            EpisodeDto detail = getEpisodeDetails(episode.getImdbId());
            if (detail != null) {
                detailedEpisodes.add(detail);
            }
        }
        SeasonDto dto = new SeasonDto();
        dto.setTitle(omdbSeason.getTitle());
        dto.setSeason(omdbSeason.getSeason());
        dto.setEpisodeCount(omdbSeason.getEpisodes().size());
        dto.setEpisodes(detailedEpisodes);
        return dto;
    }

    @Override
    public Content createCustomContent(Content content) {
        content.setSource(ContentSource.CUSTOM);
        return repository.save(content);
    }

    @Override
    public List<SearchResultDto> searchAll(String title) {
        List<SearchResultDto> results = new ArrayList<>();
        Set<String> imdbIds = new HashSet<>();

        List<Content> databaseContents = repository.findByTitleContainingIgnoreCase(title);
        for (Content content : databaseContents) {
            SearchResultDto dto = new SearchResultDto();
            dto.setTitle(content.getTitle());
            dto.setYear(content.getYear() == null ? "" : content.getYear().toString());
            dto.setId(content.getId());
            dto.setPoster(content.getPoster());
            dto.setImdbId(content.getImdbId());
            dto.setType(content.getType());
            dto.setSource("DATABASE");
            results.add(dto);
            if (content.getImdbId() != null) {
                imdbIds.add(content.getImdbId());
            }
        }

        List<OmdbSearchItemDto> apiResults = searchMovies(title);
        for (OmdbSearchItemDto movie : apiResults) {
            if (movie.getImdbId() != null && imdbIds.contains(movie.getImdbId())) {
                continue;
            }
            SearchResultDto dto = new SearchResultDto();
            dto.setTitle(movie.getTitle());
            dto.setYear(movie.getYear());
            dto.setPoster(movie.getPoster());
            dto.setImdbId(movie.getImdbId());
            dto.setType(movie.getType());
            dto.setSource("EXTERNAL_API");
            results.add(dto);
        }
        return results;
    }

    @Override
    public MovieDetailDto getDetails(Integer id) {
        Content content = getById(id);
        MovieDetailDto dto = new MovieDetailDto();

        dto.setId(content.getId());
        dto.setImdbId(content.getImdbId());
        dto.setTitle(content.getTitle());
        dto.setYear(content.getYear());
        dto.setType(content.getType());
        dto.setRating(content.getRating());
        dto.setPoster(content.getPoster());
        dto.setGenre(content.getGenre());
        dto.setRuntime(content.getRuntime());
        dto.setDirector(content.getDirector());

        String actors = content.getActors()
                .stream()
                .map(Actor::getName)
                .reduce((a, b) -> a + ", " + b)
                .orElse("");

        dto.setActors(actors);
        dto.setPlot(content.getPlot());
        dto.setLanguage(content.getLanguage());
        dto.setCountry(content.getCountry());
        dto.setAwards(content.getAwards());
        dto.setStatus(content.getStatus());
        dto.setSource("DATABASE");

        return dto;
    }

    @Override
    public MovieDetailDto getOmdbDetails(String imdbId) {
        // 1. Önce TMDB'den veriyi çekmeyi dene
        MovieDetailDto tmdbDto = getTmdbDetailsByImdbId(imdbId);
        if (tmdbDto != null) {
            return tmdbDto;
        }

        // 2. TMDB başarısız olursa OMDb'ye düş (Fallback)
        OmdbDto movie = getMovieByImdbId(imdbId);
        if (movie == null) {
            return null;
        }

        MovieDetailDto dto = new MovieDetailDto();
        dto.setImdbId(movie.getImdbId());
        dto.setTitle(movie.getTitle());

        try {
            if (movie.getYear() != null && movie.getYear().length() >= 4) {
                dto.setYear(Integer.parseInt(movie.getYear().substring(0, 4).trim()));
            }
        } catch (Exception ignored) {}

        dto.setType(movie.getType());

        try {
            if (movie.getImdbRating() != null && !movie.getImdbRating().equals("N/A")) {
                dto.setRating(Double.parseDouble(movie.getImdbRating().trim()));
            }
        } catch (Exception ignored) {}

        dto.setPoster(movie.getPoster());
        dto.setGenre(movie.getGenre());
        dto.setRuntime(movie.getRuntime());
        dto.setDirector(movie.getDirector());
        dto.setActors(movie.getActors());
        dto.setPlot(movie.getPlot());
        dto.setLanguage(movie.getLanguage());
        dto.setCountry(movie.getCountry());
        dto.setAwards(movie.getAwards());
        dto.setSource("OMDB");

        return dto;
    }

    @Override
    public MovieDetailDto fetchFromTmdb(String title) {
        List<OmdbSearchItemDto> results = searchMovies(title);
        if (!results.isEmpty()) {
            return getOmdbDetails(results.get(0).getImdbId());
        }
        return null;
    }

    // TMDB ID'sinden IMDb ID elde eden yardımcı metot
    private String getImdbIdFromTmdb(Long tmdbId) {
        if (tmdbId == null || tmdbApiKey == null || tmdbApiKey.isBlank()) return null;
        try {
            String url = tmdbBaseUrl + "/movie/" + tmdbId + "?api_key=" + tmdbApiKey;
            Map<?, ?> response = restClient.get().uri(url).retrieve().body(Map.class);
            if (response != null && response.containsKey("imdb_id")) {
                return (String) response.get("imdb_id");
            }
        } catch (Exception ignored) {}
        return null;
    }

    // TMDB'den IMDb ID yardımıyla detay çeken özel yardımcı metot
    private MovieDetailDto getTmdbDetailsByImdbId(String imdbId) {
        if (tmdbApiKey == null || tmdbApiKey.isBlank() || imdbId == null || !imdbId.startsWith("tt")) {
            return null;
        }
        try {
            String url = tmdbBaseUrl + "/find/" + imdbId + "?api_key=" + tmdbApiKey + "&external_source=imdb_id";
            Map<?, ?> response = restClient.get().uri(url).retrieve().body(Map.class);
            if (response != null && response.containsKey("movie_results")) {
                List<?> movies = (List<?>) response.get("movie_results");
                if (!movies.isEmpty()) {
                    Map<?, ?> movie = (Map<?, ?>) movies.get(0);

                    OmdbDto omdbFallback = getMovieByImdbId(imdbId);
                    if (omdbFallback != null && omdbFallback.getTitle() != null) {
                        return null;
                    }

                    MovieDetailDto dto = new MovieDetailDto();
                    dto.setImdbId(imdbId);
                    dto.setTitle((String) movie.get("title"));
                    dto.setPlot((String) movie.get("overview"));

                    String posterPath = (String) movie.get("poster_path");
                    if (posterPath != null) {
                        dto.setPoster(tmdbImageBaseUrl + posterPath);
                    }

                    Object voteAvg = movie.get("vote_average");
                    if (voteAvg != null) {
                        dto.setRating(Double.parseDouble(voteAvg.toString().trim()));
                    }

                    String releaseDate = (String) movie.get("release_date");
                    if (releaseDate != null && releaseDate.contains("-")) {
                        try {
                            dto.setYear(Integer.parseInt(releaseDate.split("-")[0].trim()));
                        } catch (Exception ignored) {}
                    }

                    dto.setType("movie");
                    dto.setSource("EXTERNAL_API");
                    return dto;
                }
            }
        } catch (Exception e) {
            System.err.println("TMDB detay getirme hatası: " + e.getMessage());
        }
        return null;
    }
}