package com.example.pedidos.Models;

public enum Produto {
    FILE("Filé de Tilápia - 1kg", 53.90),
    MEIOFILE("Filé de Tilápia - 500g", 29.90),
    TIRAS("Filé de Tilápia em tiras", 24.90),
    COSTELINHA("Costelinha de Tilápia", 26.90),
    ESPALMADA("Tilápia inteira espalmada", 31.90),
    EMPANADINHO("Empanadinho de Tilápia", 34.90),
    COMBO("Filé + Tiras", 51.90),
    TEMPERO("Tempero Supreme", 3.00);

    private final String descricao;
    private final double preco;

    Produto(String descricao, double preco) {
        this.descricao = descricao;
        this.preco = preco;
    }

    public String getDescricao() {
        return descricao;
    }

    public double getPreco() {
        return preco;
    }
}
