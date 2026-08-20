package com.naz.movieapi1.config;

import com.naz.movieapi1.Role;
import com.naz.movieapi1.entity.Content;
import com.naz.movieapi1.entity.User;
import com.naz.movieapi1.entity.WatchHistory;
import com.naz.movieapi1.repositories.ContentRepository;
import com.naz.movieapi1.repositories.UserRepository;
import com.naz.movieapi1.repositories.WatchHistoryRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final ContentRepository contentRepository;
    private final WatchHistoryRepository watchHistoryRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; //BCrypt için enjekte

    public DataSeeder(ContentRepository contentRepository,
                      WatchHistoryRepository watchHistoryRepository,
                      UserRepository userRepository,
                      PasswordEncoder passwordEncoder) {
        this.contentRepository = contentRepository;
        this.watchHistoryRepository = watchHistoryRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // 1. Varsayılan ADMIN ve USER hesaplarını kontrol et ve ekle
        seedUsers();

        // 2. Eğer veritabanında içerik yoksa mock verileri doldur
        if (contentRepository.count() == 0) {
            seedContents();
        }

        // 3. Eğer izleme geçmişi yoksa örnek kullanıcı simülasyonunu çalıştır
        if (watchHistoryRepository.count() == 0) {
            seedWatchHistory();
        }

        // 3. Eski seed içeriklerinde poster eksikse tamamla
        fixSeededPosters();
    }

    private void seedUsers() {
        // ADMIN Hesabı Oluşturma
        if (userRepository.findByRole(Role.ADMIN).isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@movieapi.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);
            System.out.println("✅ Varsayılan ADMIN hesabı oluşturuldu (admin / admin123)");
        }

        // TEST USER Hesabı Oluşturma
        if (!userRepository.existsByUsername("testuser")) {
            User testUser = new User();
            testUser.setUsername("testuser");
            testUser.setEmail("test@example.com");
            testUser.setPassword(passwordEncoder.encode("123456"));
            testUser.setRole(Role.USER);
            userRepository.save(testUser);
            System.out.println("✅ Varsayılan TEST USER hesabı oluşturuldu (testuser / 123456)");
        }
    }

    private void seedContents() {
        Content c1 = createContent("Inception", "Sci-Fi, Thriller", 148, "2010", "8.8", "Movie", "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg");
        Content c2 = createContent("Interstellar", "Sci-Fi, Drama", 169, "2014", "8.7", "Movie", "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg");
        Content c3 = createContent("The Dark Knight", "Action, Crime", 152, "2008", "9.0", "Movie", "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg");
        Content c4 = createContent("The Notebook", "Romance, Drama", 123, "2004", "7.8", "Movie", "https://image.tmdb.org/t/p/w500/rNzQyW4f8B8c3f5K2xV6d2K2J4W.jpg");
        Content c5 = createContent("Hangover", "Comedy", 100, "2009", "7.7", "Movie", "https://image.tmdb.org/t/p/w500/uluhlXubGu1VxU63X9VHCLWDAYP.jpg");
        Content c6 = createContent("Shutter Island", "Mystery, Thriller", 138, "2010", "8.2", "Movie", "https://image.tmdb.org/t/p/w500/nrmXQ0zcZUL8jFLrakWc90IR8z9.jpg");
        Content c7 = createContent("Coherence", "Sci-Fi, Mystery", 89, "2013", "7.2", "Movie", "https://image.tmdb.org/t/p/w500/p7O7pPd6UQDwR56Yn6A8Y5afmNp.jpg");
        Content c8 = createContent("La La Land", "Comedy, Drama, Romance", 128, "2016", "8.0", "Movie", "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg");

        contentRepository.saveAll(List.of(c1, c2, c3, c4, c5, c6, c7, c8));
        System.out.println("✅ 8 adet mock film/dizi veritabanına eklendi.");
    }

    private void seedWatchHistory() {
        List<Content> contents = contentRepository.findAll();
        if (contents.isEmpty()) return;

        // Test kullanıcımızı veritabanından buluyoruz, yoksa yenisini oluşturuyoruz
        User simUser = userRepository.findById(1L)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setUsername("testuser");
                    newUser.setEmail("test@example.com");
                    newUser.setPassword("123456");
                    return userRepository.save(newUser);
                });

        // SİMÜLASYON SENARYOSU:
        // Kullanıcı Sci-Fi filmlerini sonuna kadar izliyor ve beğeniyor (Sci-Fi puanı yükselir).
        // Romance filmini 10. dakikada kapatıyor (Romance puanı düşer / ceza alır).

        for (Content content : contents) {
            if ("Inception".equals(content.getTitle())) {
                // %90 tamamlama oranı (135/148 dk) + Liked = Yüksek Sci-Fi Skoru
                watchHistoryRepository.save(new WatchHistory(simUser, content, 135, true));
            } else if ("Interstellar".equals(content.getTitle())) {
                // %95 tamamlama oranı (160/169 dk) + Liked = Yüksek Sci-Fi & Drama Skoru
                watchHistoryRepository.save(new WatchHistory(simUser, content, 160, true));
            } else if ("The Notebook".equals(content.getTitle())) {
                // ERKEN ÇIKIŞ: %8 tamamlama oranı (10/123 dk) + Unliked = Erken çıkış cezası
                watchHistoryRepository.save(new WatchHistory(simUser, content, 10, false));
            }
        }

        System.out.println("✅ Kullanıcı 1 (userId=" + simUser.getId() + ") için izleme geçmişi simüle edildi.");
    }

    private Content createContent(String title, String genre, int duration, String year, String rating, String type, String poster) {
        Content c = new Content();
        c.setTitle(title);
        c.setGenre(genre);
        c.setDurationInMinutes(duration);
        c.setYear(Integer.valueOf(year));
        c.setRating(Double.valueOf(rating));
        c.setType(type);
        c.setPoster(poster);
        return c;
    }

    private void fixSeededPosters() {
        updatePosterIfMissing(
                "Inception",
                "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg"
        );
        updatePosterIfMissing(
                "Interstellar",
                "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
        );
        updatePosterIfMissing(
                "The Dark Knight",
                "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg"
        );
        updatePosterIfMissing(
                "The Notebook",
                "https://image.tmdb.org/t/p/w500/rNzQyW4f8B8c3f5K2xV6d2K2J4W.jpg"
        );
        updatePosterIfMissing(
                "Hangover",
                "https://image.tmdb.org/t/p/w500/uluhlXubGu1VxU63X9VHCLWDAYP.jpg"
        );
        updatePosterIfMissing(
                "Shutter Island",
                "https://image.tmdb.org/t/p/w500/nrmXQ0zcZUL8jFLrakWc90IR8z9.jpg"
        );
        updatePosterIfMissing(
                "Coherence",
                "https://image.tmdb.org/t/p/w500/p7O7pPd6UQDwR56Yn6A8Y5afmNp.jpg"
        );
        updatePosterIfMissing(
                "La La Land",
                "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg"
        );
    }

    private void updatePosterIfMissing(String title, String posterUrl) {
        contentRepository.findAll()
                .stream()
                .filter(content ->
                        content.getTitle() != null &&
                                content.getTitle().equalsIgnoreCase(title)
                )
                .findFirst()
                .ifPresent(content -> {

                    if (content.getPoster() == null ||
                            content.getPoster().isBlank()) {

                        content.setPoster(posterUrl);
                        contentRepository.save(content);

                        System.out.println(
                                "🖼️ " + title + " poster bilgisi güncellendi."
                        );
                    }
                });
    }
}