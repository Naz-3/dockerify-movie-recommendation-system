package com.naz.movieapi1.repositories;

import com.naz.movieapi1.Role;
import com.naz.movieapi1.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collection;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Giriş (Login) işlemleri için kullanıcı adı veya e-posta ile arama sorguları
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);

    // Kullanıcı adı veya e-posta önceden alınmış mı kontrolü
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);

    Collection<Object> findByRole(Role role);
}