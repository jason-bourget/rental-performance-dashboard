# Meridian Capital - Portfolio Dashboard

A beautiful single-page web dashboard for tracking apartment building investment performance. Built for fractional property owners to monitor monthly and historical performance across standard rental metrics.

## Features

- **Portfolio Overview** - Total value, monthly cash flow, occupancy rate, and annualized returns
- **Revenue & NOI Trends** - Interactive line chart showing 12-month performance
- **Expense Breakdown** - Doughnut chart visualizing operating costs
- **Property Performance Table** - Detailed metrics for each property with trend indicators
- **Occupancy Comparison** - Horizontal bar chart comparing properties
- **Key Metrics Panel** - Rent/unit, expense ratio, DSCR, and more
- **Activity Feed** - Recent leases, payments, maintenance, and turnovers

## Quick Start

Simply open `index.html` in your browser - no build tools or server required!

```bash
# Option 1: Open directly
start index.html  # Windows
open index.html   # macOS

# Option 2: Use a local server (for development)
npx serve .
# or
python -m http.server 8000
```

## Tech Stack

- **HTML5** - Semantic markup
- **CSS3** - Custom properties, Grid, Flexbox, animations
- **Vanilla JavaScript** - No framework dependencies
- **Chart.js** - Beautiful, responsive charts (loaded via CDN)
- **Google Fonts** - Fraunces (display) + DM Sans (body)

## Project Structure

```
rental-performance-dashboard/
├── index.html      # Main HTML structure
├── styles.css      # Complete styling with CSS variables
├── app.js          # Charts, data, and interactivity
└── README.md       # This file
```

## Customization

### Adding Real Data

Replace the sample data in `app.js`:

```javascript
const portfolioData = {
    properties: [
        {
            id: 1,
            name: "Your Property Name",
            address: "123 Main St, City",
            units: 48,
            occupancy: 97.9,
            grossRevenue: 89400,
            noi: 55200,
            capRate: 5.8,
            ownershipPercent: 15,
            trend: 2.4
        },
        // ... more properties
    ],
    monthlyData: {
        labels: ['Jan', 'Feb', ...],
        revenue: [285000, 288000, ...],
        noi: [171000, 174000, ...]
    },
    expenses: {
        labels: ['Property Tax', 'Insurance', ...],
        values: [28500, 12400, ...],
        colors: [...]
    }
};
```

### Theme Colors

Modify CSS variables in `:root` to change the color scheme:

```css
:root {
    --accent-gold: #d4a853;      /* Primary accent */
    --accent-emerald: #10b981;   /* Positive trends */
    --accent-rose: #f43f5e;      /* Negative trends */
    --bg-primary: #0a0e17;       /* Main background */
    --bg-card: #1a2234;          /* Card backgrounds */
}
```

## Key Metrics Explained

| Metric | Description |
|--------|-------------|
| NOI | Net Operating Income = Gross Revenue - Operating Expenses |
| Cap Rate | Capitalization Rate = NOI / Property Value |
| Cash-on-Cash | Annual Cash Flow / Total Cash Invested |
| DSCR | Debt Service Coverage Ratio = NOI / Debt Payments |
| Expense Ratio | Operating Expenses / Gross Revenue |

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT
