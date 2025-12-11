---
name: "Data Analyzer"
description: "Analyze datasets and generate insights using statistical methods and visualization"
version: "1.0.0"
author: "Goose Bridge Team"
capabilities:
  - id: "analyze_dataset"
    name: "Analyze Dataset"
    description: "Perform comprehensive data analysis on datasets"
    inputSchema:
      type: object
      properties:
        datasetPath:
          type: string
          description: "Path to dataset file (CSV, JSON, Excel)"
        analysisType:
          type: string
          enum: ["statistical", "trend", "correlation", "distribution", "outlier"]
          description: "Type of analysis to perform"
        columns:
          type: array
          items: { type: string }
          description: "Specific columns to analyze (optional)"
  - id: "generate_report"
    name: "Generate Report"
    description: "Create detailed analysis reports"
    inputSchema:
      type: object
      properties:
        analysisData:
          type: object
          description: "Data from previous analysis"
        format:
          type: string
          enum: ["pdf", "html", "markdown", "excel"]
          description: "Report format"
        includeVisuals:
          type: boolean
          default: true
          description: "Include charts and visualizations"
allowedTools:
  - "computer_type_text"
  - "computer_paste_text"
  - "computer_screenshot"
---

# Data Analyzer Skill

This skill provides comprehensive data analysis capabilities, enabling Claude to process datasets, perform statistical analysis, and generate detailed reports with visualizations.

## Capabilities

### Analyze Dataset

Perform various types of data analysis:
- **Statistical**: Descriptive statistics, distributions, summaries
- **Trend**: Time series analysis, trend detection
- **Correlation**: Relationship analysis between variables
- **Distribution**: Probability distributions, histograms
- **Outlier**: Anomaly detection, outlier analysis

### Generate Report

Create professional analysis reports:
- **PDF**: Print-ready documents
- **HTML**: Interactive web reports
- **Markdown**: Lightweight formatted reports
- **Excel**: Data with charts and pivot tables

## Usage Examples

### Basic Statistical Analysis

```json
{
  "datasetPath": "/data/sales_data.csv",
  "analysisType": "statistical",
  "columns": ["revenue", "profit", "units_sold"]
}
```

### Trend Analysis

```json
{
  "datasetPath": "/data/website_analytics.csv",
  "analysisType": "trend",
  "columns": ["date", "visitors", "page_views"]
}
```

### Correlation Analysis

```json
{
  "datasetPath": "/data/customer_data.csv",
  "analysisType": "correlation",
  "columns": ["age", "income", "spending_score"]
}
```

### Generate PDF Report

```json
{
  "analysisData": {
    "summary": "...",
    "charts": ["histogram", "scatter_plot"],
    "insights": ["..."]
  },
  "format": "pdf",
  "includeVisuals": true
}
```

## Implementation Details

This skill uses advanced data processing techniques:

1. **Data Loading**: Read various file formats (CSV, JSON, Excel)
2. **Data Cleaning**: Handle missing values, outliers, duplicates
3. **Analysis**: Apply statistical methods and algorithms
4. **Visualization**: Generate charts and graphs
5. **Reporting**: Create formatted reports

## Supported Analysis Types

### Statistical Analysis
- **Descriptive Statistics**: Mean, median, mode, standard deviation
- **Distribution Analysis**: Skewness, kurtosis, normality tests
- **Frequency Analysis**: Value counts, histograms
- **Summary Statistics**: Quartiles, percentiles, ranges

### Trend Analysis
- **Time Series Analysis**: Seasonal patterns, trends
- **Moving Averages**: Smoothing techniques
- **Growth Rates**: Percentage changes over time
- **Forecasting**: Basic predictive analysis

### Correlation Analysis
- **Pearson Correlation**: Linear relationships
- **Spearman Correlation**: Rank-based correlations
- **Correlation Matrix**: Multi-variable relationships
- **Heatmaps**: Visual correlation representation

### Distribution Analysis
- **Histogram Analysis**: Data distribution visualization
- **Probability Plots**: Normal distribution testing
- **Box Plots**: Quartile and outlier visualization
- **Density Plots**: Smoothed distribution curves

### Outlier Detection
- **Z-Score Method**: Standard deviation-based detection
- **IQR Method**: Interquartile range analysis
- **Visual Detection**: Scatter plots, box plots
- **Statistical Tests**: Outlier significance testing

## Output Formats

### Analysis Results

