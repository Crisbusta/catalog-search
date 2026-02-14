package com.catalog.api.service;

import com.catalog.api.dto.ProductPageResponse;
import com.catalog.api.exception.ProductNotFoundException;
import com.catalog.api.model.Product;
import com.catalog.api.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

@Service
public class ProductService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("name", "price", "brand", "category", "stock");

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public ProductPageResponse getProducts(
            String query,
            String brand,
            String category,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String sortBy,
            String sortDir,
            int page,
            int size
    ) {
        validateInputs(minPrice, maxPrice, sortBy, sortDir, page, size);

        List<Product> filtered = productRepository.findAll().stream()
                .filter(product -> matchesQuery(product, query))
                .filter(product -> matchesBrand(product, brand))
                .filter(product -> matchesCategory(product, category))
                .filter(product -> matchesMinPrice(product, minPrice))
                .filter(product -> matchesMaxPrice(product, maxPrice))
                .sorted(buildComparator(sortBy, sortDir))
                .toList();

        int totalItems = filtered.size();
        int fromIndex = page * size;
        int toIndex = Math.min(fromIndex + size, totalItems);
        List<Product> paged = fromIndex >= totalItems ? List.of() : filtered.subList(fromIndex, toIndex);

        int totalPages = totalItems == 0 ? 0 : (int) Math.ceil((double) totalItems / size);

        return new ProductPageResponse(
                paged,
                totalItems,
                page,
                size,
                totalPages,
                page + 1 < totalPages,
                page > 0 && totalPages > 0
        );
    }

    public Product getById(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
    }

    private boolean matchesQuery(Product product, String query) {
        if (query == null || query.isBlank()) {
            return true;
        }
        String q = query.toLowerCase(Locale.ROOT);
        return product.name().toLowerCase(Locale.ROOT).contains(q)
                || product.description().toLowerCase(Locale.ROOT).contains(q);
    }

    private boolean matchesBrand(Product product, String brand) {
        return brand == null || brand.isBlank() || product.brand().equalsIgnoreCase(brand);
    }

    private boolean matchesCategory(Product product, String category) {
        return category == null || category.isBlank() || product.category().equalsIgnoreCase(category);
    }

    private boolean matchesMinPrice(Product product, BigDecimal minPrice) {
        return minPrice == null || product.price().compareTo(minPrice) >= 0;
    }

    private boolean matchesMaxPrice(Product product, BigDecimal maxPrice) {
        return maxPrice == null || product.price().compareTo(maxPrice) <= 0;
    }

    private Comparator<Product> buildComparator(String sortBy, String sortDir) {
        Comparator<Product> comparator = switch (sortBy.toLowerCase(Locale.ROOT)) {
            case "name" -> Comparator.comparing(Product::name, String.CASE_INSENSITIVE_ORDER);
            case "price" -> Comparator.comparing(Product::price);
            case "brand" -> Comparator.comparing(Product::brand, String.CASE_INSENSITIVE_ORDER);
            case "category" -> Comparator.comparing(Product::category, String.CASE_INSENSITIVE_ORDER);
            case "stock" -> Comparator.comparingInt(Product::stock);
            default -> throw new IllegalArgumentException("sortBy must be one of: " + ALLOWED_SORT_FIELDS);
        };

        if (Objects.equals(sortDir.toLowerCase(Locale.ROOT), "desc")) {
            return comparator.reversed();
        }

        return comparator;
    }

    private void validateInputs(BigDecimal minPrice, BigDecimal maxPrice, String sortBy, String sortDir, int page, int size) {
        if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            throw new IllegalArgumentException("minPrice cannot be greater than maxPrice");
        }
        if (!ALLOWED_SORT_FIELDS.contains(sortBy.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("sortBy must be one of: " + ALLOWED_SORT_FIELDS);
        }
        String normalizedSortDir = sortDir.toLowerCase(Locale.ROOT);
        if (!normalizedSortDir.equals("asc") && !normalizedSortDir.equals("desc")) {
            throw new IllegalArgumentException("sortDir must be asc or desc");
        }
        if (page < 0) {
            throw new IllegalArgumentException("page must be >= 0");
        }
        if (size <= 0 || size > 100) {
            throw new IllegalArgumentException("size must be between 1 and 100");
        }
    }
}
