package com.example.pedidos.Models;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Entity
public class PedidoItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @NotNull
    private Produto produto;

    @Min(value = 0, message = "Quantidade deve ser >= 0")
    private int quantidade;

    @Column(name = "preco_unitario")
    private Double precoUnitario;

    private double subtotal;

    @ManyToOne
    @JsonBackReference
    private Pedido pedido;

    public PedidoItem(Produto produto, int quantidade) {
        this.produto = produto;
        this.quantidade = quantidade;
        if (produto != null) {
            this.precoUnitario = produto.getPreco();
            this.subtotal = this.precoUnitario * quantidade;
        }
    }

    public PedidoItem() {}

    @PrePersist
    @PreUpdate
    public void calcularSubtotal() {
        if (produto != null) {
            this.precoUnitario = produto.getPreco();
            this.subtotal = this.precoUnitario * quantidade;
        } else {
            this.subtotal = 0.0;
        }
    }

    public Long getId() { return id; }
    public Produto getProduto() { return produto; }
    public int getQuantidade() { return quantidade; }
    public Double getPrecoUnitario() { return precoUnitario; }
    public double getSubtotal() { return subtotal; }
    public Pedido getPedido() { return pedido; }

    public void setProduto(Produto produto) { this.produto = produto; }
    public void setQuantidade(int quantidade) { this.quantidade = quantidade; }
    public void setPedido(Pedido pedido) { this.pedido = pedido; }
    public void setPrecoUnitario(Double precoUnitario) { this.precoUnitario = precoUnitario; }
    public void setSubtotal(double subtotal) { this.subtotal = subtotal; }
}
