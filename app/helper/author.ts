import { Infer } from '@vinejs/vine/types'
import { authorBookValidator, getBasicValidator, searchAuthorValidator } from '#validators/common'
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

    const response = await AuthorHelper.getAuthorPage(payload)

    if (ctx)
      void ctx.logger.info({
        message: `Requested Audible Author`,
        author_took: Math.abs(startTime.getTime() - new Date().getTime()),
      })

    if (!author) author = new Author()

if (response.status === 200) {
      const json: any = response.data
      // Check if we have either page_details or sections with data
      const hasPageDetails = json?.page_details?.model && Object.keys(json.page_details.model).length > 0
      const hasSections = json?.sections && json.sections.length > 0
      
      
      
      if (!json || (!hasPageDetails && !hasSections)) {
        
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
    const sections = json.sections
    for (const section of sections) {
      if (section?.model?.person_image_url) {
        author.image = section.model.person_image_url.replace(/\._.*_/, '')
      }
      for (const item of section.model.items || []) {
        if (item.view.template === 'ExpandableText' && item.model.expandable_content) {
          author.description = item.model.expandable_content?.value?.replace('\t', '').trim() || ''
        }
      }
      author.fetchedDescription = true
    }
    if (json.page_details?.model?.title) {
      author.name = json.page_details?.model?.title?.replace('\t', '').trim() || ''
    } else {
      // Fallback: extract author name from book data in sections
      for (const section of sections) {
        for (const row of section?.model?.rows || []) {
          const authors = row?.product_metadata?.authors || []
          const matchingAuthor = authors.find((a: any) => a.asin === payload.asin)
          if (matchingAuthor?.name) {
            author.name = matchingAuthor.name.replace('\t', '').trim()
            break
          }
        }
        if (author.name) break
      }
    }
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
    let author = await Author.query().where('asin', payload.asin).first()
    if (!author) {
      author = await AuthorHelper.fetchFromAudible({ ...payload })
    }
    if (!author) {
      throw new NotFoundException()
    }

    const asins: string[] = []
    const startTime = DateTime.now()
    const ctx = HttpContext.get()
    
    // Use catalog search by author name (more reliable than ASIN)
    const response = await axios.get(
      `https://api.audible${regionMap[payload.region]}/1.0/catalog/products`,
      {
        headers: { ...getAudibleExtraHeaders(payload.region), ...audibleHeaders },
        params: {
          author: author.name,
          num_results: 50,
          response_groups: 'product_desc,contributors,series,product_attrs',
          sort_by: '-ReleaseDate'
        }
      }
    )
    
    if (response.data?.products && response.data.products.length > 0) {
      for (const product of response.data.products) {
        // Verify the author ASIN matches to filter out false positives
        const matchesAuthor = product.authors?.some((a: any) => a.asin === payload.asin)
        if (product.asin && matchesAuthor && !asins.includes(product.asin)) {
          asins.push(product.asin)
        }
      }
    }

    if (ctx)
      void ctx.logger.info({
        message: `Requested Audible Author Books`,
        author_book_num: asins.length,
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
