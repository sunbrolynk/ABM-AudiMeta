# AudiMeta

A fast and flexible Audible metadata provider with extensive querying options and bulk search capabilities.

> [!IMPORTANT]
> The current beta channel at https://beta.audimeta.de does not have an OpenAPI specification. It shares many features with the current main channel, and the responses should be the same for backwards compatibility. However, some query parameters have changed, and new ones have been added. To test you should be able to just replace the base-URL. This version has better support for authors and series

> [!IMPORTANT]
> New update!
> AudiMeta should be faster now. No scraping is done anymore. And features have higher limits.

## Instance

The public instance of AudiMeta is available at .  
An uptime status page is available at .

Rate limits are in place to ensure fair usage of the service. The RPM (Requests per Minute) limit is at max 120.

## Overview

AudiMeta was created to serve as a comprehensive metadata provider for Audible content, offering rich querying options and advanced search functionality.

AudiMeta provides enhanced search capabilities, including bulk operations.


## Documentation

View the complete API documentation via the OpenAPI specification:

- 

## Features

### Highlights

- Bulk search for ASINs (up to 50)
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

When searching for books, results will be returned regardless of regional availability by default if the books ASIN is cached.

### Parameters

Please check the  for detailed information on the available query parameters. Some endpoints only return cached data and do not query Audible again unless explicitly requested.

### Ideas and Attribution

The source for some API endpoints came from [External Audible API](https://audible.readthedocs.io/en/latest/misc/external_api.html). Most have been used without this. But this was a great starting point!
Thanks to [Friends of Adonis](https://friendsofadonis.com/docs/openapi) for the awesome OpenAPI documentation tool.
Thanks to [Axiom](https://axiom.co) which provide a generous free tier for logging 5xx errors.
