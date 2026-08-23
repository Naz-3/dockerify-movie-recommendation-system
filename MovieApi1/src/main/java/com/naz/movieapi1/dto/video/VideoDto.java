package com.naz.movieapi1.dto.video;

public class VideoDto {
    private String id;
    private String key;
    private String name;
    private String type; // Trailer, Behind the Scenes, Teaser, Featurette vb.
    private String site; // YouTube
    private Boolean official;

    public VideoDto() {}

    public VideoDto(String id, String key, String name, String type, String site, Boolean official) {
        this.id = id;
        this.key = key;
        this.name = name;
        this.type = type;
        this.site = site;
        this.official = official;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getSite() { return site; }
    public void setSite(String site) { this.site = site; }

    public Boolean getOfficial() { return official; }
    public void setOfficial(Boolean official) { this.official = official; }
}