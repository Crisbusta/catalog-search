# Catalog API + Frontend (Retail)

Proyecto completo con backend en **Java 17 + Spring Boot** y frontend estático en **Nginx**, listo para levantar con Docker.

## Funcionalidades

- API REST consistente para catálogo de productos.
- Listado paginado.
- Búsqueda por texto (`name` o `description`).
- Filtros por `brand`, `category`, `minPrice`, `maxPrice`.
- Ordenamiento por `name`, `price`, `brand`, `category`, `stock`.
- Detalle de producto por ID.
- Frontend para explorar catálogo (búsqueda, filtros, orden, paginación y detalle).

## Levantar todo con Docker (recomendado)

Requisito: Docker Desktop o Docker Engine con Compose.

```bash
docker compose up --build
```

Servicios:

- Frontend: `http://localhost:8081`
- Backend API: `http://localhost:8080`
- Health backend: `http://localhost:8080/health`

Para apagar:

```bash
docker compose down
```

## Endpoints backend

### Health

```http
GET /health
```

### Listado con búsqueda/filtros/orden/paginación

```http
GET /api/v1/products
```

Query params:

- `q` (opcional): busca en nombre o descripción.
- `brand` (opcional)
- `category` (opcional)
- `minPrice` (opcional)
- `maxPrice` (opcional)
- `sortBy` (opcional, default `name`): `name|price|brand|category|stock`
- `sortDir` (opcional, default `asc`): `asc|desc`
- `page` (opcional, default `0`)
- `size` (opcional, default `10`, máximo `100`)

Ejemplo:

```http
GET /api/v1/products?q=smart&category=Electrónica&minPrice=50&maxPrice=100&sortBy=price&sortDir=desc&page=0&size=5
```

### Detalle de producto

```http
GET /api/v1/products/{id}
```

Ejemplo:

```http
GET /api/v1/products/p-001
```

## Ejecución local sin Docker (opcional)

Requisitos:

- Java 17+
- Maven 3.9+

Comandos:

```bash
mvn test
mvn spring-boot:run
```

API en `http://localhost:8080`.

## Fuente de datos

Los productos se cargan desde `src/main/resources/catalog.json` al iniciar la aplicación.
