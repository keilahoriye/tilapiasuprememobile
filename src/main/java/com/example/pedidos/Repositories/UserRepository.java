package com.example.pedidos.Repositories;

import com.example.pedidos.Models.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByEmailAndSenha(String email, String senha);
}