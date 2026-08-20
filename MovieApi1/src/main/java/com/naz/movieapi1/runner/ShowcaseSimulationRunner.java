package com.naz.movieapi1.runner;

import com.naz.movieapi1.dto.showcase.ShowcaseSuggestionDto;
import com.naz.movieapi1.service.ShowcaseService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@Profile("dev") // Sadece 'dev' profili aktifken çalışır
public class ShowcaseSimulationRunner implements CommandLineRunner {

    private final ShowcaseService showcaseService;

    public ShowcaseSimulationRunner(ShowcaseService showcaseService) {
        this.showcaseService = showcaseService;
    }

    @Override
    public void run(String... args) {
        System.out.println("==========================================");
        System.out.println("🎬 VITRIN AKIŞ SİMÜLASYONU BAŞLADI");
        System.out.println("==========================================");

        try {
            // 1. Öneri Üret (Kullanıcı ID: 1L ve Şehir: Kastamonu)
            System.out.println("📍 1. Adım: Kastamonu için vitrin önerisi isteniyor...");
            ShowcaseSuggestionDto suggestion = showcaseService.generateWeatherBasedShowcase(1L, "Kastamonu");
            System.out.println("✅ Öneri Oluştu - ID: " + suggestion.getShowcaseId());
            System.out.println("   Başlık: " + suggestion.getTitle());
            System.out.println("   Tetikleme Sebebi: " + suggestion.getTriggerReason());
            System.out.println("   Önerilen Filmler: " + suggestion.getMovieTitles());

            // 2. Onayla
            System.out.println("\n📍 2. Adım: Taslak vitrin onaylanıyor...");
            showcaseService.approveShowcase(
                    suggestion.getShowcaseId(),
                    suggestion.getTitle() + " [EDITED]",
                    List.of(1, 2),
                    LocalDate.now().plusDays(1)
            );
            System.out.println("✅ Vitrin başarıyla onaylandı ve yarının tarihine planlandı.");

            System.out.println("==========================================");
            System.out.println("🎬 SİMÜLASYON BAŞARIYLA TAMAMLANDI");
            System.out.println("==========================================");

        } catch (Exception e) {
            System.err.println("❌ Simülasyon sırasında hata: " + e.getMessage());
        }
    }
}