package com.example.pedidos.Services;

import com.example.pedidos.DTO.PedidoComItensDTO;
import com.example.pedidos.DTO.PedidoResumoDTO;
import com.example.pedidos.Models.Cliente;
import com.example.pedidos.Models.Pedido;
import com.example.pedidos.Models.PedidoItem;
import com.example.pedidos.Models.Produto;
import com.example.pedidos.Repositories.ClienteRepository;
import com.example.pedidos.Repositories.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ClienteRepository clienteRepository;

    @Autowired
    public PedidoService(PedidoRepository pedidoRepository,
                         ClienteRepository clienteRepository) {
        this.pedidoRepository = pedidoRepository;
        this.clienteRepository = clienteRepository;
    }

    // ---------------------------------------------------------------------------------------------
    // CADASTRAR PEDIDO
    // ---------------------------------------------------------------------------------------------
    @Transactional
    public Pedido cadastrarPedido(Pedido pedido) {

        if (pedido.getCliente() == null)
            throw new IllegalArgumentException("Pedido precisa ter um cliente.");

        // 1) Busca cliente por telefone
        String telefone = pedido.getCliente().getTelefone();
        Cliente clienteExistente = clienteRepository.findByTelefone(telefone);

        if (clienteExistente != null) {
            // Atualiza dados básicos (opcional)
            clienteExistente.setNome(pedido.getCliente().getNome());
            clienteExistente.setEndereco(pedido.getCliente().getEndereco());

            pedido.setCliente(clienteExistente);
        } else {
            // Cria novo cliente
            Cliente novo = clienteRepository.save(pedido.getCliente());
            pedido.setCliente(novo);
        }

        // 2) Ajusta itens
        pedido.getItens().forEach(item -> {
            item.setPedido(pedido);
            if (item.getPrecoUnitario() == null) {
                item.setPrecoUnitario(item.getProduto().getPreco());
            }
            item.setSubtotal(item.getPrecoUnitario() * item.getQuantidade());
        });

        // 3) Calcula total
        calcularTotalPedido(pedido);

        return pedidoRepository.save(pedido);
    }

    // ---------------------------------------------------------------------------------------------
    // LISTAR TODOS
    // ---------------------------------------------------------------------------------------------
    public List<Pedido> listarPedidos() {
        List<Pedido> pedidos = pedidoRepository.findAllWithItens();

        pedidos.forEach(p -> {
            // Remove itens vazios
            p.setItens(
                    p.getItens().stream()
                            .filter(item -> item.getQuantidade() > 0)
                            .toList()
            );
            calcularTotalPedido(p);
        });

        // Ordenar por data de entrega (mais recentes primeiro)
        pedidos.sort((p1, p2) -> {
            if (p1.getDataEntrega() == null) return 1;
            if (p2.getDataEntrega() == null) return -1;
            return p2.getDataEntrega().compareTo(p1.getDataEntrega());
        });

        return pedidos;
    }

    public List<PedidoResumoDTO> listarPedidosResumo() {
        return pedidoRepository.findAll()
                .stream()
                .map(p -> new PedidoResumoDTO(
                        p.getId(),
                        p.getCliente().getNome(),
                        p.getCliente().getTelefone(),
                        p.getCliente().getEndereco(),
                        p.getDataEntrega(),
                        p.getTaxaEntrega(),
                        p.getItens().stream().map(i ->
                                new PedidoResumoDTO.ItemDTO(
                                        i.getProduto().name(),
                                        i.getQuantidade(),
                                        i.getPrecoUnitario(),
                                        i.getProduto().getDescricao() // se existir
                                )
                        ).toList()
                ))
                .toList();
    }

    // ---------------------------------------------------------------------------------------------
    // BUSCAR POR ID
    // ---------------------------------------------------------------------------------------------
    public Pedido buscarPedido(Long id) {
        Pedido pedido = pedidoRepository.findById(id).orElse(null);

        if (pedido != null) {
            pedido.setItens(
                    pedido.getItens().stream()
                            .filter(item -> item.getQuantidade() > 0)
                            .toList()
            );
            calcularTotalPedido(pedido);
        }

        return pedido;
    }

    public PedidoResumoDTO buscarDetalhesCompletos(Long pedidoId) {
        // É necessário importar esta exceção se ela ainda estiver faltando
        // throw new com.example.pedidos.exceptions.RecursoNaoEncontradoException("Pedido não encontrado.");

        // 1. Busca o Pedido
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido não encontrado."));

        // 2. Garante que todos os itens estão na lista (os pedidos com quantidade > 0 e os vazios com quantidade = 0)
        // Isso é útil para exibir a lista completa de produtos na tela de edição.
        preencherItensVazios(pedido);

        // 3. Mapeia a entidade Pedido COMPLETA para o DTO (incluindo os itens)
        List<PedidoResumoDTO.ItemDTO> itensDTO = pedido.getItens().stream()
                // Filtramos apenas itens com quantidade >= 0
                .filter(item -> item.getQuantidade() >= 0)
                .map(item -> new PedidoResumoDTO.ItemDTO(
                        item.getProduto().name(),           // Código do Enum (Ex: "FILE")
                        item.getQuantidade(),
                        item.getPrecoUnitario(),
                        item.getProduto().getDescricao()    // Descrição para o Front-end
                )).toList();

        // 4. Constrói e retorna o DTO completo
        return new PedidoResumoDTO(
                pedido.getId(),
                pedido.getCliente().getNome(),      // Nome do cliente
                pedido.getCliente().getTelefone(),  // Telefone
                pedido.getCliente().getEndereco(),  // Endereço
                pedido.getDataEntrega(),
                pedido.getTaxaEntrega(),
                itensDTO // A lista de itens que faltava!
        );
    }

    // ---------------------------------------------------------------------------------------------
    // ATUALIZAR PEDIDO
    // ---------------------------------------------------------------------------------------------
    @Transactional
    public Pedido atualizarPedido(Long id, Pedido pedidoAtualizado) {

        Pedido pedidoExistente = pedidoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pedido não encontrado"));

        // 1. Lógica do Cliente: Associa ou Atualiza o Cliente no Pedido

        Cliente clienteAtualizado = pedidoAtualizado.getCliente();

        // CRÍTICO: Buscar cliente existente pelo ID (se estiver em edição) ou Telefone (se for um cliente novo, mas que já existe no banco)

        Cliente clienteNoBanco;
        if (clienteAtualizado.getId() != null) {
            // Se o payload trouxe ID, buscamos ele
            clienteNoBanco = clienteRepository.findById(clienteAtualizado.getId()).orElse(null);
        } else {
            // Se não trouxe ID, buscamos pelo telefone (como no cadastro)
            clienteNoBanco = clienteRepository.findByTelefone(clienteAtualizado.getTelefone());
        }

        if (clienteNoBanco != null) {
            // Cliente existe: Atualiza os dados do cliente no banco
            clienteNoBanco.setNome(clienteAtualizado.getNome());
            clienteNoBanco.setEndereco(clienteAtualizado.getEndereco());
            // Note: O telefone não é alterado (geralmente é imutável ou requer lógica mais complexa)

            // Salva as alterações no cliente e o associa ao pedido existente
            clienteRepository.save(clienteNoBanco);
            pedidoExistente.setCliente(clienteNoBanco);
        } else {
            // Cliente não existe: Salva como novo e associa ao pedido
            Cliente novo = clienteRepository.save(clienteAtualizado);
            pedidoExistente.setCliente(novo);
        }

        // Atualiza campos principais
        pedidoExistente.setDataEntrega(pedidoAtualizado.getDataEntrega());
        pedidoExistente.setTaxaEntrega(pedidoAtualizado.getTaxaEntrega());

        // Remove itens que não existem mais
        pedidoExistente.getItens().removeIf(item ->
                pedidoAtualizado.getItens().stream()
                        .noneMatch(i -> i.getProduto() == item.getProduto())
        );

        // Adiciona/atualiza itens
        for (PedidoItem itemAtualizado : pedidoAtualizado.getItens()) {

            if (itemAtualizado.getPrecoUnitario() == null) {
                itemAtualizado.setPrecoUnitario(itemAtualizado.getProduto().getPreco());
            }

            PedidoItem existente = pedidoExistente.getItens().stream()
                    .filter(i -> i.getProduto() == itemAtualizado.getProduto())
                    .findFirst()
                    .orElse(null);

            if (existente != null) {
                existente.setQuantidade(itemAtualizado.getQuantidade());
                existente.setPrecoUnitario(itemAtualizado.getPrecoUnitario());
                existente.setSubtotal(existente.getPrecoUnitario() * existente.getQuantidade());
            } else {
                itemAtualizado.setPedido(pedidoExistente);
                itemAtualizado.setSubtotal(itemAtualizado.getPrecoUnitario() * itemAtualizado.getQuantidade());
                pedidoExistente.getItens().add(itemAtualizado);
            }
        }

        pedidoExistente.getItens().removeIf(item -> item.getQuantidade() <= 0);

        calcularTotalPedido(pedidoExistente);

        return pedidoRepository.save(pedidoExistente);
    }

    // ---------------------------------------------------------------------------------------------
    // EXCLUIR
    // ---------------------------------------------------------------------------------------------
    public void excluirPedido(Long id) {
        if (!pedidoRepository.existsById(id))
            throw new RuntimeException("Pedido não encontrado com id: " + id);

        pedidoRepository.deleteById(id);
    }

    // ---------------------------------------------------------------------------------------------
    // FILTROS PERSONALIZADOS
    // ---------------------------------------------------------------------------------------------
    public List<?> buscarPedidosComFiltrosDTO(
            String cliente,
            String telefone,
            String produto,
            LocalDateTime inicio,
            LocalDateTime fim
    ) {

        List<Pedido> pedidos = pedidoRepository.findAllWithItens();

        // ------ FILTROS BÁSICOS (cliente / telefone / datas) ------
        if (cliente != null && !cliente.isBlank()) {
            pedidos = pedidos.stream()
                    .filter(p -> p.getCliente() != null &&
                            p.getCliente().getNome().toLowerCase().contains(cliente.toLowerCase()))
                    .toList();
        }

        if (telefone != null && !telefone.isBlank()) {
            pedidos = pedidos.stream()
                    .filter(p -> p.getCliente() != null &&
                            p.getCliente().getTelefone() != null &&
                            p.getCliente().getTelefone().contains(telefone))
                    .toList();
        }

        if (inicio != null && fim != null) {
            pedidos = pedidos.stream()
                    .filter(p -> p.getDataEntrega() != null &&
                            !p.getDataEntrega().isBefore(inicio) &&
                            !p.getDataEntrega().isAfter(fim))
                    .toList();
        }

        // CASO NÃO FILTRE POR PRODUTO → RETORNAR RESUMO
        if (produto == null || produto.isBlank()) {
            return pedidos.stream()
                    .map(p -> new PedidoResumoDTO(
                            p.getId(),
                            p.getCliente().getNome(),
                            p.getCliente().getTelefone(),
                            p.getCliente().getEndereco(),
                            p.getDataEntrega(),
                            p.getTaxaEntrega(),
                            p.getItens().stream().map(i ->
                                    new PedidoResumoDTO.ItemDTO(
                                            i.getProduto().name(),
                                            i.getQuantidade(),
                                            i.getPrecoUnitario(),
                                            i.getProduto().getDescricao()
                                    )
                            ).toList()
                    )).toList();

        }

        // ------ FILTRO POR ITEM: precisa retornar itens também ------
        Produto prodEnum;
        try {
            prodEnum = Produto.valueOf(produto);
        } catch (IllegalArgumentException e) {
            return new ArrayList<>();
        }

        List<Pedido> pedidosFiltrados = pedidos.stream()
                .filter(p -> p.getItens().stream()
                        .anyMatch(i -> i.getProduto() == prodEnum && i.getQuantidade() > 0))
                .toList();

        return pedidosFiltrados.stream()
                .map(p -> new PedidoComItensDTO(
                        p.getId(),
                        p.getCliente().getNome(),
                        p.getCliente().getTelefone(),
                        p.getDataEntrega(),
                        p.getTaxaEntrega(),
                        p.getItens().stream()
                                .filter(i -> i.getQuantidade() > 0)
                                .map(i -> new PedidoComItensDTO.ItemDTO(
                                        i.getProduto().name(),
                                        i.getQuantidade()
                                )).toList()
                ))
                .toList();
    }


    // ---------------------------------------------------------------------------------------------
    // MÉTODOS AUXILIARES
    // ---------------------------------------------------------------------------------------------
    public void calcularTotalPedido(Pedido p) {
        double total = p.getItens().stream()
                .mapToDouble(PedidoItem::getSubtotal)
                .sum();

        if (p.getTaxaEntrega() != null)
            total += p.getTaxaEntrega();

        p.setValorTotal(total);
    }

    public double calcularTotalGeral(List<Pedido> pedidos) {
        return pedidos.stream()
                .mapToDouble(Pedido::getValorTotal)
                .sum();
    }

    // ---------------------------------------------------------------------------------------------
    // CRIAR PEDIDO VAZIO (para front-end)
    // ---------------------------------------------------------------------------------------------
    public Pedido criarPedidoVazio() {
        Pedido pedido = new Pedido();
        pedido.setCliente(new Cliente());

        List<PedidoItem> itens = new ArrayList<>();

        for (Produto produto : Produto.values()) {
            PedidoItem item = new PedidoItem();
            item.setProduto(produto);
            item.setQuantidade(0);
            item.setPrecoUnitario(produto.getPreco());
            item.setSubtotal(0);
            item.setPedido(pedido);
            itens.add(item);
        }

        pedido.setItens(itens);
        calcularTotalPedido(pedido);

        return pedido;
    }

    // Preencher itens faltantes ao editar pedido
    public Pedido preencherItensVazios(Pedido pedido) {

        List<PedidoItem> itens = new ArrayList<>(pedido.getItens());
        pedido.setItens(itens);

        List<Produto> existentes = itens.stream()
                .map(PedidoItem::getProduto)
                .toList();

        for (Produto p : Produto.values()) {
            if (!existentes.contains(p)) {
                PedidoItem novo = new PedidoItem();
                novo.setProduto(p);
                novo.setQuantidade(0);
                novo.setPrecoUnitario(p.getPreco());
                novo.setSubtotal(0);
                novo.setPedido(pedido);
                itens.add(novo);
            }
        }

        itens.forEach(item -> {
            if (item.getPrecoUnitario() == null) {
                item.setPrecoUnitario(item.getProduto().getPreco());
            }
            item.setSubtotal(item.getPrecoUnitario() * item.getQuantidade());
        });

        calcularTotalPedido(pedido);

        return pedido;
    }
}
