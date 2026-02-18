# AudiMeta (ABM Fork)

A fast and flexible Audible metadata provider with extensive querying options and bulk search capabilities.

## Instance

The public instance of AudiMeta is available at [audimeta](https://manager.lostcartographer.xyz).

API documentation is served at the root of the instance via the OpenAPI specification.

## Overview

AudiMeta was created to serve as a comprehensive metadata provider for Audible content, offering rich querying options and advanced search functionality.

AudiMeta provides enhanced search capabilities, including bulk operations.

## Features

### Highlights

- Bulk search for ASINs (up to 1000)
- Search across regions for cached books
- Find all books of an author or series

### Search Capabilities

- Search books by title
- Retrieve books by author
- Look up books by ASIN (single or bulk)
- Find books by series ASIN (all)
- Find books by author (supports fetching the first 50 books of an author and shows all cached books if searched or cached previously)
- Search by author name
- Search by narrator name
- Look up books by ISBN (Audible ISBN might not be the same as the audiobook ISBN of the book)

### Book Details

- Get detailed book information by ASIN, a list of ASINs, or ISBN

### Series Information

- Retrieve series information by name
- Retrieve series information by ASIN

### Author Information

- Get author details by name
- Get author details by ASIN

## Supported Regions

AudiMeta supports the following Audible regions:

| Region Code | Region Name    |
| ----------- | -------------- |
| `de`        | Germany        |
| `us`        | United States  |
| `uk`        | United Kingdom |
| `fr`        | France         |
| `it`        | Italy          |
| `es`        | Spain          |
| `jp`        | Japan          |
| `ca`        | Canada         |
| `au`        | Australia      |
| `in`        | India          |
| `br`        | Brazil         |

### Region Behavior

When searching for books, results will be returned regardless of regional availability by default if the book's ASIN is cached.

### Parameters

Please check the OpenAPI documentation at the root of your instance for detailed information on available query parameters. Some endpoints only return cached data and do not query Audible again unless explicitly requested.

## Data & Privacy

AudiMeta logs API requests for operational and analytics purposes. See the full [Privacy Policy](PRIVACYPOLICY.md) for details.

**In short:**

- We log IP addresses, request metadata, and search parameters to monitor service health and understand usage patterns
- We do not sell, share, or provide this data to any third party
- We do not track individual users across sessions
- IP geolocation is performed locally — no external services receive your IP
- If you self-host your own instance, no data is sent to us — logging is entirely under your control

## Attribution

- **Original Project:** [Vito0912/AudiMeta](https://github.com/Vito0912/AudiMeta)
- **API Reference:** [External Audible API](https://audible.readthedocs.io/en/latest/misc/external_api.html)
- **OpenAPI Tools:** [Friends of Adonis](https://friendsofadonis.com/docs/openapi)
- **Logging:** [Axiom](https://axiom.co)