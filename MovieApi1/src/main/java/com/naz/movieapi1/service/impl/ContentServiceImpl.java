package com.naz.movieapi1.service.impl;

import com.naz.movieapi1.ContentSource;
import com.naz.movieapi1.dto.omdb.OmdbDto;
import com.naz.movieapi1.dto.omdb.OmdbSearchItemDto;
import com.naz.movieapi1.dto.omdb.OmdbSearchResponseDto;
import com.naz.movieapi1.dto.video.TmdbVideoResponseDto;
import com.naz.movieapi1.dto.video.VideoDto;
import com.naz.movieapi1.entity.Content;
import com.naz.movieapi1.entity.Actor;
import com.naz.movieapi1.entity.Episode;
import com.naz.movieapi1.exception.MovieAlreadyExistsException;
import com.naz.movieapi1.exception.MovieNotFoundException;
import com.naz.movieapi1.repositories.ContentRepository;
import com.naz.movieapi1.repositories.ActorRepository;
import com.naz.movieapi1.repositories.EpisodeRepository;
import com.naz.movieapi1.service.ContentService;
import com.naz.movieapi1.dto.omdb.OmdbSeasonDto;
import com.naz.movieapi1.dto.SeasonDto;
import com.naz.movieapi1.dto.EpisodeDto;
import com.naz.movieapi1.dto.search.SearchResultDto;
import com.naz.movieapi1.dto.details.MovieDetailDto;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.*;
import java.util.stream.Collectors;

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

    @Override
    @Transactional(readOnly = true)
    public List<MovieDetailDto> getAllDetails() {
        return repository.findAllWithActors().stream()
                .map(this::mapToMovieDetailDto)
                .collect(Collectors.toList());
    }

    private MovieDetailDto mapToMovieDetailDto(Content content) {
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

        String actors = "";
        if (content.getActors() != null && !content.getActors().isEmpty()) {
            actors = content.getActors().stream()
                    .filter(actor -> actor != null && actor.getName() != null)
                    .map(Actor::getName)
                    .collect(Collectors.joining(", "));
        }
        dto.setActors(actors);
        dto.setPlot(content.getPlot());
        dto.setLanguage(content.getLanguage());
        dto.setCountry(content.getCountry());
        dto.setAwards(content.getAwards());
        dto.setStatus(content.getStatus());
        dto.setSource("DATABASE");

        if (content.getRuntime() != null && content.getRuntime().contains("min")) {
            try {
                dto.setTotalMinutes(Integer.parseInt(content.getRuntime().replace("min", "").trim()));
            } catch (Exception ignored) {}
        } else {
            dto.setTotalMinutes("series".equalsIgnoreCase(content.getType()) ? 450 : 120);
        }

        if (content.getImdbId() != null) {
            dto.setVideos(fetchVideosByImdbId(content.getImdbId()));
        }

        return dto;
    }

    private List<VideoDto> fetchVideosByImdbId(String imdbId) {
        if (tmdbApiKey == null || tmdbApiKey.isBlank() || imdbId == null) return Collections.emptyList();
        try {
            String findUrl = tmdbBaseUrl + "/find/" + imdbId + "?api_key=" + tmdbApiKey + "&external_source=imdb_id";
            Map<?, ?> findResponse = restClient.get().uri(findUrl).retrieve().body(Map.class);

            if (findResponse != null) {
                List<?> movies = (List<?>) findResponse.get("movie_results");
                List<?> tvShows = (List<?>) findResponse.get("tv_results");

                Long tmdbId = null;
                String type = "movie";

                if (movies != null && !movies.isEmpty()) {
                    tmdbId = ((Number) ((Map<?, ?>) movies.get(0)).get("id")).longValue();
                } else if (tvShows != null && !tvShows.isEmpty()) {
                    tmdbId = ((Number) ((Map<?, ?>) tvShows.get(0)).get("id")).longValue();
                    type = "tv";
                }

                if (tmdbId != null) {
                    String vidUrl = String.format("%s/%s/%d/videos?api_key=%s&language=en-US", tmdbBaseUrl, type, tmdbId, tmdbApiKey);
                    TmdbVideoResponseDto vidRes = restClient.get().uri(vidUrl).retrieve().body(TmdbVideoResponseDto.class);
                    if (vidRes != null && vidRes.getResults() != null) {
                        return vidRes.getResults();
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("TMDB Videolar Çekilemedi: " + e.getMessage());
        }
        return Collections.emptyList();
    }

    @Override
    public Content getById(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new MovieNotFoundException("İçerik bulunamadı."));
    }

    @Override
    public Content save(Content content) {
        return repository.save(content);
    }

    @Override
    public void delete(Integer id) {
        Content content = getById(id);
        repository.delete(content);
    }

    @Override
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
            actorNames = updated.getActors().stream()
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
        if (tmdbApiKey != null && !tmdbApiKey.isBlank()) {
            try {
                String tmdbUrl = tmdbBaseUrl + "/search/multi?api_key=" + tmdbApiKey + "&query=" + title;
                Map<?, ?> response = restClient.get().uri(tmdbUrl).retrieve().body(Map.class);

                if (response != null && response.containsKey("results")) {
                    List<?> results = (List<?>) response.get("results");
                    List<OmdbSearchItemDto> searchItems = new ArrayList<>();

                    for (Object obj : results) {
                        Map<?, ?> itemMap = (Map<?, ?>) obj;
                        String mediaType = (String) itemMap.get("media_type");

                        if ("movie".equalsIgnoreCase(mediaType) || "tv".equalsIgnoreCase(mediaType)) {
                            OmdbSearchItemDto item = new OmdbSearchItemDto();
                            String name = "movie".equals(mediaType) ? (String) itemMap.get("title") : (String) itemMap.get("name");
                            item.setTitle(name);

                            String dateKey = "movie".equals(mediaType) ? "release_date" : "first_air_date";
                            String releaseDate = (String) itemMap.get(dateKey);
                            item.setYear(releaseDate != null && releaseDate.contains("-") ? releaseDate.split("-")[0] : "");

                            String posterPath = (String) itemMap.get("poster_path");
                            item.setPoster(posterPath != null ? tmdbImageBaseUrl + posterPath : null);
                            item.setType("movie".equals(mediaType) ? "movie" : "series");

                            Long tmdbId = ((Number) itemMap.get("id")).longValue();
                            String imdbId = getImdbIdFromTmdb(tmdbId, mediaType);
                            item.setImdbId(imdbId != null ? imdbId : String.valueOf(tmdbId));

                            searchItems.add(item);
                        }
                    }
                    if (!searchItems.isEmpty()) return searchItems;
                }
            } catch (Exception e) {
                System.err.println("TMDB arama hatası: " + e.getMessage());
            }
        }

        try {
            String url = "https://www.omdbapi.com/?apikey=" + apiKey + "&s=" + title;
            OmdbSearchResponseDto response = restClient.get().uri(url).retrieve().body(OmdbSearchResponseDto.class);
            return (response == null || response.getSearch() == null) ? Collections.emptyList() : response.getSearch();
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    @Override
    public OmdbDto getMovieByImdbId(String imdbId) {
        try {
            String url = "https://www.omdbapi.com/?apikey=" + apiKey + "&i=" + imdbId;
            return restClient.get().uri(url).retrieve().body(OmdbDto.class);
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public Content importMovie(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new MovieNotFoundException("Geçersiz film tanımlayıcısı.");
        }

        if (!identifier.startsWith("tt") && identifier.matches("\\d+")) {
            return importTmdbMovie(identifier);
        }

        if (repository.existsByImdbId(identifier)) {
            throw new MovieAlreadyExistsException("Bu içerik zaten kayıtlı: " + identifier);
        }

        Content content = new Content();
        content.setImdbId(identifier);

        MovieDetailDto tmdbDetails = getTmdbDetailsByImdbId(identifier);

        if (tmdbDetails != null) {
            content.setTitle(tmdbDetails.getTitle());
            content.setYear(tmdbDetails.getYear());
            content.setGenre(tmdbDetails.getGenre());
            content.setType(tmdbDetails.getType());
            content.setPoster(tmdbDetails.getPoster());
            content.setRating(tmdbDetails.getRating());
            content.setPlot(tmdbDetails.getPlot());
            content.setActors(convertActors(tmdbDetails.getActors()));
            content.setSource(ContentSource.OMDB);
        } else {
            OmdbDto movie = getMovieByImdbId(identifier);
            if (movie == null || movie.getTitle() == null) {
                throw new MovieNotFoundException("Film detayları alınamadı: " + identifier);
            }

            content.setTitle(movie.getTitle());
            content.setSource(ContentSource.OMDB);

            if (movie.getYear() != null && !movie.getYear().equals("N/A")) {
                String year = movie.getYear().replace("–", "-").trim();
                if (year.contains("-")) year = year.split("-")[0].trim();
                try { content.setYear(Integer.parseInt(year)); } catch (NumberFormatException ignored) {}
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
                try { content.setRating(Double.parseDouble(movie.getImdbRating().trim())); } catch (NumberFormatException ignored) {}
            }
        }

        content.setStatus("İzlenecek");
        Content savedContent = repository.save(content);
        try {
            saveEpisodes(savedContent);
        } catch (Exception e) {
            System.err.println("Bölüm bilgileri kaydedilirken hata: " + e.getMessage());
        }
        return savedContent;
    }

    @Override
    public Content importTmdbMovie(String tmdbId) {
        if (tmdbId == null || tmdbId.isBlank()) throw new MovieNotFoundException("TMDb ID boş olamaz.");

        try {
            Long numericTmdbId = Long.parseLong(tmdbId.trim());
            String imdbId = getImdbIdFromTmdb(numericTmdbId, "movie");
            if (imdbId != null && !imdbId.isBlank()) return importMovie(imdbId);
        } catch (NumberFormatException ignored) {}

        String fallbackImdbId = "tmdb-" + tmdbId.trim();
        if (repository.existsByImdbId(fallbackImdbId)) throw new MovieAlreadyExistsException("Bu içerik zaten kayıtlı.");

        Content content = new Content();
        content.setImdbId(fallbackImdbId);

        try {
            String url = tmdbBaseUrl + "/movie/" + tmdbId + "?api_key=" + tmdbApiKey;
            Map<?, ?> response = restClient.get().uri(url).retrieve().body(Map.class);

            if (response != null && response.containsKey("title")) {
                content.setTitle((String) response.get("title"));
                content.setPlot((String) response.get("overview"));
                String posterPath = (String) response.get("poster_path");
                if (posterPath != null) content.setPoster(tmdbImageBaseUrl + posterPath);

                String releaseDate = (String) response.get("release_date");
                if (releaseDate != null && releaseDate.contains("-")) {
                    content.setYear(Integer.parseInt(releaseDate.split("-")[0].trim()));
                }
                Object voteAvg = response.get("vote_average");
                if (voteAvg != null) content.setRating(Double.parseDouble(voteAvg.toString().trim()));

                content.setType("movie");
                content.setSource(ContentSource.OMDB);
                content.setStatus("İzlenecek");
                return repository.save(content);
            }
        } catch (Exception e) {
            throw new MovieNotFoundException("TMDb'den çekilemedi: " + e.getMessage());
        }
        throw new MovieNotFoundException("Film bulunamadı.");
    }

    @Override
    @Transactional
    public List<Content> importBulkMovies(List<String> imdbIds) {
        if (imdbIds == null || imdbIds.isEmpty()) return Collections.emptyList();
        List<Content> contentsToSave = new ArrayList<>();
        for (String imdbId : imdbIds) {
            if (imdbId == null || imdbId.isBlank()) continue;
            try {
                if (!repository.existsByImdbId(imdbId)) {
                    Content imported = importMovie(imdbId.trim());
                    if (imported != null) contentsToSave.add(imported);
                }
            } catch (Exception ignored) {}
        }
        return contentsToSave;
    }

    @Override
    @Transactional
    public List<Content> importBulkTmdbMovies(List<String> tmdbIds) {
        if (tmdbIds == null || tmdbIds.isEmpty()) return Collections.emptyList();
        List<Content> contentsToSave = new ArrayList<>();
        for (String tmdbId : tmdbIds) {
            if (tmdbId == null || tmdbId.isBlank()) continue;
            try {
                Content imported = importTmdbMovie(tmdbId.trim());
                if (imported != null) contentsToSave.add(imported);
            } catch (Exception ignored) {}
        }
        return contentsToSave;
    }

    @Override
    public Content updateStatus(Integer id, String status) {
        Content content = getById(id);
        content.setStatus(status);
        return repository.save(content);
    }

    @Override
    public Content syncMovie(Integer id) {
        Content content = getById(id);
        if (content.getImdbId() == null || content.getImdbId().isBlank()) {
            throw new MovieNotFoundException("IMDb ID bulunamadı.");
        }
        OmdbDto movie = getMovieByImdbId(content.getImdbId());
        if (movie == null || movie.getTitle() == null) {
            throw new MovieNotFoundException("OMDb verisi alınamadı.");
        }
        content.setTitle(movie.getTitle());
        if (movie.getYear() != null && !movie.getYear().equals("N/A")) {
            String year = movie.getYear().replace("–", "-").trim();
            if (year.contains("-")) year = year.split("-")[0].trim();
            try { content.setYear(Integer.parseInt(year)); } catch (NumberFormatException ignored) {}
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
            try { content.setRating(Double.parseDouble(movie.getImdbRating().trim())); } catch (NumberFormatException ignored) {}
        }
        return repository.save(content);
    }

    @Override
    public void syncAllContents() {
        List<Content> contents = repository.findAll();
        for (Content content : contents) {
            try { syncMovie(content.getId()); } catch (Exception ignored) {}
        }
    }

    private List<Actor> convertActors(String actorsText) {
        List<Actor> actors = new ArrayList<>();
        if (actorsText == null || actorsText.isBlank() || actorsText.equals("N/A")) return actors;
        for (String actorName : actorsText.split(",")) {
            final String name = actorName.trim();
            if (name.isBlank()) continue;
            Actor actor = actorRepository.findByName(name).orElseGet(() -> actorRepository.save(new Actor(name)));
            actors.add(actor);
        }
        return actors;
    }

    private void saveEpisodes(Content content) {
        if (!"series".equalsIgnoreCase(content.getType())) return;

        OmdbDto series = getMovieByImdbId(content.getImdbId());
        if (series == null || series.getTotalSeasons() == null || series.getTotalSeasons().equals("N/A")) return;

        int totalSeasons = Integer.parseInt(series.getTotalSeasons().trim());
        for (int season = 1; season <= totalSeasons; season++) {
            try {
                String seasonUrl = "https://www.omdbapi.com/?apikey=" + apiKey + "&i=" + content.getImdbId() + "&Season=" + season;
                OmdbSeasonDto omdbSeason = restClient.get().uri(seasonUrl).retrieve().body(OmdbSeasonDto.class);
                if (omdbSeason == null || omdbSeason.getEpisodes() == null) continue;

                for (EpisodeDto dto : omdbSeason.getEpisodes()) {
                    if (episodeRepository.existsByImdbId(dto.getImdbId())) continue;

                    Episode detail = new Episode();
                    EpisodeDto episodeDetail = getEpisodeDetails(dto.getImdbId());

                    if (episodeDetail != null) {
                        detail.setImdbId(episodeDetail.getImdbId());
                        detail.setTitle(episodeDetail.getTitle());
                        detail.setPlot(episodeDetail.getPlot());
                        detail.setPoster(episodeDetail.getPoster());
                        detail.setRuntime(episodeDetail.getRuntime());
                        try { detail.setRating(Double.parseDouble(episodeDetail.getImdbRating().trim())); } catch (Exception ignored) {}
                        detail.setSeasonNumber(season);
                        try { detail.setEpisodeNumber(Integer.parseInt(dto.getEpisode().trim())); } catch (Exception ignored) {}
                        detail.setContent(content);
                        episodeRepository.save(detail);
                    }
                }
            } catch (Exception e) {
                System.err.println("Sezon " + season + " eklenirken hata: " + e.getMessage());
            }
        }
    }

    @Override
    public List<SeasonDto> getSeasons(String imdbId) {
        try {
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
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private EpisodeDto getEpisodeDetails(String imdbId) {
        try {
            String url = "https://www.omdbapi.com/?apikey=" + apiKey + "&i=" + imdbId;
            return restClient.get().uri(url).retrieve().body(EpisodeDto.class);
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public SeasonDto getSeasonDetails(String imdbId, Integer season) {
        try {
            String seasonUrl = "https://www.omdbapi.com/?apikey=" + apiKey + "&i=" + imdbId + "&Season=" + season;
            OmdbSeasonDto omdbSeason = restClient.get().uri(seasonUrl).retrieve().body(OmdbSeasonDto.class);
            if (omdbSeason == null || omdbSeason.getEpisodes() == null) return new SeasonDto();

            List<EpisodeDto> detailedEpisodes = new ArrayList<>();
            for (EpisodeDto episode : omdbSeason.getEpisodes()) {
                EpisodeDto detail = getEpisodeDetails(episode.getImdbId());
                if (detail != null) detailedEpisodes.add(detail);
            }
            SeasonDto dto = new SeasonDto();
            dto.setTitle(omdbSeason.getTitle());
            dto.setSeason(omdbSeason.getSeason());
            dto.setEpisodeCount(omdbSeason.getEpisodes().size());
            dto.setEpisodes(detailedEpisodes);
            return dto;
        } catch (Exception e) {
            return new SeasonDto();
        }
    }

    @Override
    public List<VideoDto> getSeasonVideos(String imdbId, Integer season) {
        if (imdbId == null || imdbId.isBlank() || season == null || tmdbApiKey == null || tmdbApiKey.isBlank()) {
            return Collections.emptyList();
        }
        try {
            String findUrl = tmdbBaseUrl + "/find/" + imdbId + "?api_key=" + tmdbApiKey + "&external_source=imdb_id";
            Map<?, ?> findResponse = restClient.get().uri(findUrl).retrieve().body(Map.class);

            if (findResponse != null && findResponse.containsKey("tv_results")) {
                List<?> tvResults = (List<?>) findResponse.get("tv_results");
                if (tvResults != null && !tvResults.isEmpty()) {
                    Map<?, ?> tvShow = (Map<?, ?>) tvResults.get(0);
                    Long tmdbTvId = ((Number) tvShow.get("id")).longValue();

                    String videoUrl = String.format("%s/tv/%d/season/%d/videos?api_key=%s&language=en-US",
                            tmdbBaseUrl, tmdbTvId, season, tmdbApiKey);

                    TmdbVideoResponseDto response = restClient.get().uri(videoUrl).retrieve().body(TmdbVideoResponseDto.class);
                    if (response != null && response.getResults() != null) {
                        return response.getResults();
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Sezon videoları çekilemedi: " + e.getMessage());
        }
        return Collections.emptyList();
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
            if (content.getImdbId() != null) imdbIds.add(content.getImdbId());
        }

        List<OmdbSearchItemDto> apiResults = searchMovies(title);
        for (OmdbSearchItemDto movie : apiResults) {
            if (movie.getImdbId() != null && imdbIds.contains(movie.getImdbId())) continue;
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
        return mapToMovieDetailDto(content);
    }

    @Override
    public MovieDetailDto getOmdbDetails(String imdbId) {
        MovieDetailDto tmdbDto = getTmdbDetailsByImdbId(imdbId);
        if (tmdbDto != null) return tmdbDto;

        OmdbDto movie = getMovieByImdbId(imdbId);
        if (movie == null) return null;

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
        dto.getGenre();
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
        if (!results.isEmpty()) return getOmdbDetails(results.get(0).getImdbId());
        return null;
    }

    private String getImdbIdFromTmdb(Long tmdbId, String mediaType) {
        if (tmdbId == null || tmdbApiKey == null || tmdbApiKey.isBlank()) return null;
        try {
            String endpoint = "tv".equalsIgnoreCase(mediaType) ? "/tv/" : "/movie/";
            String url = tmdbBaseUrl + endpoint + tmdbId + "/external_ids?api_key=" + tmdbApiKey;
            Map<?, ?> response = restClient.get().uri(url).retrieve().body(Map.class);
            if (response != null && response.containsKey("imdb_id")) {
                return (String) response.get("imdb_id");
            }
        } catch (Exception ignored) {}
        return null;
    }

    private MovieDetailDto getTmdbDetailsByImdbId(String imdbId) {
        if (tmdbApiKey == null || tmdbApiKey.isBlank() || imdbId == null) return null;
        try {
            String url = tmdbBaseUrl + "/find/" + imdbId + "?api_key=" + tmdbApiKey + "&external_source=imdb_id";
            Map<?, ?> response = restClient.get().uri(url).retrieve().body(Map.class);

            if (response != null) {
                List<?> movies = (List<?>) response.get("movie_results");
                List<?> tvShows = (List<?>) response.get("tv_results");

                Map<?, ?> item = null;
                String type = "movie";

                if (movies != null && !movies.isEmpty()) {
                    item = (Map<?, ?>) movies.get(0);
                    type = "movie";
                } else if (tvShows != null && !tvShows.isEmpty()) {
                    item = (Map<?, ?>) tvShows.get(0);
                    type = "series";
                }

                if (item != null) {
                    MovieDetailDto dto = new MovieDetailDto();
                    dto.setImdbId(imdbId);
                    dto.setTitle((String) item.get("movie".equals(type) ? "title" : "name"));
                    dto.setPlot((String) item.get("overview"));

                    String posterPath = (String) item.get("poster_path");
                    if (posterPath != null) dto.setPoster(tmdbImageBaseUrl + posterPath);

                    Object voteAvg = item.get("vote_average");
                    if (voteAvg != null) dto.setRating(Double.parseDouble(voteAvg.toString().trim()));

                    String date = (String) item.get("movie".equals(type) ? "release_date" : "first_air_date");
                    if (date != null && date.contains("-")) {
                        try { dto.setYear(Integer.parseInt(date.split("-")[0].trim())); } catch (Exception ignored) {}
                    }

                    dto.setType(type);
                    Long tmdbId = ((Number) item.get("id")).longValue();
                    
                    fetchActorsFromTmdb(dto, tmdbId, "series".equals(type) ? "tv" : "movie");
                    dto.setVideos(fetchVideosByImdbId(imdbId));

                    dto.setSource("EXTERNAL_API");
                    return dto;
                }
            }
        } catch (Exception e) {
            System.err.println("TMDB detay hatası: " + e.getMessage());
        }
        return null;
    }

    private void fetchActorsFromTmdb(MovieDetailDto dto, Long tmdbId, String type) {
        try {
            String creditsUrl = String.format("%s/%s/%d/credits?api_key=%s", tmdbBaseUrl, type, tmdbId, tmdbApiKey);
            Map<?, ?> creditsResponse = restClient.get().uri(creditsUrl).retrieve().body(Map.class);
            if (creditsResponse != null && creditsResponse.containsKey("cast")) {
                List<?> cast = (List<?>) creditsResponse.get("cast");
                String actors = cast.stream()
                        .limit(5)
                        .map(c -> (String) ((Map<?, ?>) c).get("name"))
                        .collect(Collectors.joining(", "));
                dto.setActors(actors);
            }
        } catch (Exception ignored) {}
    }
}