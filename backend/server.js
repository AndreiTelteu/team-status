// @ts-check
import { getAllEmployees, addEmployeeDB, getAllStatuses, saveStatusDB, getStatusesForUserAndDate } from "./db";

const PORT = 3000;
const API_PREFIX = "/api";
const WS_PATH = "/ws"; // Define a path for WebSocket connections
const WS_TOPIC = "status-updates"; // Topic for broadcasting status changes

console.log("Starting Bun server with WebSocket support...");

// Store connected WebSocket clients (Bun handles this internally via topics)
// const clients = new Set(); // No longer needed with Bun's publish/subscribe

const server = Bun.serve({
  port: PORT,
  async fetch(req, server) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // --- WebSocket Upgrade ---
    // Check if the request is for the WebSocket endpoint and upgrade
    if (path === WS_PATH) {
      const success = server.upgrade(req);
      if (success) {
        // Bun automatically handles the response for successful upgrades.
        console.log("WebSocket connection upgraded.");
        return; // Return undefined to let Bun handle the response
      } else {
        // Upgrade failed
        return new Response("WebSocket upgrade failed", { status: 400 });
      }
    }


    // --- CORS Preflight Handling ---
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204, // No Content
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // --- CORS Headers for Actual Requests ---
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    };

    // --- API Routing ---
    if (path.startsWith(API_PREFIX)) {
      const route = path.substring(API_PREFIX.length);

      // --- Employees API ---
      if (route === "/employees") {
        if (method === "GET") {
          const employees = getAllEmployees();
          return new Response(JSON.stringify(employees), { headers: corsHeaders });
        }
        if (method === "POST") {
          // ... (keep existing POST /employees logic)
           try {
            const body = await req.json();
            const name = body?.name;
            if (!name || typeof name !== 'string') {
              return new Response(JSON.stringify({ error: "Invalid employee name provided" }), { status: 400, headers: corsHeaders });
            }
            const newEmployee = addEmployeeDB(name);
            if (newEmployee) {
              // Broadcast updated employees list? Optional.
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

      // --- Statuses API (GET only, POST is handled via WebSocket now) ---
      if (route === "/statuses") {
        if (method === "GET") {
          const statuses = getAllStatuses();
          return new Response(JSON.stringify(statuses), { headers: corsHeaders });
        }
         // POST /statuses is removed - updates happen via WebSocket
         if (method === "POST") {
             return new Response(JSON.stringify({ error: "Status updates are now handled via WebSocket connection at /ws" }), { status: 405, headers: corsHeaders }); // 405 Method Not Allowed
         }
      }
    }

    // --- Fallback for unhandled routes ---
    return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers: corsHeaders });
  },

  // --- WebSocket Handler ---
  websocket: {
    // Called when a client connects
    open(ws) {
      console.log("WebSocket client connected");
      ws.subscribe(WS_TOPIC); // Subscribe the client to the status updates topic
       // Send current statuses to the newly connected client
       const currentStatuses = getAllStatuses();
       ws.send(JSON.stringify({ type: 'all_statuses', payload: currentStatuses }));
    },

    // Called when a message is received from a client
    message(ws, message) {
      console.log("Received message:", message);
      try {
        // Ensure message is a string before parsing
        const messageString = typeof message === 'string' ? message : Buffer.from(message).toString('utf-8');
        const data = JSON.parse(messageString);

        // Handle 'typing' updates
        if (data.type === 'typing') {
          const { userId, date, statusText } = data.payload;

          // Basic validation
          if (!userId || !date || typeof statusText === 'undefined') {
            console.error("Invalid typing message received:", data.payload);
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid typing data' }));
            return;
          }
           if (typeof userId !== 'string' || typeof date !== 'string' || typeof statusText !== 'string') {
               console.error("Invalid typing message types:", data.payload);
               ws.send(JSON.stringify({ type: 'error', message: 'Invalid data types for typing update' }));
               return;
           }
           if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
               console.error("Invalid date format:", date);
               ws.send(JSON.stringify({ type: 'error', message: 'Invalid date format. Use YYYY-MM-DD.' }));
               return;
           }


          // Update the status in the database/memory
          const success = saveStatusDB(userId, date, statusText); // saveStatusDB now updates in-memory

          if (success) {
            // Broadcast the *specific* update to all subscribed clients
            const updatePayload = { userId, date, statusText };
            server.publish(
              WS_TOPIC,
              JSON.stringify({ type: 'status_update', payload: updatePayload })
            );
            // console.log("Published status update:", updatePayload);
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

    // Called when a client disconnects
    close(ws, code, message) {
      console.log("WebSocket client disconnected:", code, message);
      ws.unsubscribe(WS_TOPIC); // Unsubscribe from the topic
    },

    // Handle backpressure (optional but good practice)
    drain(ws) {
      // console.log("WebSocket backpressure relieved");
    },
  },

  error(error) {
    console.error("Server error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
    });
  },
});

console.log(`Bun server listening on http://localhost:${PORT}`);
console.log(`WebSocket endpoint available at ws://localhost:${PORT}${WS_PATH}`);