```json
{
  "success": true,
  "datasetPath": "/data/sales.csv",
  "analysisType": "statistical",
  "results": {
    "summary": {
      "totalRecords": 1000,
      "columns": 5,
      "missingValues": 10
    },
    "statistics": {
      "revenue": {
        "mean": 1500.50,
        "median": 1200.00,
        "std": 800.25,
        "min": 100.00,
        "max": 5000.00
      }
    },
    "charts": [
      "histogram_revenue.png",
      "box_plot_revenue.png",
      "scatter_plot_revenue_vs_profit.png"
    ],
    "insights": [
      "Revenue distribution is right-skewed",
      "Average revenue is $1500 with high variance",
      "Potential outliers detected in high revenue range"
    ]
  },
  "metadata": {
    "analysisTime": 2500,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

### Report Generation

```json
{
  "success": true,
  "reportPath": "/reports/analysis_report.pdf",
  "format": "pdf",
  "pages": 15,
  "chartsIncluded": 8,
  "executiveSummary": "...",
  "metadata": {
    "generationTime": 3000,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

## Advanced Features

### Custom Analysis Functions

Define custom analysis logic:

```json
{
  "datasetPath": "/data/custom_data.csv",
  "analysisType": "custom",
  "customFunction": "calculate_customer_lifetime_value",
  "parameters": {
    "discountRate": 0.05,
    "analysisPeriod": 12
  }
}
```

### Multi-Dataset Analysis

Analyze relationships between multiple datasets:

```json
{
  "datasets": [
    "/data/sales.csv",
    "/data/marketing.csv",
    "/data/crm.csv"
  ],
  "analysisType": "correlation",
  "joinKeys": ["customer_id", "date"]
}
```

### Real-time Analysis

Stream processing for real-time data:

```json
{
  "dataStream": "kafka://broker:9092/topic",
  "analysisType": "trend",
  "windowSize": 3600,
  "updateInterval": 60
}
```

### Machine Learning Integration

Apply ML models for advanced analysis:

```json
{
  "datasetPath": "/data/features.csv",
  "analysisType": "ml_analysis",
  "model": "random_forest",
  "targetVariable": "churn",
  "features": ["age", "usage", "satisfaction"]
}
```

## Data Visualization

### Chart Types Supported
- **Histograms**: Distribution visualization
- **Scatter Plots**: Relationship visualization
- **Line Charts**: Trend visualization
- **Bar Charts**: Categorical data comparison
- **Box Plots**: Quartile and outlier visualization
- **Heatmaps**: Correlation matrix visualization
- **Pie Charts**: Proportional data representation

### Visualization Configuration

```json
{
  "charts": [
    {
      "type": "histogram",
      "column": "revenue",
      "bins": 20,
      "color": "blue",
      "title": "Revenue Distribution"
    },
    {
      "type": "scatter",
      "xColumn": "ad_spend",
      "yColumn": "revenue",
      "trendLine": true,
      "title": "Ad Spend vs Revenue"
    }
  ]
}
```

## Error Handling

The skill handles common data analysis issues:
- Missing or corrupted data
- Invalid file formats
- Insufficient data for analysis
- Statistical test failures
- Visualization generation errors

## Best Practices

1. **Data Quality**: Always check data quality before analysis
2. **Sample Size**: Ensure adequate sample sizes for statistical validity
3. **Outlier Handling**: Decide on outlier treatment strategy
4. **Visualization**: Choose appropriate chart types for data
5. **Interpretation**: Provide context for statistical results

## Integration with Goose

This skill integrates with Goose's data processing pipeline:

- **Data Pipeline**: Chain multiple analysis operations
- **Result Caching**: Cache expensive analysis results
- **Parallel Processing**: Process multiple datasets concurrently
- **Error Recovery**: Automatic retry on analysis failures

## Security Considerations

- **Data Privacy**: Handle sensitive data appropriately
- **Access Control**: Restrict access to sensitive datasets
- **Data Retention**: Implement proper data retention policies
- **Audit Logs**: Track data access and analysis operations

## Performance Optimization

- **Data Sampling**: Use sampling for large datasets
- **Column Selection**: Analyze only required columns
- **Memory Management**: Handle memory usage for large datasets
- **Parallel Processing**: Utilize multiple CPU cores

## Troubleshooting

### Common Issues

1. **Memory Errors**: Reduce dataset size or use sampling
2. **Slow Performance**: Optimize analysis parameters
3. **Invalid Results**: Check data quality and format
4. **Visualization Errors**: Verify chart parameters

### Debug Mode

Enable detailed analysis logging:

```json
{
  "datasetPath": "/data/sales.csv",
  "analysisType": "statistical",
  "debug": true,
  "verbose": true,
  "profilePerformance": true
}
```

## Data Analysis Patterns

### Customer Segmentation

Analyze customer data for segmentation:

```typescript
// Load customer data
const customers = await loadDataset('/data/customers.csv');

// Perform clustering analysis
const segments = await performClustering(customers, {
  features: ['age', 'income', 'spending'],
  algorithm: 'kmeans',
  clusters: 5
});

// Generate segment profiles
const profiles = await generateSegmentProfiles(segments);
```

### Sales Performance Analysis

Analyze sales data for insights:

```typescript
// Load sales data
const sales = await loadDataset('/data/sales.csv');

// Perform trend analysis
const trends = await analyzeTrends(sales, {
  timeColumn: 'date',
  valueColumn: 'revenue',
  period: 'monthly'
});

// Identify top performers
const topProducts = await identifyTopPerformers(sales, {
  groupBy: 'product',
  metric: 'revenue',
  topN: 10
});
```

### A/B Test Analysis

Analyze A/B test results:

```typescript
// Load experiment data
const experiment = await loadDataset('/data/ab_test.csv');

// Perform statistical analysis
const results = await analyzeABTest(experiment, {
  groupColumn: 'variant',
  metricColumn: 'conversion_rate',
  significanceLevel: 0.05
});

// Generate confidence intervals
const confidence = await calculateConfidenceIntervals(results);
```

## Future Enhancements

- Real-time streaming analytics
- Advanced machine learning models
- Interactive dashboard generation
- Automated insight generation
- Natural language query interface
- Advanced time series forecasting
