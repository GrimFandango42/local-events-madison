# Local Events Madison - ChatGPT Connector

This MCP (Model Context Protocol) server enables ChatGPT to interact with the Local Events Madison platform, allowing users to search for local events, get event details, submit new event sources, and access platform statistics through natural language.

## Features

- 🔍 **Search Events**: Find local Madison events by keyword, category, or date range
- 📋 **Event Details**: Get comprehensive information about specific events
- ➕ **Submit Sources**: Add new venues and event sources to the platform
- 📊 **Dashboard Stats**: Access platform statistics and recent events
- 🔄 **Real-time Integration**: Direct API integration with the Local Events platform

## Installation

### Prerequisites
- Node.js 18+ installed
- Local Events platform running locally (Next.js dev on `localhost:3000` by default)
- ChatGPT Pro/Business/Enterprise account

### Setup Steps

1. **Install Dependencies**:
   ```bash
   cd chatgpt-connector
   npm install
   ```

2. **Make Executable**:
   ```bash
   chmod +x mcp-server.js
   ```

3. **Test the Connector**:
   ```bash
   npm start
   ```

If your Local Events API runs on a non-default port, set:

```bash
export LOCAL_EVENTS_API_URL="http://localhost:3000"
```

## ChatGPT Integration

### Method 1: Direct MCP Configuration

1. Open ChatGPT and go to Settings
2. Navigate to "Connectors" (Beta)
3. Add a new custom connector:
   - **Name**: `Local Events Madison`
   - **Description**: `Search and manage Madison local events`
   - **Connection**: `Custom MCP Server`
   - **Command**: `node C:\AI_Projects\Local Events\chatgpt-connector\mcp-server.js`

### Method 2: Global Installation

1. **Install Globally**:
   ```bash
   npm install -g .
   ```

2. **Add to ChatGPT**:
   - **Command**: `local-events-mcp`

## Available Tools

### 🔍 search_events
Search for local events in Madison with optional filters:
- `query`: Search query for events
- `category`: Filter by category (food, music, culture, art, festival, market, nightlife)
- `dateFrom`: Start date filter (YYYY-MM-DD)
- `dateTo`: End date filter (YYYY-MM-DD)

**Example**: "Find music events this weekend"

### 📋 get_event_details
Get detailed information about a specific event:
- `eventId`: The unique identifier of the event

**Example**: "Tell me more about event ID abc123"

### ➕ submit_event_source
Submit a new event source for Madison venues:
- `name`: Name of the venue or organization
- `url`: Website URL for the event source
- `sourceType`: Type (restaurant, venue, organization, festival, other)
- `description`: Optional description

**Example**: "Add The Sylvee as a music venue source"

### 📊 get_dashboard_stats
Get platform statistics and recent events summary.

**Example**: "Show me the platform statistics"

## Usage Examples

Once connected to ChatGPT, you can use natural language commands:

```
🗨️ "What events are happening in Madison this weekend?"

🗨️ "Find food events near downtown Madison"

🗨️ "Add Memorial Union as an event source"

🗨️ "Show me details about the jazz concert at Overture Center"

🗨️ "What are the platform statistics?"
```

## API Endpoints

The connector interfaces with these Local Events Madison API endpoints:

- `GET /api/events` - Search and list events
- `GET /api/events/:id` - Get event details
- `POST /api/sources/submit` - Submit new event source
- `GET /api/dashboard` - Get platform statistics

## Troubleshooting

### Common Issues

1. **Connection Failed**:
   - Ensure Local Events platform is running on `localhost:3001`
   - Check that all npm dependencies are installed
   - Verify Node.js version is 18+

2. **ChatGPT Can't Find Connector**:
   - Verify the file path in ChatGPT settings
   - Ensure the script is executable (`chmod +x mcp-server.js`)
   - Try using absolute paths

3. **API Errors**:
   - Check that the Local Events API is accessible
   - Verify database connection is working
   - Review server logs for errors

### Debug Mode

Run the connector in debug mode:
```bash
npm run dev
```

### Test the Connector

Run basic functionality tests:
```bash
npm test
```

## Development

### Adding New Tools

1. Add the tool definition in `setupToolHandlers()`
2. Implement the handler function
3. Update this README with usage examples
4. Test with ChatGPT integration

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with ChatGPT
5. Submit a pull request

## Security

- The connector only provides read access to public event data
- Source submissions require manual review
- No sensitive data is exposed through the API
- All connections are localhost-only for security

## License

MIT License - see the Local Events Madison project for full license details.

## Support

For issues or questions:
- GitHub Issues: https://github.com/GrimFandango42/local-events-madison/issues
- Local Events Platform Documentation: See main project README
