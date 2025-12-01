package com.example.pedidos.Models;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDateTime;

@Entity
public class Cliente {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "O nome não pode estar em branco")
    @Size(max = 100, message = "O nome deve ter no máximo 100 caracteres")
    private String nome;

    @NotBlank(message = "O telefone não pode estar em branco")
    @Size(max = 20, message = "O telefone deve ter no máximo 20 caracteres")
    private String telefone;

    @NotBlank(message = "O endereço não pode estar em branco")
    @Size(max = 200, message = "O endereço deve ter no máximo 200 caracteres")
    private String endereco;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime data;

    public Cliente(Long id, String nome, String telefone, String endereco, LocalDateTime data) {
        this.id = id;
        this.nome = nome;
        this.telefone = telefone;
        this.endereco = endereco;
        this.data = data;
    }

    public Cliente() {}

    public Long getId() { return this.id; }
    public String getNome() { return this.nome; }
    public String getTelefone() { return this.telefone; }
    public String getEndereco() { return this.endereco; }
    public LocalDateTime getData() { return this.data; }

    public void setId(Long id) { this.id = id; }
    public void setNome(String nome) { this.nome = nome; }
    public void setTelefone(String telefone) { this.telefone = telefone; }
    public void setEndereco(String endereco) { this.endereco = endereco; }
    public void setData(LocalDateTime data) { this.data = data; }
}
