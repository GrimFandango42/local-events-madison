# 🚀 Quick Start Guide - Get Testing in 5 Minutes

This guide gets you up and running with the Local Events Platform for testing **immediately**. Perfect for evaluating the enhanced features and GPT-5 recommended improvements.

## ⚡ Super Quick Setup

```bash
# 1. Install dependencies
npm install

# 2. Run the automated setup script
npm run setup

# 3. Start the development server
npm run dev
```

**That's it!** Your platform will be running at `http://localhost:3000` with sample Madison data.

## 🧪 Testing the Enhanced Features

### **✅ Features Ready for Testing:**

#### **1. Enhanced Events Page**
- Visit `http://localhost:3000/events`
- **Test neighborhood filtering** - dropdown with Madison neighborhoods
- **Test search functionality** - loading states and error handling
- **Test filter combinations** - category + neighborhood + search
- **Test responsive design** - works perfectly on mobile

#### **2. Dynamic API Integration**
- Neighborhoods API: `http://localhost:3000/api/neighborhoods`
- Events with filtering: `http://localhost:3000/api/events?neighborhood=Downtown`
- Real database integration (no more mock data!)

#### **3. Enhanced Date Parsing**
- **Natural language dates** - "today", "tomorrow", "this friday"
- **Multiple formats** - 02/20/2024, February 20, 2024, ISO dates
- **Time parsing** - 7:30 PM, 19:30, 7pm
- **Timezone handling** - Madison (America/Chicago) timezone

#### **4. Event Collection System**
```bash
# Test the scraping system
npm run start:collector

# Validate configuration
npm run config:validate
```

#### **5. Comprehensive Test Suite**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run with coverage
npm test:coverage
```

### **🔧 What Was Fixed from GPT-5 Review:**

✅ **Completed scraping infrastructure** - No more placeholder functions  
✅ **Real database integration** - Mock data replaced with Prisma queries  
✅ **Enhanced date parsing** - Handles "today", "this Friday", etc.  
✅ **Event deduplication** - Prevents duplicate events in database  
✅ **Comprehensive logging** - Full scraping and error tracking  
✅ **Madison timezone handling** - Proper America/Chicago timezone support  

## 📊 Test Database

The setup script creates sample data:

- **2 venues**: Majestic Theatre, Memorial Union
- **1 event source**: Majestic Theatre scraping configuration
- **2 sample events**: Concert and Jazz Night
- **Madison neighborhoods**: 12 neighborhoods with descriptions

## 🧪 Running Specific Tests

### **Date Parser Tests**
```bash
npm test -- tests/unit/dateParser.test.ts
```
Tests all date parsing scenarios including edge cases.

### **API Integration Tests**
```bash
npm test -- tests/api/events.test.ts
```
Tests the enhanced events API with filtering.

### **MCP Collector Tests**
```bash
npm test -- tests/integration/mcpEventCollector.test.ts
```
Tests the complete event collection pipeline.

## 🔍 Key Testing Areas

### **1. Neighborhood Filtering**
- Go to `/events`
- Select different neighborhoods from dropdown
- Verify events filter correctly
- Check API calls in browser dev tools

### **2. Search Functionality**
- Enter search terms
- Watch loading states
- Test error handling (disconnect wifi during search)
- Try empty results

### **3. Date Parsing**
Open browser console and test:
```javascript
// Test in browser console
const dateTests = [
  "today at 7pm",
  "tomorrow",  
  "this friday",
  "02/20/2024",
  "February 20, 2024",
  "next weekend"
];

// Check the date parser results
dateTests.forEach(test => {
  console.log(`"${test}" ->`, new Date(test));
});
```

### **4. Database Integration**
```bash
# Open database browser
npm run db:studio
```
- View events, venues, sources
- Check relationships
- Verify data integrity

## 🚨 Expected Behavior

### **✅ What Should Work:**
- Events page loads with sample data
- Neighborhood filtering works
- Search returns results
- Mobile responsive design
- All tests pass
- Date parsing handles common formats

### **⚠️ Known Limitations (Future Phase):**
- Scraping disabled by default (ENABLE_SCRAPING=false)
- Limited to sample Madison venues
- No user authentication yet
- No real-time scraping (manual trigger only)

## 🔧 Configuration

### **Environment Variables**
The setup script creates `.env.local` with:
```env
NODE_ENV=development
CITY_NAME=madison
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="generated-secret"
ENABLE_SCRAPING=false
```

### **City Configuration**
Edit `config/madison.json` to customize:
- Colors and branding
- Neighborhoods list
- Venue information
- Feature toggles

## 📈 Performance Testing

### **Lighthouse Scores (Target)**
```bash
# Build and test production build
npm run build
npm start
```

- **Performance**: 95+
- **Accessibility**: 100
- **Best Practices**: 100
- **SEO**: 100

### **Load Testing**
```bash
# Create test data
npm run db:seed

# Check performance with many events
```

## 🎯 Next Steps After Testing

1. **Add your API keys** to `.env.local`
2. **Enable scraping** with `ENABLE_SCRAPING=true`
3. **Add real Madison venues** to the database
4. **Customize branding** in `config/madison.json`
5. **Deploy to production** using the deployment guides

## 🆘 Troubleshooting

### **Port Already in Use**
```bash
# Kill process on port 3000
npx kill-port 3000
```

### **Database Issues**
```bash
# Reset database
rm dev.db
npm run db:push
npm run setup
```

### **Test Failures**
```bash
# Clear cache and reinstall
npm run clean
rm -rf node_modules
npm install
```

### **TypeScript Errors**
```bash
# Check types
npm run typecheck

# Generate Prisma client
npm run db:generate
```

## 📞 Getting Help

- **Test failures?** Check the logs in console
- **API errors?** Check Network tab in DevTools
- **Database issues?** Use `npm run db:studio` to inspect
- **Build problems?** Try `npm run clean` first

---

## 🎉 You're Ready!

The platform is now ready for comprehensive testing with all GPT-5 recommended improvements implemented. Enjoy exploring the enhanced Local Events Platform! 

**Key URLs:**
- **Main site**: http://localhost:3000
- **Events page**: http://localhost:3000/events  
- **API**: http://localhost:3000/api/events
- **Database**: `npm run db:studio`