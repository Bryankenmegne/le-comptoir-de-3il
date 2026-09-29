package com.ecommerce.controller;

import com.ecommerce.dto.OrderRequest;
import com.ecommerce.dto.OrderResponse;
import com.ecommerce.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Commandes de l'utilisateur connecté.
 * L'utilisateur est toujours déduit du token, jamais d'un paramètre envoyé par le front.
 */
@RestController
@RequestMapping("/api/orders")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody OrderRequest request,
                                                Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.create(authentication.getName(), request));
    }

    @GetMapping("/me")
    public List<OrderResponse> myOrders(Authentication authentication) {
        return orderService.findByUser(authentication.getName());
    }

    @GetMapping("/me/{id}")
    public OrderResponse myOrder(@PathVariable Long id, Authentication authentication) {
        return orderService.findByIdForUser(id, authentication.getName());
    }
}
