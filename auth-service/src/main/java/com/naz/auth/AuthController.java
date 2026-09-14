package com.naz.auth;
import io.jsonwebtoken.Jwts; import io.jsonwebtoken.SignatureAlgorithm; import io.jsonwebtoken.io.Decoders; import io.jsonwebtoken.security.Keys;
import java.util.Date; import java.util.Map;
import org.springframework.http.*; import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/auth") public class AuthController {
 private final UserRepository users; private final BCryptPasswordEncoder encoder=new BCryptPasswordEncoder(); private final String secret;
 AuthController(UserRepository users, @org.springframework.beans.factory.annotation.Value("${jwt.secret}") String secret){this.users=users;this.secret=secret;}
 @PostMapping("/register") public ResponseEntity<?> register(@RequestBody RegisterRequest r){ if(users.existsByUsername(r.username())||users.existsByEmail(r.email())) return ResponseEntity.status(409).body(Map.of("message","username or email already exists")); UserAccount u=new UserAccount();u.username=r.username();u.email=r.email();u.passwordHash=encoder.encode(r.password());users.save(u);return ResponseEntity.ok(response(u)); }
 @PostMapping("/login") public ResponseEntity<?> login(@RequestBody LoginRequest r){ return users.findByUsername(r.username()).filter(u->encoder.matches(r.password(),u.passwordHash)).<ResponseEntity<?>>map(u->ResponseEntity.ok(response(u))).orElseGet(()->ResponseEntity.status(401).body(Map.of("message","invalid credentials"))); }
 private Map<String,String> response(UserAccount u){String t=Jwts.builder().setSubject(u.username).claim("role","ROLE_"+u.role).setIssuedAt(new Date()).setExpiration(new Date(System.currentTimeMillis()+86400000)).signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret)),SignatureAlgorithm.HS256).compact();return Map.of("token",t,"username",u.username,"role",u.role);}
 public record RegisterRequest(String username,String email,String password){} public record LoginRequest(String username,String password){}
}
