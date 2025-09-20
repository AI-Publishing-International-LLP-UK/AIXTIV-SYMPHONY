# 🎼 SEVEN SERVICES INTERFACE DESIGN STANDARDS
**For Quantswarm Development Team**

## LAYOUT SPECIFICATIONS

### THREE-COLUMN LAYOUT CONSTRAINTS
```
LEFT SIDEBAR: 80px width (fixed)
CENTER PANEL: calc(100vw - 160px - RIGHT_PANEL_WIDTH)  
RIGHT PANEL: 400px width (expandable to 600px max)
```

### LEFT SIDEBAR (80px)
- **7 Service Icons** stacked vertically
- Icon size: 48x48px
- Spacing: 16px between icons
- Background: #1a1a1a
- Hover state: 20% opacity increase
- Active state: Blue accent border (2px)

### CENTER PANEL STANDARDS
- **Header Section:** 60px height
  - Service title (24px font, bold)
  - Last updated (12px font, gray)
- **Status Grid:** 4 metrics in 2x2 grid
  - Each metric: 180x80px card
  - Font: 18px value, 12px label
  - Background: #2a2a2a, border: 1px #404040
- **Activity List:** Max 4 items visible
  - Item height: 48px
  - Status badges: 80px width, right-aligned
- **Action Bar:** 40px height, 5 buttons max
  - Button: 120px width, 32px height
  - System colors only

### RIGHT PANEL (DETAIL VIEW)
- **Trigger:** Click on any activity item or metric
- **Width:** 400px default, 600px expanded
- **Sections:**
  - Header: 80px (title + close button)
  - Content: Scrollable area
  - Actions: 60px footer

## DESIGN CONSTRAINTS

### COLOR PALETTE (STRICT)
```css
--background-primary: #1a1a1a
--background-secondary: #2a2a2a  
--border-color: #404040
--text-primary: #ffffff
--text-secondary: #cccccc
--accent-blue: #0066cc
--status-green: #00cc66
--status-yellow: #cccc00
--status-red: #cc0000
```

### TYPOGRAPHY RESTRICTIONS
- Font Family: System fonts only (SF Pro Display on macOS)
- Header: 24px, weight 600
- Body: 14px, weight 400
- Caption: 12px, weight 400
- NO custom fonts, NO web fonts

### SPACING SYSTEM (8px Grid)
- Micro: 4px
- Small: 8px  
- Medium: 16px
- Large: 24px
- XL: 32px

### COMPONENT SPECIFICATIONS

#### SERVICE PANEL CARDS
```css
.service-panel {
  padding: 24px;
  background: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 16px;
}
```

#### STATUS METRICS
```css
.status-metric {
  width: 180px;
  height: 80px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
```

#### ACTIVITY ITEMS
```css
.activity-item {
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

## INTERACTION STANDARDS

### CLICK BEHAVIORS
1. **Left Icon Click:** Display service panel in center
2. **Activity Item Click:** Expand right panel with details
3. **Metric Card Click:** Show trend data in right panel
4. **Action Button Click:** Execute service action + feedback

### ANIMATION CONSTRAINTS
- Panel transitions: 200ms ease-in-out
- Hover states: 100ms ease
- Loading states: Subtle pulse animation only
- NO fancy effects, NO parallax, NO complex animations

### RIGHT PANEL CONTENT STRUCTURE
```
┌─ DETAIL HEADER (80px) ─────────┐
│ Title + Close Button           │
├─ SCROLLABLE CONTENT ──────────┤
│ • Detailed metrics             │
│ • Extended activity history    │
│ • Charts/graphs (if needed)    │
│ • Related data                 │
├─ ACTION FOOTER (60px) ─────────┤
│ Primary + Secondary actions    │
└────────────────────────────────┘
```

## SERVICE-SPECIFIC CONSTRAINTS

### BIDSUITE DETAIL PANEL
- Opportunity cards: 100% width, 120px height
- Bid status pipeline: Horizontal progress bar
- Financial data: Right-aligned, monospace font
- Max 10 opportunities visible, pagination required

### COMMUNICATIONS DETAIL  
- Message threads: Chat-like layout
- Response rates: Percentage bars
- Contact cards: 280px width
- Timeline view: Vertical progress indicators

### ROI TRACKING DETAIL
- Chart area: 360px x 200px max
- Data tables: Striped rows, sortable headers
- Currency: Always formatted with $ symbol
- Percentage values: Green positive, red negative

## TECHNICAL REQUIREMENTS

### RESPONSIVE BREAKPOINTS
- Desktop: 1200px+ (full three-column)
- Tablet: 768px-1199px (collapse left sidebar)
- Mobile: <768px (stack panels vertically)

### PERFORMANCE CONSTRAINTS
- Page load: <2 seconds
- Panel transitions: <200ms
- Data refresh: Background only, no loading spinners
- Memory usage: <50MB for entire interface

### ACCESSIBILITY STANDARDS
- Keyboard navigation: Tab through all interactive elements
- Screen reader: Proper ARIA labels on all components
- Color contrast: 4.5:1 minimum ratio
- Focus indicators: 2px blue outline

## QUANTSWARM DEVELOPMENT RULES

### WHAT YOU CAN DO
✅ Use the specified color palette exactly
✅ Follow the spacing system (8px grid)
✅ Create variations within the component specs
✅ Add subtle micro-interactions
✅ Optimize for performance

### WHAT YOU CANNOT DO
❌ Change layout proportions (80px, 400px, etc.)
❌ Use colors outside the defined palette
❌ Add external dependencies
❌ Create popup windows or modals  
❌ Implement complex animations
❌ Deviate from the three-column structure

## TESTING REQUIREMENTS

### Browser Support
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

### Device Testing
- MacBook Pro 13" (user's primary device)
- External 4K monitors
- iPad Pro (secondary testing)

---

**FINAL CONSTRAINT:** All implementations must feel like native system applications, not web applications. Think macOS Finder, Activity Monitor, or Terminal - clean, fast, functional.