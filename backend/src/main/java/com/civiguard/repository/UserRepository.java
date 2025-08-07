
package com.civiguard.repository;

import com.civiguard.model.User;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByAadhaar(String aadhaar);
    // Find users by verification status
    List<User> findByVerificationStatus(User.VerificationStatus verificationStatus);
    Page<User> findByVerificationStatus(User.VerificationStatus verificationStatus, Pageable pageable);
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(User.Role role);
    Page<User> findAll(Specification<User> spec, Pageable pageable);
}
