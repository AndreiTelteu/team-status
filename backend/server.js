// @ts-check
import {
  getAllEmployees,
  addEmployeeDB,
  deleteEmployeeDB,
  getAllClients,
  addClientDB,
  deleteClientDB,
  getAllStatuses,
  saveStatusDB,
  getStatusesForUserAndDate,
  getAllLeavePeriods,
  addLeavePeriodDB,
  updateLeavePeriodDB,
  deleteLeavePeriodDB,
  getAllOffers,
  addOfferDB,
  updateOfferDB,
  deleteOfferDB
} from "./db";
import { existsSync } from "node:fs"; // Use Node's existsSync
import path from "node:path"; // Use Node's path module

const PORT = 3000;
const API_PREFIX = "/api";
const WS_PATH = "/ws"; // Define a path for WebSocket connections
const WS_TOPIC = "status-updates"; // Topic for broadcasting status changes
const STATIC_DIR = path.join(import.meta.dir, "../dist"); // Path to the Vite build output
const INDEX_HTML = path.join(STATIC_DIR, "index.html");

console.log("Starting Bun server with WebSocket and static file support...");
console.log(`Serving static files from: ${STATIC_DIR}`);
console.log(`API prefix: ${API_PREFIX}`);
console.log(`WebSocket path: ${WS_PATH}`);


// Store connected WebSocket clients (Bun handles this internally via topics)
// const clients = new Set(); // No longer needed with Bun's publish/subscribe

