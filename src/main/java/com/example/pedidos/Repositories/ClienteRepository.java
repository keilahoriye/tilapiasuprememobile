package com.example.pedidos.Repositories;

import com.example.pedidos.Models.Cliente;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    Cliente findByTelefone(String telefone);
    boolean existsByTelefone(String telefone);
    boolean existsByTelefoneAndIdNot(String telefone, Long id);
}