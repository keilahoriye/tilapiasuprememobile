package com.example.pedidos.Repositories;

import com.example.pedidos.Models.PedidoItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PedidoItemRepository extends JpaRepository<PedidoItem, Long> {
}