const server = Bun.serve({
  port: PORT,
  async fetch(req, server) {
    const url = new URL(req.url);
    let reqPath = url.pathname;
    const method = req.method;

    // --- WebSocket Upgrade ---
    if (reqPath === WS_PATH) {
      const success = server.upgrade(req);
      if (success) {
        console.log("WebSocket connection upgraded.");
        return; // Bun handles the response
      } else {
        return new Response("WebSocket upgrade failed", { status: 400 });
      }
    }

    // --- CORS Preflight Handling (for API routes) ---
    if (method === "OPTIONS" && reqPath.startsWith(API_PREFIX)) {
      return new Response(null, {
        status: 204, // No Content
        headers: {
          "Access-Control-Allow-Origin": "*", // Be more specific in production
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // --- API Routing ---
    if (reqPath.startsWith(API_PREFIX)) {
      const route = reqPath.substring(API_PREFIX.length);
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*", // Be more specific in production
        "Content-Type": "application/json",
      };

      // --- Employees API ---
      if (route === "/employees") {
        if (method === "GET") {
          const employees = getAllEmployees();
          return new Response(JSON.stringify(employees), { headers: corsHeaders });
        }
        if (method === "POST") {
          try {
            const body = await req.json();
            const name = body?.name;
            if (!name || typeof name !== 'string') {
              return new Response(JSON.stringify({ error: "Invalid employee name provided" }), { status: 400, headers: corsHeaders });
            }
            const newEmployee = addEmployeeDB(name);
            if (newEmployee) {
              return new Response(JSON.stringify(newEmployee), { status: 201, headers: corsHeaders });
            } else {
              return new Response(JSON.stringify({ error: "Failed to add employee (maybe duplicate?)" }), { status: 409, headers: corsHeaders });
            }
          } catch (error) {
            console.error("Error parsing POST /employees body:", error);
            return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: corsHeaders });
          }
        }
      }

      // --- Employee by ID API ---
      const employeeMatch = route.match(/^\/employees\/(.+)$/);
      if (employeeMatch) {
        const id = employeeMatch[1];

        if (method === "DELETE") {
          const success = deleteEmployeeDB(id);
          if (success) {
            return new Response(null, { status: 204, headers: corsHeaders });
          } else {
            return new Response(JSON.stringify({ error: "Employee not found or delete failed" }),
              { status: 404, headers: corsHeaders });
          }
        }
      }

      // --- Clients API ---
      if (route === "/clients") {
        if (method === "GET") {
          const clients = getAllClients();
          return new Response(JSON.stringify(clients), { headers: corsHeaders });
        }
        if (method === "POST") {
          try {
            const body = await req.json();
            const name = body?.name;
            if (!name || typeof name !== 'string') {
              return new Response(JSON.stringify({ error: "Invalid client name provided" }), { status: 400, headers: corsHeaders });
            }
            const newClient = addClientDB(name);
            if (newClient) {
              return new Response(JSON.stringify(newClient), { status: 201, headers: corsHeaders });
            } else {
              return new Response(JSON.stringify({ error: "Failed to add client (maybe duplicate?)" }), { status: 409, headers: corsHeaders });
            }
          } catch (error) {
            console.error("Error parsing POST /clients body:", error);
            return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: corsHeaders });
          }
        }
      }

      // --- Client by ID API ---
      const clientMatch = route.match(/^\/clients\/(.+)$/);
      if (clientMatch) {
        const id = clientMatch[1];

        if (method === "DELETE") {
          const success = deleteClientDB(id);
          if (success) {
            return new Response(null, { status: 204, headers: corsHeaders });
          } else {
            return new Response(JSON.stringify({ error: "Client not found or delete failed" }),
              { status: 404, headers: corsHeaders });
          }
        }
      }

      // --- Statuses API (GET only) ---
      if (route === "/statuses") {
        if (method === "GET") {
          const statuses = getAllStatuses();
          return new Response(JSON.stringify(statuses), { headers: corsHeaders });
        }
        if (method === "POST") {
            return new Response(JSON.stringify({ error: "Status updates are handled via WebSocket (/ws)" }), { status: 405, headers: corsHeaders });
        }
      }

      // --- Leave Periods API ---
      if (route === "/leave-periods") {
        if (method === "GET") {
          const leavePeriods = getAllLeavePeriods();
          return new Response(JSON.stringify(leavePeriods), { headers: corsHeaders });
        }
        if (method === "POST") {
          try {
            const body = await req.json();
            if (!body?.fromDate || !body?.untilDate || typeof body.fromDate !== 'string' || typeof body.untilDate !== 'string') {
              return new Response(JSON.stringify({ error: "Invalid leave period data. Both fromDate and untilDate are required." }),
                { status: 400, headers: corsHeaders });
            }
            const newLeavePeriod = addLeavePeriodDB(body);
            if (newLeavePeriod) {
              return new Response(JSON.stringify(newLeavePeriod), { status: 201, headers: corsHeaders });
            } else {
              return new Response(JSON.stringify({ error: "Failed to add leave period" }),
                { status: 500, headers: corsHeaders });
            }
          } catch (error) {
            console.error("Error parsing POST /leave-periods body:", error);
            return new Response(JSON.stringify({ error: "Invalid JSON body" }),
              { status: 400, headers: corsHeaders });
          }
        }
      }

      // --- Leave Period by ID API ---
      const leavePeriodMatch = route.match(/^\/leave-periods\/(\d+)$/);
      if (leavePeriodMatch) {
        const id = parseInt(leavePeriodMatch[1], 10);

        if (method === "PUT") {
          try {
            const body = await req.json();
            if (!body?.fromDate || !body?.untilDate || typeof body.fromDate !== 'string' || typeof body.untilDate !== 'string') {
              return new Response(JSON.stringify({ error: "Invalid leave period data. Both fromDate and untilDate are required." }),
                { status: 400, headers: corsHeaders });
            }
            const updatedLeavePeriod = updateLeavePeriodDB(id, body);
            if (updatedLeavePeriod) {
              return new Response(JSON.stringify(updatedLeavePeriod), { headers: corsHeaders });
            } else {
              return new Response(JSON.stringify({ error: "Leave period not found or update failed" }),
                { status: 404, headers: corsHeaders });
            }
          } catch (error) {
            console.error(`Error parsing PUT /leave-periods/${id} body:`, error);
            return new Response(JSON.stringify({ error: "Invalid JSON body" }),
              { status: 400, headers: corsHeaders });
          }
        }

        if (method === "DELETE") {
          // Extract employeeId from request body for DELETE
          let employeeId;
          try {
            const body = await req.json();
            employeeId = body?.employeeId;
            if (!employeeId || typeof employeeId !== 'string') {
              return new Response(JSON.stringify({ error: "Invalid or missing employeeId" }),
                { status: 400, headers: corsHeaders });
            }
          } catch (error) {
            console.error(`Error parsing DELETE /leave-periods/${id} body:`, error);
            return new Response(JSON.stringify({ error: "Invalid JSON body" }),
              { status: 400, headers: corsHeaders });
          }

          const success = deleteLeavePeriodDB(id, employeeId);
          if (success) {
            return new Response(null, { status: 204, headers: corsHeaders });
          } else {
            return new Response(JSON.stringify({ error: "Leave period not found or delete failed" }),
              { status: 404, headers: corsHeaders });
          }
        }
      }

      // --- Offers API ---
      if (route === "/offers") {
        if (method === "GET") {
          const offers = getAllOffers();
          return new Response(JSON.stringify(offers), { headers: corsHeaders });
        }
        if (method === "POST") {
          try {
            const body = await req.json();
            if (!body?.clientId || !body?.projectName || !body?.requestDate || !body?.status) {
              return new Response(JSON.stringify({ error: "Invalid offer data. clientId, projectName, requestDate, and status are required." }),
                { status: 400, headers: corsHeaders });
            }
            // Priority and estimation are optional, but we'll validate them if provided
            if (body.priority && !['urgent', 'high', 'medium', 'low'].includes(body.priority)) {
              return new Response(JSON.stringify({ error: "Invalid priority value. Must be one of: urgent, high, medium, low" }),
                { status: 400, headers: corsHeaders });
            }
            const newOffer = addOfferDB(body);
            if (newOffer) {
              return new Response(JSON.stringify(newOffer), { status: 201, headers: corsHeaders });
            } else {
              return new Response(JSON.stringify({ error: "Failed to add offer" }),
                { status: 500, headers: corsHeaders });
            }
          } catch (error) {
            console.error("Error parsing POST /offers body:", error);
            return new Response(JSON.stringify({ error: "Invalid JSON body" }),
              { status: 400, headers: corsHeaders });
          }
        }
      }

      // --- Offer by ID API ---
      const offerMatch = route.match(/^\/offers\/(\d+)$/);
      if (offerMatch) {
        const id = parseInt(offerMatch[1], 10);

        if (method === "PUT") {
          try {
            const body = await req.json();
            if (!body?.clientId || !body?.projectName || !body?.requestDate || !body?.status) {
              return new Response(JSON.stringify({ error: "Invalid offer data. clientId, projectName, requestDate, and status are required." }),
                { status: 400, headers: corsHeaders });
            }
            // Priority and estimation are optional, but we'll validate them if provided
            if (body.priority && !['urgent', 'high', 'medium', 'low'].includes(body.priority)) {
              return new Response(JSON.stringify({ error: "Invalid priority value. Must be one of: urgent, high, medium, low" }),
                { status: 400, headers: corsHeaders });
            }
            const updatedOffer = updateOfferDB(id, body);
            if (updatedOffer) {
              return new Response(JSON.stringify(updatedOffer), { headers: corsHeaders });
            } else {
              return new Response(JSON.stringify({ error: "Offer not found or update failed" }),
                { status: 404, headers: corsHeaders });
            }
          } catch (error) {
            console.error(`Error parsing PUT /offers/${id} body:`, error);
            return new Response(JSON.stringify({ error: "Invalid JSON body" }),
              { status: 400, headers: corsHeaders });
          }
        }

        if (method === "DELETE") {
          const success = deleteOfferDB(id);
          if (success) {
            return new Response(null, { status: 204, headers: corsHeaders });
          } else {
            return new Response(JSON.stringify({ error: "Offer not found or delete failed" }),
              { status: 404, headers: corsHeaders });
          }
        }
      }

      // --- Fallback for unhandled API routes ---
      console.log(`API route not found: ${reqPath}`);
      return new Response(JSON.stringify({ error: "API Not Found" }), { status: 404, headers: corsHeaders });
    }

    // --- Static File Serving ---
    // Normalize path: remove leading '/' for joining, handle root
    const requestedFile = reqPath === '/' ? 'index.html' : reqPath.substring(1);
    const filePath = path.join(STATIC_DIR, requestedFile);

    // Security: Prevent directory traversal
    if (!filePath.startsWith(STATIC_DIR)) {
        console.warn(`Attempted directory traversal: ${reqPath}`);
        return new Response("Forbidden", { status: 403 });
    }

    // Check if the file exists
    if (existsSync(filePath)) {
        // console.log(`Serving static file: ${filePath}`);
        const file = Bun.file(filePath);
        // Bun.file automatically sets Content-Type based on extension
        return new Response(file);
    }

    // --- Fallback to index.html for potential client-side routing ---
    // If the file doesn't exist, but it's not an API/WS request,
    // assume it might be a client-side route and serve index.html.
    // Check if index.html exists first.
    if (existsSync(INDEX_HTML)) {
        // console.log(`File not found (${filePath}), serving index.html for client-side routing.`);
        const file = Bun.file(INDEX_HTML);
        return new Response(file, { headers: { "Content-Type": "text/html" } });
    }

    // --- Final 404 Not Found ---
    console.log(`Resource not found: ${reqPath}`);
    return new Response("Not Found", { status: 404 });

  }, // End of fetch handler

  // --- WebSocket Handler ---
  websocket: {
    open(ws) {
      console.log("WebSocket client connected");
      ws.subscribe(WS_TOPIC);
      const currentStatuses = getAllStatuses();
      ws.send(JSON.stringify({ type: 'all_statuses', payload: currentStatuses }));
    },
    message(ws, message) {
      // console.log("Received message:", message); // Can be noisy
      try {
        const messageString = typeof message === 'string' ? message : Buffer.from(message).toString('utf-8');
        const data = JSON.parse(messageString);

        if (data.type === 'typing' || data.type === 'status_update') {
          const { userId, date, statusText } = data.payload;
          if (!userId || !date || typeof statusText === 'undefined' || typeof userId !== 'string' || typeof date !== 'string' || typeof statusText !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            console.error("Invalid status update message received:", data.payload);
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid status update data or format' }));
            return;
          }

          const success = saveStatusDB(userId, date, statusText);
          if (success) {
            const updatePayload = { userId, date, statusText };
            server.publish(
              WS_TOPIC,
              JSON.stringify({ type: 'status_update', payload: updatePayload })
            );
          } else {
            console.error("Failed to save status update via WebSocket");
            ws.send(JSON.stringify({ type: 'error', message: 'Failed to save status update on server' }));
          }
        } else {
            console.warn("Received unknown WebSocket message type:", data.type);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message or process update:", error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format or server error' }));
      }
    },
    close(ws, code, message) {
      console.log("WebSocket client disconnected:", code, message);
      ws.unsubscribe(WS_TOPIC);
    },
    drain(ws) {
      // console.log("WebSocket backpressure relieved");
    },
  }, // End of websocket handler

  error(error) {
    console.error("Server error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
    });
  },
});

console.log(`Bun server listening on http://localhost:${PORT}`);
console.log(`API endpoint: http://localhost:${PORT}${API_PREFIX}`);
console.log(`WebSocket endpoint: ws://localhost:${PORT}${WS_PATH}`);
