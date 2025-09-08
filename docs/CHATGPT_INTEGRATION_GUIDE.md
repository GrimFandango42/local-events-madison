# ChatGPT Integration Guide - Local Events Madison

This guide will help you connect the Local Events Madison platform to ChatGPT using the custom MCP connector, enabling natural language interaction with the event discovery platform.

## 🎯 What This Integration Provides

With the ChatGPT connector, you can use natural language to:

- **Search Events**: "Find music events this weekend in Madison"
- **Get Details**: "Tell me more about the jazz concert at Overture Center"
- **Add Sources**: "Add The Sylvee as a music venue source"
- **View Statistics**: "Show me platform statistics"

## 📋 Prerequisites

Before setting up the integration, ensure you have:

- ✅ ChatGPT Pro, Business, or Enterprise account
- ✅ Local Events Madison platform installed and running
- ✅ Node.js 18+ installed on your system
- ✅ The ChatGPT connector files (already created)

## 🚀 Setup Instructions

### Step 1: Verify Local Events Platform

1. **Start the platform**:
   ```bash
   cd "C:\AI_Projects\Local Events"
   npm run dev
   ```

2. **Verify it's running**:
   - Open http://localhost:3001 in your browser
   - You should see the Local Events Madison homepage

### Step 2: Test the Connector

1. **Navigate to connector directory**:
   ```bash
   cd "C:\AI_Projects\Local Events\chatgpt-connector"
   ```

2. **Run the test**:
   ```bash
   npm test
   ```

3. **Expected output**:
   ```
   ✅ Server startup successful
   ✅ Tool listing successful
   ✅ API connectivity successful
   ```

### Step 3: Add Connector to ChatGPT

#### Option A: Using Custom Connector (Recommended)

1. **Open ChatGPT** in your web browser
2. **Go to Settings** (gear icon)
3. **Navigate to "Connectors"** (Beta section)
4. **Click "Add Custom Connector"**
5. **Fill in the details**:
   - **Name**: `Local Events Madison`
   - **Description**: `Search and manage Madison local events`
   - **Type**: `Custom MCP Server`
   - **Command**: `node "C:\AI_Projects\Local Events\chatgpt-connector\mcp-server.js"`
   - **Working Directory**: `C:\AI_Projects\Local Events\chatgpt-connector`

6. **Save and Enable** the connector

#### Option B: Global Installation

1. **Install globally**:
   ```bash
   cd "C:\AI_Projects\Local Events\chatgpt-connector"
   npm install -g .
   ```

2. **Add to ChatGPT**:
   - **Command**: `local-events-mcp`
   - **Working Directory**: (leave blank)

### Step 4: Test Integration

1. **Start a new ChatGPT conversation**
2. **Try these example queries**:

   ```
   🗨️ "What events are happening in Madison this weekend?"
   
   🗨️ "Find food events near downtown Madison"
   
   🗨️ "Show me the platform statistics"
   
   🗨️ "Add Mickies Dairy Bar as a restaurant event source at https://mickiesdairybar.com"
   ```

3. **Verify responses**:
   - ChatGPT should provide structured event information
   - Statistics should show current platform data
   - Source submissions should be acknowledged

## 🛠️ Available Commands

### Search Events
```
"Find [category] events [time period] in Madison"
"What's happening [when] in Madison?"
"Search for events about [topic]"
```

### Get Event Details
```
"Tell me more about [event name]"
"Get details for event ID [id]"
"What's the full information for [venue] event?"
```

### Add Sources
```
"Add [venue name] as a [type] source at [URL]"
"Submit [restaurant name] as an event source"
"Register [organization] for event tracking"
```

### View Statistics
```
"Show platform statistics"
"How many events are in the system?"
"What are the recent events?"
```

## 🔧 Troubleshooting

### Common Issues

#### 1. "Connector not found" Error
- **Check file paths** in ChatGPT settings
- **Verify Node.js** is installed and accessible
- **Test manually**:
  ```bash
  node "C:\AI_Projects\Local Events\chatgpt-connector\mcp-server.js"
  ```

#### 2. "API Connection Failed"
- **Ensure Local Events platform is running**:
  ```bash
  cd "C:\AI_Projects\Local Events"
  npm run dev
  ```
- **Check localhost:3001** is accessible
- **Verify no firewall blocking**

#### 3. "No Events Found"
- **Platform may be empty** - this is expected for new installations
- **Add some test data** by submitting sources
- **Check database connection**

#### 4. "Permission Denied"
- **Make script executable**:
  ```bash
  chmod +x "C:\AI_Projects\Local Events\chatgpt-connector\mcp-server.js"
  ```
- **Check Node.js permissions**

### Debug Mode

1. **Run connector in debug mode**:
   ```bash
   cd "C:\AI_Projects\Local Events\chatgpt-connector"
   npm run dev
   ```

2. **Check server logs** for detailed error messages

3. **Test individual components**:
   ```bash
   # Test API connectivity
   curl http://localhost:3001/api/dashboard
   
   # Test connector tools
   npm test
   ```

## 📚 Advanced Usage

### Custom Event Queries

The connector supports complex queries:

```
"Find music events under $20 this month"
"Show me all food festivals in the next 3 months"
"What art events are happening at galleries downtown?"
```

### Batch Operations

You can submit multiple sources at once:

```
"Add these as restaurant sources:
- Graze at https://graze.com
- L'Etoile at https://letoile-restaurant.com
- The Old Fashioned at https://theoldfashioned.com"
```

### Integration with Other Tools

The connector works alongside other ChatGPT tools:

```
"Find music events this weekend and create a calendar entry"
"Search for food events and generate a restaurant guide"
"Get platform statistics and create a summary report"
```

## 🔒 Security Notes

- **Local access only**: The connector only works with localhost
- **Read-only by default**: Most operations are read-only
- **Source submissions**: Require manual review before activation
- **No sensitive data**: Only public event information is accessible

## 📈 Monitoring Usage

### Check Connector Status

1. **View active connectors** in ChatGPT settings
2. **Monitor conversation logs** for connector usage
3. **Check Local Events platform logs** for API calls

### Performance Metrics

The connector provides usage statistics:
- API call frequency
- Response times
- Error rates
- Popular queries

## 🎉 Success Indicators

You'll know the integration is working when:

- ✅ ChatGPT responds with structured event data
- ✅ Event searches return relevant Madison events
- ✅ Source submissions are acknowledged
- ✅ Platform statistics are displayed correctly
- ✅ Natural language queries work smoothly

## 📞 Support

If you encounter issues:

1. **Check this troubleshooting guide first**
2. **Test components individually**
3. **Review server logs for errors**
4. **Create GitHub issue** with error details and steps to reproduce

## 🚀 Next Steps

Once the integration is working:

1. **Explore different query types**
2. **Add more Madison event sources**
3. **Test with real event data**
4. **Share feedback for improvements**
5. **Consider contributing new features**

---

**🎊 Congratulations!** You now have ChatGPT connected to your Local Events Madison platform. Enjoy discovering Madison events through natural conversation!