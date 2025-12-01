package com.example.pedidos.Models;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Entity
public class Pedido {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Removi cascade = CascadeType.ALL aqui — NÃO queríamos propagar remoções para Cliente
    @ManyToOne
    @NotNull(message = "Cliente é obrigatório")
    private Cliente cliente;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<PedidoItem> itens = new ArrayList<>();

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime dataEntrega;

    private Double taxaEntrega;

    private Double valorTotal;

    @Transient
    private String itensResumo;

    @PrePersist
    @PreUpdate
    public void calcularTotal() {
        double somaItens = 0.0;
        if (itens != null) {
            for (PedidoItem i : itens) {
                i.calcularSubtotal();
                somaItens += i.getSubtotal();
            }
        }
        this.valorTotal = somaItens + (taxaEntrega != null ? taxaEntrega : 0.0);
    }

    public String getItensResumo() {
        if (itens == null || itens.isEmpty()) return "-";
        return itens.stream()
                .map(i -> i.getProduto().getDescricao() + " x" + i.getQuantidade())
                .collect(Collectors.joining(", "));
    }

    // getters / setters
    public Long getId() { return id; }
    public Cliente getCliente() { return cliente; }
    public List<PedidoItem> getItens() { return itens; }
    public LocalDateTime getDataEntrega() { return dataEntrega; }
    public Double getTaxaEntrega() { return taxaEntrega; }
    public Double getValorTotal() { return valorTotal; }

    public void setCliente(Cliente cliente) { this.cliente = cliente; }
    public void setItens(List<PedidoItem> itens) { this.itens = itens; }
    public void setDataEntrega(LocalDateTime dataEntrega) { this.dataEntrega = dataEntrega; }
    public void setTaxaEntrega(Double taxaEntrega) { this.taxaEntrega = taxaEntrega; }
    public void setValorTotal(double total) { this.valorTotal = total; }
    public void setId(Long id) { this.id = id; }
}
