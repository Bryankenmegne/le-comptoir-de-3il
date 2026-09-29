package com.ecommerce.service;

import com.ecommerce.dto.OrderItemRequest;
import com.ecommerce.dto.OrderItemResponse;
import com.ecommerce.dto.OrderRequest;
import com.ecommerce.dto.OrderResponse;
import com.ecommerce.exception.InsufficientStockException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.*;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Création et suivi des commandes.
 */
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    /**
     * Crée une commande pour l'utilisateur connecté.
     * - Les prix sont relus en base (le front n'envoie que id + quantité).
     * - Le stock est vérifié puis décrémenté.
     * - Tout se fait dans une transaction : si un produit manque, rien n'est enregistré.
     */
    @Transactional
    public OrderResponse create(String email, OrderRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        // Regroupe les lignes d'un même produit envoyées plusieurs fois
        Map<Long, Integer> quantites = new LinkedHashMap<>();
        for (OrderItemRequest item : request.items()) {
            quantites.merge(item.productId(), item.quantite(), Integer::sum);
        }

        Order order = Order.builder()
                .user(user)
                .dateCommande(LocalDateTime.now())
                .statut(OrderStatus.EN_ATTENTE)
                .total(BigDecimal.ZERO)
                .build();

        BigDecimal total = BigDecimal.ZERO;
        for (Map.Entry<Long, Integer> entry : quantites.entrySet()) {
            Long productId = entry.getKey();
            int quantite = entry.getValue();

            Product product = productRepository.findByIdForUpdate(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Produit", productId));

            if (product.getStock() < quantite) {
                throw new InsufficientStockException(product.getNom(), product.getStock(), quantite);
            }
            product.setStock(product.getStock() - quantite);

            OrderItem line = OrderItem.builder()
                    .product(product)
                    .nomProduit(product.getNom())
                    .quantite(quantite)
                    .prixUnitaire(product.getPrix())
                    .build();
            order.addItem(line);
            total = total.add(line.getSousTotal());
        }

        order.setTotal(total);
        Order saved = orderRepository.save(order);
        // L'id n'existe qu'après l'insertion : le ticket en découle, donc jamais deux fois le même.
        saved.setNumeroTicket(String.format("3iL-%04d", saved.getId()));
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> findByUser(String email) {
        return orderRepository.findByUserEmailOrderByDateCommandeDesc(email).stream()
                .map(this::toResponse)
                .toList();
    }

    /** Un utilisateur ne peut consulter que ses propres commandes. */
    @Transactional(readOnly = true)
    public OrderResponse findByIdForUser(Long id, String email) {
        return orderRepository.findByIdAndUserEmail(id, email)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Commande", id));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> findAll() {
        return orderRepository.findAllByOrderByDateCommandeDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public OrderResponse updateStatus(Long id, OrderStatus statut) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commande", id));
        order.setStatut(statut);
        return toResponse(order);
    }

    private OrderResponse toResponse(Order o) {
        List<OrderItemResponse> items = o.getItems().stream()
                .map(i -> new OrderItemResponse(
                        i.getProduct().getId(),
                        i.getNomProduit(),
                        i.getQuantite(),
                        i.getPrixUnitaire(),
                        i.getSousTotal()))
                .toList();

        return new OrderResponse(
                o.getId(),
                o.getNumeroTicket(),
                o.getDateCommande(),
                o.getStatut(),
                o.getTotal(),
                o.getUser().getEmail(),
                o.getUser().getNom(),
                items
        );
    }
}
