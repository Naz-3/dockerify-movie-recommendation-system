package com.naz.movieapi1.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "watch_histories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"user", "content"}) // prevents recursion in toString()
@EqualsAndHashCode(exclude = {"user", "content"}) // prevents recursing in hashCode()
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) // LAZY fetch kaynaklı Jackson serileştirme hatalarını önler
public class WatchHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore // User nesnesine geri serileştirmeyi önler
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_id", nullable = false)
    @JsonIgnore // Content nesnesine geçip JSON döngüsü ve veri şişmesi yaratmasını önler
    private Content content;

    private Integer watchedMinutes;
    private Boolean isLiked;

    // veritabanında saklayıp sorgularda doğrudan kullanacağız
    private Double completionRate;
    private Boolean isCompleted;

    private LocalDateTime watchedAt;

    public WatchHistory(User user, Content content, Integer watchedMinutes, Boolean isLiked) {
        this.user = user;
        this.content = content;
        this.watchedMinutes = watchedMinutes;
        this.isLiked = isLiked;
        this.watchedAt = LocalDateTime.now();
        calculateMetrics();
    }

    @PrePersist
    @PreUpdate
    public void calculateMetrics() {
        if (content != null && content.getDurationInMinutes() != null && content.getDurationInMinutes() > 0) {
            double rate = (double) (watchedMinutes != null ? watchedMinutes : 0) / content.getDurationInMinutes();
            this.completionRate = Math.min(1.0, rate);

            // içeriğin %90'ından fazlası izlendiyse tamamlandı
            this.isCompleted = this.completionRate >= 0.90;
        } else {
            this.completionRate = 0.0;
            this.isCompleted = false;
        }

        if (this.watchedAt == null) {
            this.watchedAt = LocalDateTime.now();
        }
    }
}