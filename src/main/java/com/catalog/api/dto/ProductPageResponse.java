package com.catalog.api.dto;

import com.catalog.api.model.Product;

import java.util.List;

public record ProductPageResponse(
        List<Product> items,
        long totalItems,
        int page,
        int size,
        int totalPages,
        boolean hasNext,
        boolean hasPrevious
) {
}
