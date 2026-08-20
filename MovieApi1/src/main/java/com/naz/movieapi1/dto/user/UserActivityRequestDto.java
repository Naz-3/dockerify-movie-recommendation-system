package com.naz.movieapi1.dto.user;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserActivityRequestDto {
    private Long userId;
    private Long contentId;
    private Integer watchedMinutes; // İzlenen dakika bilgisi
    private Boolean isLiked;        // Beğenilip beğenilmediği (null gelebilir)
}
