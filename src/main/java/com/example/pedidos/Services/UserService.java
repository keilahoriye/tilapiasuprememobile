package com.example.pedidos.Services;

import com.example.pedidos.Models.User;
import com.example.pedidos.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    public User autenticar(String email, String senha) {
        return userRepository.findByEmailAndSenha(email, senha);
    }
}
