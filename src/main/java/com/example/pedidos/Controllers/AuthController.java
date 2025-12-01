package com.example.pedidos.Controllers;

import com.example.pedidos.Models.User;
import com.example.pedidos.Services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    // Classe DTO (Data Transfer Object) para receber a requisição de login
    static class LoginRequest {
        private String email;
        private String senha;

        public LoginRequest() {} // Construtor vazio (para o Jackson)

        public String getEmail() { return email; }
        public String getSenha() { return senha; }
        public void setEmail(String email) { this.email = email; }
        public void setSenha(String senha) { this.senha = senha; }
    }

    // Nova classe para padronizar o retorno de erro
    static class ErrorResponse {
        private String error;
        public ErrorResponse(String error) {
            this.error = error;
        }
        public String getError() {
            return error;
        }
        public void setError(String error) {
            this.error = error;
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> autenticar(@RequestBody LoginRequest request) {

        User user = userService.autenticar(request.getEmail(), request.getSenha());

        if (user != null) {
            // Sucesso: Retorna o objeto User (código 200 OK)
            return ResponseEntity.ok(user);
        } else {
            // 💡 MUDANÇA: Retorna um objeto ErrorResponse, garantindo JSON válido (código 401)
            ErrorResponse error = new ErrorResponse("E-mail ou senha inválidos!");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }
}