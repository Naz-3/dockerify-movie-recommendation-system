package com.naz.auth;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
interface UserRepository extends JpaRepository<UserAccount,Long> { Optional<UserAccount> findByUsername(String username); boolean existsByUsername(String username); boolean existsByEmail(String email); }
