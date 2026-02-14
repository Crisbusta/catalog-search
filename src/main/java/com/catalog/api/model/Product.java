package com.catalog.api.model;

import java.math.BigDecimal;
import java.util.List;

public record Product(
        String id,
        String name,
        String description,
        String category,
        String brand,
        BigDecimal price,
        BigDecimal oldPrice,
        int stock,
        List<String> tags,
        String imageUrl
) {
}
