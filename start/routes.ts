/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import openapi from '@foadonis/openapi/services/main'
import DbController from '#controllers/db_controller'

const SearchesController = () => import('#controllers/searches_controller')
const BooksController = () => import('#controllers/books_controller')
const AuthorsController = () => import('#controllers/authors_controller')
const SeriesController = () => import('#controllers/series_controller')

router.get('/ping', async () => {
  return {
    version: process.env.npm_package_version,
  }
})

openapi.registerRoutes('/api-docs')

// Book

router.get('/book', [BooksController, 'index'])
router.get('/book/:asin', [BooksController, 'index'])
router.get('/book/sku/:sku', [BooksController, 'sku'])
router.get('/book/:asin/chapters', [BooksController, 'chapters'])

router.get('/search', [SearchesController, 'index'])

router
  .get('/quick-search', [SearchesController, 'quickSearch'])

// Legacy route for backward compatibility
router.get('/chapters/:asin', [BooksController, 'chapters'])

// Author

router.get('/author', [AuthorsController, 'search'])

// Name-based author books search (for authors without ASIN)
router
  .get('/author/books', [AuthorsController, 'booksByName'])

router.get('/author/:asin', [AuthorsController, 'index'])

router
  .get('/author/:asin/books', [AuthorsController, 'books'])

// Legacy route for backward compatibility
router
  .get('/author/books/:asin', [AuthorsController, 'books'])

// Series
router.get('/series', [SeriesController, 'search'])

router.get('/series/:asin', [SeriesController, 'index'])

router
  .get('/series/:asin/books', [SeriesController, 'books'])

router
  .get('/podcast/:asin', [SeriesController, 'podcast'])

// Legacy route for backward compatibility
router
  .get('/series/books/:asin', [SeriesController, 'books'])

router
  .get(':region/quick-search/search', [SearchesController, 'absQuickSearch'])

router.get(':region/search', [SearchesController, 'abs'])

router.get('/db/book', [DbController, 'book'])
