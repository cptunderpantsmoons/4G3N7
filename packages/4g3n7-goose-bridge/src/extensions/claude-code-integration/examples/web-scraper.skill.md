---
name: "Web Scraper"
description: "Scrape data from websites using CSS selectors and extract structured information"
version: "1.0.0"
author: "Goose Bridge Team"
capabilities:
  - id: "scrape"
    name: "Scrape Website"
    description: "Extract data from a given URL using CSS selectors"
    inputSchema:
      type: object
      properties:
        url:
          type: string
          description: "URL to scrape (must include http:// or https://)"
        selector:
          type: string
          description: "CSS selector for data extraction"
        extractText:
          type: boolean
          default: true
          description: "Whether to extract text content"
        extractLinks:
          type: boolean
          default: false
          description: "Whether to extract href attributes"
allowedTools:
  - "computer_type_text"
  - "computer_press_keys"
  - "computer_screenshot"
---

# Web Scraper Skill

This skill enables Claude to scrape websites and extract structured data using CSS selectors. It's perfect for gathering information from web pages, monitoring content changes, or extracting specific data points.

## Capabilities

### Scrape Website

Extract data from any website by providing:
- **URL**: The webpage to scrape
- **CSS Selector**: Element(s) to extract data from
- **Extract Options**: Choose text content, links, or both

## Usage Examples

### Basic Text Extraction

```json
{
  "url": "https://news.ycombinator.com",
  "selector": ".storylink",
  "extractText": true,
  "extractLinks": false
}
```

### News Headline Monitor

```json
{
  "url": "https://www.reddit.com/r/programming/top/",
  "selector": "h3._eYtD2XCVieq6emjKBH3m",
  "extractText": true
}
```

### Product Price Tracker

```json
{
  "url": "https://example-store.com/product/123",
  "selector": ".price-current, .product-price",
  "extractText": true
}
```

### Link Extractor

```json
{
  "url": "https://wikipedia.org/wiki/OpenAI",
  "selector": "a[href^='http']",
  "extractText": false,
  "extractLinks": true
}
```

## Implementation Details

This skill uses Claude's computer use capabilities to:

1. Open Firefox browser
2. Navigate to the specified URL
3. Wait for page to load completely
4. Use browser developer tools or custom scripts to execute the CSS selector
5. Extract and structure the requested data
6. Return results in JSON format

## Supported Selectors

- **Element selectors**: `div`, `span`, `a`
- **Class selectors**: `.class-name`
- **ID selectors**: `#element-id`
- **Attribute selectors**: `[href]`, `[data-value]`
- **Pseudo-classes**: `:first-child`, `:nth-child(2)`
- **Combinators**: `.container .item`, `div > p`

## Output Format

```json
{
  "success": true,
  "url": "https://example.com",
  "selector": ".data-class",
  "results": [
    {
      "text": "Extracted text content",
      "href": "https://example.com/link",
      "html": "<div class='data'>content</div>",
      "position": 1
    }
  ],
  "metadata": {
    "totalResults": 5,
    "extractionTime": 1250,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

## Error Handling

The skill handles common issues:
- Invalid URLs
- Network timeouts
- Missing elements
- JavaScript-rendered content
- Anti-bot protections

## Best Practices

1. **Be Specific**: Use precise CSS selectors to avoid extracting unwanted content
2. **Handle Dynamic Content**: For JavaScript-heavy sites, allow extra loading time
3. **Rate Limiting**: Don't spam requests to the same site
4. **Content Verification**: Always validate extracted data before use

## Advanced Features

### Multiple Selectors

Execute multiple extractions in one task:

```json
{
  "url": "https://example.com",
  "selectors": [
    { "selector": ".title", "type": "text" },
    { "selector": ".price", "type": "text" },
    { "selector": "img.product-image", "type": "attributes", "attributes": ["src", "alt"] }
  ]
}
```

### Wait Conditions

Wait for specific elements before extraction:

```json
{
  "url": "https://example.com",
  "selector": ".data",
  "waitFor": ".loading-indicator",
  "timeout": 10000
}
```

### Custom Extraction Logic

Define custom extraction patterns:

```json
{
  "url": "https://example.com",
  "selector": ".data",
  "extractionLogic": {
    "pattern": "Price: \\$(\\d+\\.\\d+)",
    "replacement": "$1"
  }
}
```

## Integration with Goose

This skill integrates seamlessly with Goose's task management:

- Automatic retry on failure
- Progress tracking
- Result caching
- Error reporting
- Multi-step workflows

## Security Considerations

- Only scrape publicly accessible content
- Respect robots.txt files
- Avoid sensitive or personal information
- Implement proper authentication for protected content
- Monitor for rate limiting or blocking

## Performance Tips

- Use efficient CSS selectors
- Minimize screenshot frequency
- Cache results when possible
- Parallelize multiple URL requests
- Optimize extraction logic

## Troubleshooting

### Common Issues

1. **Timeout Errors**: Increase timeout or check network connectivity
2. **Empty Results**: Verify CSS selector and page structure
3. **Blocked by Bot Protection**: Add delays or use different user agents
4. **JavaScript Issues**: Ensure page fully loads before extraction

### Debug Mode

Enable detailed logging for troubleshooting:

```json
{
  "url": "https://example.com",
  "selector": ".data",
  "debug": true
}
```

## Future Enhancements

- Proxy rotation support
- Headless browser options
- Advanced JavaScript execution
- Machine learning-based extraction
- Real-time monitoring capabilities
