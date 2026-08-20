package com.naz.movieapi1.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.naz.movieapi1.Role;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password; //Spring Security entegrasyonunda BCrypt ile sifrelenmesi

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.USER;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnoreProperties({"user", "content"}) // veriler döngüde takılı kaldıgı icin eklendi
    private List<WatchHistory> watchHistories = new ArrayList<>();

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;//hesap suresi dolmadi
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;//hesap kilitli degil
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;// sifre suresi dolmadi
    }

    @Override
    public boolean isEnabled() {
        return true;//user aktif/etkin
    }
}
