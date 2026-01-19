import { Infer } from '@vinejs/vine/types'
import { authorBookByNameValidator, authorBookValidator, getBasicValidator, searchAuthorValidator } from '#validators/common'
import Author from '#models/author'
import axios from 'axios'
import { audibleHeaders, getAudibleExtraHeaders, regionMap } from '#config/app'
import { AudibleHelper } from './audible.js'
import { HttpContext } from '@adonisjs/core/http'
import NotFoundException from '#exceptions/not_found_exception'
import { BookHelper } from './book.js'
import Book from '#models/book'
import { DateTime } from 'luxon'
import retryOnUniqueViolation from './parallel_helper.js'

export class AuthorHelper {
  static async get(payload: Infer<typeof getBasicValidator>) {
    
    let authors = await Author.query().where('asin', payload.asin)
    
    const region = payload.region
    // Sort authors so the requested region is first
    authors = authors.sort((a) => {
      if (a.regions.includes(region)) {
        return -1
      }
      return 1
    })

    let author: Author | null = null

    if (authors.length > 0) {
      author = authors[0]
    }

if (
      !payload.cache ||
      !author ||
      author.region !== payload.region ||
      ((!author.description || author.image) && !author.fetchedDescription)
    ) {
      
      try {
        const newAuthor = await AuthorHelper.fetchFromAudible(
          payload,
          !author || author.region !== payload.region ? null : author
        )
        
        if (newAuthor) {
          author = newAuthor
        }
      } catch (error) {
        
      }
      
    }

    
    return author
  }

private static async getAuthorPage(
    payload: Infer<typeof getBasicValidator>,
    token?: string | null
  ) {
    // The region is not important for authors.
    // Only the language is actually important
    // Still, as it's simple to do, we keep the region here. Also for legacy reasons
    const url = `https://api.audible${regionMap[payload.region]}/1.0/screens/audible-android-author-detail/` + payload.asin
    const headers = { ...getAudibleExtraHeaders(payload.region), ...audibleHeaders }
    
    
    return await axios.get(
      `https://api.audible${regionMap[payload.region]}/1.0/screens/audible-android-author-detail/` +
        payload.asin,
      {
        headers: { ...getAudibleExtraHeaders(payload.region), ...audibleHeaders },
        params: {
          tabId: 'titles',
          author_asin: payload.asin,
          title_source: 'all',
          session_id: AudibleHelper.generateRandomSessionId(),
          applicationType: 'Android_App',
          local_time: new Date().toISOString(),
          response_groups: 'always-returned',
          surface: 'Android',
          pageSectionContinuationToken: token,
        },
      }
    )
  }

  private static async fetchFromAudible(
    payload: Infer<typeof getBasicValidator>,
    author?: Author | null
  ) {
    const startTime = new Date()
    const ctx = HttpContext.get()

    // Use the contributors endpoint which returns better data (image + bio)
    const response = await axios.get(
      `https://api.audible.com/1.0/catalog/contributors/${payload.asin}`,
      {
        headers: { ...getAudibleExtraHeaders(payload.region), ...audibleHeaders },
        params: {
          locale: 'en-US'
        },
      }
    )

    if (ctx)
      void ctx.logger.info({
        message: `Requested Audible Author`,
        author_took: Math.abs(startTime.getTime() - new Date().getTime()),
      })

    if (!author) author = new Author()

    if (response.status === 200) {
      const json: any = response.data
      
      if (!json?.contributor) {
        throw new NotFoundException()
      }
      
      return await AuthorHelper.saveResponse(json, payload, author)
    }

    return null
  }

  private static async saveResponse(
    json: any,
    payload: Infer<typeof getBasicValidator>,
    author: Author
  ) {
    const contributor = json.contributor
    
    // Extract data from the contributors endpoint format
    if (contributor.profile_image_url) {
      author.image = contributor.profile_image_url.replace(/\._.*_/, '')
    }
    
    if (contributor.bio) {
      author.description = contributor.bio.replace('\t', '').trim()
    }
    
    if (contributor.name) {
      author.name = contributor.name.replace('\t', '').trim()
    }
    
    author.fetchedDescription = true
    
    if (!author.region) {
      author.region = payload.region
    }
    
    author.asin = payload.asin?.replace('\t', '').trim() || ''

    return await retryOnUniqueViolation(async () => {
      const serializedAuthor = author.serialize()
      
      const { id, asin, region, name, ...rest } = serializedAuthor

      return await Author.updateOrCreate(
        { asin, region, name },
        { ...rest },
        {
          allowExtraProperties: true,
        }
      )
    })
  }

