package com.example.pedidos.Models;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "O nome não pode estar em branco.")
    @Size(max = 100, message = "O nome deve ter no máximo 100 caracteres.")
    @Column(nullable = false, length = 100)
    private String nome;

    @Email(message = "O e-mail deve ser válido.")
    @NotBlank(message = "O e-mail é obrigatório.")
    @Size(max = 150, message = "O e-mail deve ter no máximo 150 caracteres.")
    @Column(unique = true, nullable = false, length = 150)
    private String email;

    @NotBlank(message = "A senha é obrigatória.")
    @Size(min = 8, max = 20, message = "A senha deve ter entre 8 e 20 caracteres.")
    @Column(nullable = false, length = 20)
    private String senha;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }
}
