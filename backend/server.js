// @ts-check
import { getAllEmployees, addEmployeeDB, getAllStatuses, saveStatusDB, getStatusesForUserAndDate } from "./db";
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

        if (data.type === 'typing') {
          const { userId, date, statusText } = data.payload;
          if (!userId || !date || typeof statusText === 'undefined' || typeof userId !== 'string' || typeof date !== 'string' || typeof statusText !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            console.error("Invalid typing message received:", data.payload);
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid typing data or format' }));
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
