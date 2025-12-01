package com.example.pedidos.Repositories;

import com.example.pedidos.Models.Pedido;
import com.example.pedidos.Models.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findByClienteNomeContainingIgnoreCase(String nome);

    List<Pedido> findByCliente_TelefoneContainingIgnoreCase(String telefone);

    @Query("SELECT DISTINCT p FROM Pedido p LEFT JOIN FETCH p.itens")
    List<Pedido> findAllWithItens();

    @Query("SELECT DISTINCT p FROM Pedido p JOIN FETCH p.itens i WHERE i.produto = :produto")
    List<Pedido> findByProdutoComItens(@Param("produto") Produto produto);

    List<Pedido> findByDataEntregaBetween(LocalDateTime inicio, LocalDateTime fim);
}
