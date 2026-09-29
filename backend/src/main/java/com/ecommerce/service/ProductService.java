package com.ecommerce.service;

import com.ecommerce.dto.ProductRequest;
import com.ecommerce.dto.ProductResponse;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.Product;
import com.ecommerce.repository.OrderItemRepository;
import com.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.RoundingMode;
import java.util.List;

/**
 * Gestion des produits (lecture publique + CRUD admin).
 */
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final CategoryService categoryService;

    /** Liste filtrée : les deux paramètres sont optionnels. */
    @Transactional(readOnly = true)
    public List<ProductResponse> search(Long categoryId, String search) {
        String term = (search == null) ? "" : search.trim();
        return productRepository.search(categoryId, term).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse findById(Long id) {
        return toResponse(getEntity(id));
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        Product product = new Product();
        apply(product, request);
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = getEntity(id);
        apply(product, request);
        return toResponse(product);
    }

    @Transactional
    public ProductResponse updateStock(Long id, int stock) {
        Product product = getEntity(id);
        product.setStock(stock);
        return toResponse(product);
    }

    /**
     * Un produit présent dans une commande n'est pas supprimé,
     * sinon l'historique des commandes serait cassé.
     */
    @Transactional
    public void delete(Long id) {
        Product product = getEntity(id);
        if (orderItemRepository.existsByProductId(id)) {
            throw new BadRequestException(
                    "« " + product.getNom() + " » figure dans des commandes : "
                            + "mettez plutôt son stock à 0 pour le retirer de la vente");
        }
        productRepository.delete(product);
    }

    private Product getEntity(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit", id));
    }

    /** Copie les champs de la requête dans l'entité. */
    private void apply(Product product, ProductRequest request) {
        product.setNom(request.nom().trim());
        product.setDescription(blankToNull(request.description()));
        product.setPrix(request.prix().setScale(2, RoundingMode.HALF_UP));
        product.setStock(request.stock());
        product.setImageUrl(blankToNull(request.imageUrl()));
        product.setCategory(categoryService.getEntity(request.categoryId()));
    }

    private ProductResponse toResponse(Product p) {
        return new ProductResponse(
                p.getId(),
                p.getNom(),
                p.getDescription(),
                p.getPrix(),
                p.getStock(),
                p.getImageUrl(),
                p.getCategory().getId(),
                p.getCategory().getNom()
        );
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