  static async getBooksByAuthor(
    payload: Infer<typeof authorBookValidator>
  ): Promise<Book[] | null> {
    let authorName: string | null = null
    
    // Try to get author from database first
    let author = await Author.query().where('asin', payload.asin).first()
    if (author) {
      authorName = author.name
    }
    
    // If not in DB, try to fetch from Audible author endpoint
    if (!authorName) {
      try {
        author = await AuthorHelper.fetchFromAudible({ ...payload })
        if (author) {
          authorName = author.name
        }
      } catch (e) {
        // Author endpoint failed, will try catalog search below
      }
    }
    
    // If still no name, use the name parameter if provided by caller
    if (!authorName && payload.name) {
      authorName = payload.name
    }
    
    if (!authorName) {
      throw new NotFoundException()
    }

    const asins: string[] = []
    const startTime = DateTime.now()
    const ctx = HttpContext.get()
    
    // Paginate through all results
    const pageSize = 50
    let page = 0
    let hasMore = true
    
    while (hasMore && page <= 20) { // Cap at 20 pages (1000 books max) for safety
      const requestUrl = `https://api.audible${regionMap[payload.region]}/1.0/catalog/products`
      const requestHeaders = { ...getAudibleExtraHeaders(payload.region), ...audibleHeaders }
      const requestParams = {
        author: authorName,
        num_results: pageSize,
        page: page,
        response_groups: 'product_desc,contributors,series,product_attrs,media',
        sort_by: '-ReleaseDate'
      }
      const response = await axios.get(requestUrl, { headers: requestHeaders, params: requestParams })
      
      if (response.data?.products && response.data.products.length > 0) {
        for (const product of response.data.products) {
          // Verify the author ASIN matches to filter out false positives
          const matchesAuthor = product.authors?.some((a: any) => a.asin === payload.asin)
          // Filter to English only (language field is 'english', 'englisch', etc.)
          const isEnglish = product.language?.toLowerCase().startsWith('english') || 
                            product.language?.toLowerCase() === 'englisch'
          
          if (product.asin && matchesAuthor && isEnglish && !asins.includes(product.asin)) {
            asins.push(product.asin)
          }
        }
        
        // If we got fewer than pageSize, we've reached the end
        hasMore = response.data.products.length >= pageSize
        page++
      } else {
        hasMore = false
      }
    }

    if (ctx)
      void ctx.logger.info({
        message: `Requested Audible Author Books`,
        author_book_num: asins.length,
        pages_fetched: page - 1,
        author_book_took: Math.abs(startTime.diffNow().as('milliseconds')),
      })

    if (asins.length === 0) {
      throw new NotFoundException()
    }

    return await new BookHelper().getOrFetchBooks(asins, payload.region, true)
  }

  static async getBooksByAuthorName(
    payload: Infer<typeof authorBookByNameValidator>
  ): Promise<Book[] | null> {
    const asins: string[] = []
    const startTime = DateTime.now()
    const ctx = HttpContext.get()
    
    const pageSize = 50
    let page = 0
    let hasMore = true
    
    while (hasMore && page <= 20) {
      const response = await axios.get(
        `https://api.audible${regionMap[payload.region]}/1.0/catalog/products`,
        {
          headers: { ...getAudibleExtraHeaders(payload.region), ...audibleHeaders },
          params: {
            author: payload.name,
            num_results: pageSize,
            page: page,
            response_groups: 'product_desc,contributors,series,product_attrs,media',
            sort_by: '-ReleaseDate'
          }
        }
      )
      
      if (response.data?.products && response.data.products.length > 0) {
        for (const product of response.data.products) {
          // Match by author name (case-insensitive) since we don't have ASIN
          const matchesAuthor = product.authors?.some(
            (a: any) => a.name?.toLowerCase() === payload.name.toLowerCase()
          )
          // Filter to English only
          const isEnglish = product.language?.toLowerCase().startsWith('english') || 
                            product.language?.toLowerCase() === 'englisch'
          
          if (product.asin && matchesAuthor && isEnglish && !asins.includes(product.asin)) {
            asins.push(product.asin)
          }
        }
        
        hasMore = response.data.products.length >= pageSize
        page++
      } else {
        hasMore = false
      }
    }
    
    if (ctx)
      void ctx.logger.info({
        message: `Requested Audible Author Books By Name`,
        author_name: payload.name,
        author_book_num: asins.length,
        pages_fetched: page,
        author_book_took: Math.abs(startTime.diffNow().as('milliseconds')),
      })
    
    if (asins.length === 0) {
      throw new NotFoundException()
    }
    
    return await new BookHelper().getOrFetchBooks(asins, payload.region, true)
  }

  static async search(payload: Infer<typeof searchAuthorValidator>) {
    const ctx = HttpContext.get()

    const startTime = DateTime.now()

    const response = await axios.get(
      `https://api.audible${regionMap[payload.region]}/1.0/searchsuggestions`,
      {
        headers: { ...getAudibleExtraHeaders(payload.region), ...audibleHeaders },
        params: {
          keywords: payload.name,
          key_strokes: payload.name,
          site_variant: 'android-mshop',
          session_id: AudibleHelper.generateRandomSessionId(),
          local_time: new Date().toISOString(),
          surface: 'Android',
        },
      }
    )

    if (ctx)
      void ctx.logger.info({
        message: `Requested Audible Author Search`,
        search_took: Math.abs(startTime.diffNow().as('milliseconds')),
      })

    const asins: string[] = []

    if (response.status === 200) {
      const json = response.data

      if (json) {
        const items = json.model.items
        for (const item of items) {
          if (item.view?.template && item.view?.template === 'AuthorItemV2') {
            if (item.model?.person_metadata?.asin) {
              asins.push(item.model.person_metadata.asin)
            }
          }
        }
      }

      if (asins.length === 0) {
        return []
      }

      return await Promise.all(
        asins.map(async (asin) => {
          const author = await AuthorHelper.get({
            asin: asin,
            region: payload.region,
            cache: true,
          })
          return author || null
        })
      ).then((results) => results.filter((author) => author !== null))
    }
  }
}
