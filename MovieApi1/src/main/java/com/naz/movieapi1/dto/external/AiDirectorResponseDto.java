package com.naz.movieapi1.dto.external;

import java.util.List;

public class AiDirectorResponseDto {
    private String title;
    private String reason;
    private List<Integer> selectedContentIds;
    public AiDirectorResponseDto() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public List<Integer> getSelectedContentIds() { return selectedContentIds; }
    public void setSelectedContentIds(List<Integer> selectedContentIds) { this.selectedContentIds = selectedContentIds; }
}