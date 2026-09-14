package com.naz.auth;
import jakarta.persistence.*;
@Entity @Table(name="users") public class UserAccount { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id; @Column(unique=true,nullable=false) public String username; @Column(unique=true,nullable=false) public String email; @Column(nullable=false) public String passwordHash; @Column(nullable=false) public String role="USER"; }
