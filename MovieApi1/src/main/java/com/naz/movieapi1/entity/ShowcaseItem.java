package com.naz.movieapi1.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "showcase_items")
public class ShowcaseItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "showcase_id")
    private Showcase showcase;

    @ManyToOne
    @JoinColumn(name = "content_id")
    private Content content;

    private Integer displayOrder;

    public ShowcaseItem() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Showcase getShowcase() { return showcase; }
    public void setShowcase(Showcase showcase) { this.showcase = showcase; }

    public Content getContent() { return content; }
    public void setContent(Content content) { this.content = content; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
}