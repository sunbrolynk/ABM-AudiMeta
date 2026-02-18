# Privacy Policy for AudiMeta API

**Last Updated:** February 17, 2026

This Privacy Policy describes how AudiMeta ("we," "us," or "our") collects, uses, and shares information when you use our Application Programming Interface (AudiMeta API) hosted at [manager.lostcartographer.xyz](https://manager.lostcartographer.xyz).

By using the API, you agree to the collection and use of information in accordance with this policy.

**1. Data Controller**

The data controller responsible for your information is:

SunBroLynk  
swagar003@gmail.com

**2. Information We Collect**

We collect the following types of information:

*   **Request Logs:** When you make a request to our API, our servers and our infrastructure provider, Cloudflare, automatically log certain information. This includes:
    *   Your IP Address
    *   Date and Time of the request
    *   The specific API endpoint requested
    *   HTTP Method (GET, POST, etc.)
    *   Status code of the response
    *   User-Agent string of your client
    *   Referrer URL (if applicable)
    *   Other technical data passed via standard HTTP headers or collected by Cloudflare for security and performance purposes.
*   **Search Queries:** If your API requests involve search functionality, the search terms you use are logged. These search terms are anonymized (stripped of any direct identifiers linking them back to your specific request log entry) and stored permanently.
*   **Fetched Data:** Data that our API retrieves or generates *as a result* of your specific API request may be stored in our database. This data is not associated with your request and at latest becomes untraceable to the original requesting user once the corresponding request logs (see Section 5: Data Retention) are deleted.

**3. How We Use Your Information**

We use the information we collect for the following purposes:

*   **To Provide and Maintain the API:** Processing your requests is essential to deliver the API service.
*   **To Monitor and Secure the API:** Request logs are used to monitor API usage, detect and prevent fraudulent or malicious activity, diagnose technical problems, and ensure the security and integrity of our systems. This includes using services provided by Cloudflare (see Section 7).
*   **To Improve the API:** Anonymized search queries are stored permanently for caching purposes (to improve response times for common searches).
*   **To Visualize Usage Patterns:** IP addresses from request logs are resolved to approximate geographic locations using a local database (MaxMind GeoLite2). This is performed entirely on our infrastructure — your IP address is not sent to any external geolocation service. The resulting geographic data is used solely to understand regional usage of the service.
*   **To Store Relevant Data:** Storing data fetched as a result of API requests is necessary for the core function of the API.
*   **To Comply with Legal Obligations:** We may use your information if required by law, regulation, or legal process.

**4. Legal Basis for Processing (for GDPR applicability)**

Our legal basis for collecting and using the personal information described above will depend on the specific information and context:

*   **Legitimate Interests:** Processing request logs for security, monitoring, debugging, and geographic usage analysis is based on our legitimate interests, provided these are not overridden by your data protection interests or fundamental rights and freedoms.
*   **Performance of Service:** Processing your API requests to provide the service you are using.
*   **Legal Obligation:** Processing necessary to comply with the law.

**5. Data Retention**

*   **Request Logs:** Information contained in request logs (including IP address and other details listed in Section 2) collected directly by us or via Cloudflare is retained for a maximum of **30 days**. After this period, these logs are automatically deleted.
*   **Anonymized Search Queries:** Anonymized search queries are retained **permanently** for caching and analysis purposes. As they are anonymized, they are no longer considered personal data linked to a specific request after the initial log deletion.
*   **Fetched Data:** Data fetched as a result of your request and stored in our database is retained indefinitely as part of our core dataset. While this data persists, the link connecting it to the specific user/IP that triggered its retrieval is broken once the corresponding request logs are deleted (after max. 30 days).
*   **Geographic Data:** IP-to-location lookups are performed at query time from request logs and are not stored separately. When request logs are deleted, the ability to resolve those IPs to locations is also removed.

**6. Data Sharing and Third Parties**

We do not sell or rent your personal information. We may share information under the following limited circumstances:

*   **Cloudflare:** We use Cloudflare, Inc. as an infrastructure provider for security (e.g., DDoS mitigation, Web Application Firewall) and performance (e.g., Content Delivery Network). Cloudflare processes request data (including IP addresses) on our behalf as part of providing these services. You can find Cloudflare's Privacy Policy here: [https://www.cloudflare.com/privacypolicy/](https://www.cloudflare.com/privacypolicy/)
*   **Axiom:** We use Axiom to store and analyze request logs. As part of this service, Axiom receives logs that include your IP address and other request details. Data is automatically deleted after 30 days. Axiom's Privacy Policy can be found here: [https://axiom.co/privacy](https://axiom.co/privacy)
*   **Legal Requirements:** We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or a government agency).
*   **Business Transfers:** If we are involved in a merger, acquisition, or asset sale, your information may be transferred.

**7. IP Geolocation**

We use a locally hosted MaxMind GeoLite2 database to resolve IP addresses from request logs to approximate geographic locations (city/country level). This lookup is performed entirely on our own infrastructure. Your IP address is **never sent to an external geolocation service** for this purpose. The geographic data is used to visualize where the service is being used and to understand regional adoption. No location data is stored beyond what exists in the request logs themselves.

**8. Self-Hosted Instances**

If you run your own AudiMeta instance, no data is sent to us. All logging, data collection, geolocation, and retention are entirely under your control. This privacy policy applies exclusively to the public instance at [manager.lostcartographer.xyz](https://manager.lostcartographer.xyz).

**9. Your Rights**

Depending on your location (e.g., within the EU/EEA), you may have certain data protection rights:

*   The right to access, update, or delete the information we have on you (Note: Deletion rights regarding request logs are subject to our 30-day retention policy; data that has been anonymized or de-linked cannot be traced back to you).
*   The right of rectification.
*   The right to object to processing.
*   The right of restriction of processing.
*   The right to data portability.
*   The right to withdraw consent (if applicable).

To exercise these rights, please contact us at swagar003@gmail.com. We may need to verify your identity before responding to such requests.

**10. Changes to This Privacy Policy**

We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.

**11. Contact Us**

If you have any questions about this Privacy Policy, please contact us:

SunBroLynk  
swagar003@gmail.com