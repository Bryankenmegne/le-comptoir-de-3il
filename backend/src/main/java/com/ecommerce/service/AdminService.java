package com.ecommerce.service;

import com.ecommerce.dto.DashboardStats;
import com.ecommerce.model.OrderStatus;
import com.ecommerce.model.Role;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Statistiques du tableau de bord admin.
 */
@Service
@RequiredArgsConstructor
public class AdminService {

    /** En dessous de ce stock, un produit est signalé comme "stock faible". */
    private static final int SEUIL_STOCK_FAIBLE = 5;

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public DashboardStats getStats() {
        BigDecimal ca = orderRepository.sumChiffreAffaires();
        return new DashboardStats(
                productRepository.count(),
                categoryRepository.count(),
                orderRepository.count(),
                userRepository.countByRole(Role.USER),
                orderRepository.countByStatut(OrderStatus.EN_ATTENTE),
                productRepository.countByStockLessThan(SEUIL_STOCK_FAIBLE),
                ca == null ? BigDecimal.ZERO : ca
        );
    }
}
