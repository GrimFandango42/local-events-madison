#!/usr/bin/env node

/**
 * ChatGPT MCP Connector for Local Events Madison
 * Provides API access to the Local Events platform for ChatGPT agent integration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';

// Base URL for the Local Events API (defaults to Next.js dev at 3000)
const BASE_URL = process.env.LOCAL_EVENTS_API_URL || 'http://localhost:3000';

class LocalEventsMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'local-events-madison',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_events',
            description: 'Search for local events in Madison, WI',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query for events'
                },
                category: {
                  type: 'string',
                  description: 'Event category filter',
                  enum: ['food', 'music', 'culture', 'art', 'festival', 'market', 'nightlife']
                },
                dateFrom: {
                  type: 'string',
                  description: 'Start date filter (YYYY-MM-DD)'
                },
                dateTo: {
                  type: 'string',
                  description: 'End date filter (YYYY-MM-DD)'
                }
              },
            },
          },
          {
            name: 'get_event_details',
            description: 'Get detailed information about a specific event',
            inputSchema: {
              type: 'object',
              properties: {
                eventId: {
                  type: 'string',
                  description: 'The unique identifier of the event'
                }
              },
              required: ['eventId']
            },
          },
          {
            name: 'submit_event_source',
            description: 'Submit a new event source for Madison venues',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Name of the venue or organization'
                },
                url: {
                  type: 'string',
                  description: 'Website URL for the event source'
                },
                sourceType: {
                  type: 'string',
                  description: 'Type of event source',
                  enum: ['restaurant', 'venue', 'organization', 'festival', 'other']
                },
                description: {
                  type: 'string',
                  description: 'Description of the venue or source'
                }
              },
              required: ['name', 'url', 'sourceType']
            },
          },
          {
            name: 'get_dashboard_stats',
            description: 'Get platform statistics and recent events',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          }
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        switch (name) {
          case 'search_events':
            return await this.searchEvents(args);
          case 'get_event_details':
            return await this.getEventDetails(args);
          case 'submit_event_source':
            return await this.submitEventSource(args);
          case 'get_dashboard_stats':
            return await this.getDashboardStats();
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ]
        };
      }
    });
  }

  setupResourceHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'local-events://api/events',
            name: 'Madison Events API',
            description: 'Access to Madison local events data',
            mimeType: 'application/json',
          },
          {
            uri: 'local-events://api/sources',
            name: 'Event Sources API',
            description: 'Manage event sources and venues',
            mimeType: 'application/json',
          }
        ],
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      if (uri === 'local-events://api/events') {
        const events = await this.fetchEvents();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(events, null, 2),
            },
          ],
        };
      }
      
      throw new Error(`Unknown resource: ${uri}`);
    });
  }

  async searchEvents(args) {
    const params = new URLSearchParams();
    if (args.query) params.append('search', args.query);
    if (args.category) params.append('category', args.category);
    if (args.dateFrom) params.append('dateFrom', args.dateFrom);
    if (args.dateTo) params.append('dateTo', args.dateTo);

    const response = await fetch(`${BASE_URL}/api/events?${params}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to search events');
    }

    const events = data.data || [];
    const eventsList = events.map(event => 
      `• **${event.title}**\n` +
      `  📅 ${new Date(event.startDateTime).toLocaleDateString()}\n` +
      `  📍 ${event.venue?.name || event.customLocation || 'Location TBD'}\n` +
      `  🏷️ ${event.category}\n` +
      `  ${event.description ? `📝 ${event.description.substring(0, 100)}...` : ''}\n`
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${events.length} events in Madison:\n\n${eventsList}`
        }
      ]
    };
  }

  async getEventDetails(args) {
    const response = await fetch(`${BASE_URL}/api/events/${args.eventId}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Event not found');
    }

    const event = data.data;
    const details = `**${event.title}**\n\n` +
      `📅 **Date:** ${new Date(event.startDateTime).toLocaleDateString()}\n` +
      `🕐 **Time:** ${new Date(event.startDateTime).toLocaleTimeString()}\n` +
      `📍 **Location:** ${event.venue?.name || event.customLocation}\n` +
      `🏷️ **Category:** ${event.category}\n` +
      `💰 **Price:** ${event.priceMin === 0 ? 'Free' : `$${(event.priceMin / 100).toFixed(0)}+`}\n` +
      `📝 **Description:** ${event.description || 'No description available'}\n` +
      `🔗 **More Info:** ${event.ticketUrl || event.sourceUrl || 'N/A'}`;

    return {
      content: [
        {
          type: 'text',
          text: details
        }
      ]
    };
  }

  async submitEventSource(args) {
    const response = await fetch(`${BASE_URL}/api/sources/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: args.name,
        url: args.url,
        sourceType: args.sourceType,
        description: args.description,
        submittedBy: 'ChatGPT Agent'
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to submit event source');
    }

    return {
      content: [
        {
          type: 'text',
          text: `✅ Successfully submitted event source: ${args.name}\n` +
               `📍 URL: ${args.url}\n` +
               `🏷️ Type: ${args.sourceType}\n` +
               `📝 Description: ${args.description || 'None provided'}\n\n` +
               `The source will be reviewed and added to the Madison events platform.`
        }
      ]
    };
  }

  async getDashboardStats() {
    const response = await fetch(`${BASE_URL}/api/dashboard`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch dashboard stats');
    }

    const stats = data.data;
    const statsText = `📊 **Madison Events Platform Statistics**\n\n` +
      `📈 **Total Events:** ${stats.totalEvents}\n` +
      `📅 **Events This Week:** ${stats.eventsLast7Days}\n` +
      `🏢 **Total Sources:** ${stats.totalSources}\n` +
      `✅ **Active Sources:** ${stats.activeSources}\n\n` +
      `🎯 **Recent Events:**\n` +
      (stats.recentEvents?.map(event => 
        `• ${event.title} (${new Date(event.startDateTime).toLocaleDateString()})`
      ).join('\n') || 'No recent events');

    return {
      content: [
        {
          type: 'text',
          text: statsText
        }
      ]
    };
  }

  async fetchEvents() {
    const response = await fetch(`${BASE_URL}/api/events`);
    const data = await response.json();
    return data.success ? data.data : [];
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Local Events MCP server running on stdio');
  }
}

const server = new LocalEventsMCPServer();
server.run().catch(console.error);
