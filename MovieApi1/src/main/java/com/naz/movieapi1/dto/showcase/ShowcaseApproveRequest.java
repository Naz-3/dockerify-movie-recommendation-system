package com.naz.movieapi1.dto.showcase;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class ShowcaseApproveRequest {

    private String title;
    private List<Integer> movieIds;
    private LocalDate scheduledDate;

    public ShowcaseApproveRequest() {
    }
}