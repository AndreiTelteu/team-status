// @ts-check
import { getAllEmployees, addEmployeeDB, getAllStatuses, saveStatusDB } from "./db";

const PORT = 3000;
const API_PREFIX = "/api";

console.log("Starting Bun server...");

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // --- CORS Preflight Handling ---
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204, // No Content
        headers: {
          "Access-Control-Allow-Origin": "*", // Allow requests from any origin (adjust in production!)
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400", // Cache preflight response for 1 day
        },
      });
    }

    // --- CORS Headers for Actual Requests ---
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // Allow requests from any origin (adjust in production!)
      "Content-Type": "application/json", // Default content type
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
              // Could be duplicate or DB error
              return new Response(JSON.stringify({ error: "Failed to add employee (maybe duplicate?)" }), { status: 409, headers: corsHeaders }); // 409 Conflict
            }
          } catch (error) {
            console.error("Error parsing POST /employees body:", error);
            return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: corsHeaders });
          }
        }
      }

      // --- Statuses API ---
      if (route === "/statuses") {
        if (method === "GET") {
          const statuses = getAllStatuses();
          return new Response(JSON.stringify(statuses), { headers: corsHeaders });
        }
        if (method === "POST") {
          try {
            const body = await req.json();
            const { userId, date, statusText } = body;

            if (!userId || !date || typeof statusText === 'undefined') {
              return new Response(JSON.stringify({ error: "Missing required fields: userId, date, statusText" }), { status: 400, headers: corsHeaders });
            }

            // Basic validation (more robust validation needed in real app)
            if (typeof userId !== 'string' || typeof date !== 'string' || typeof statusText !== 'string') {
               return new Response(JSON.stringify({ error: "Invalid data types for fields" }), { status: 400, headers: corsHeaders });
            }
             // Optional: Validate date format YYYY-MM-DD
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                 return new Response(JSON.stringify({ error: "Invalid date format. Use YYYY-MM-DD." }), { status: 400, headers: corsHeaders });
            }


            const success = saveStatusDB(userId, date, statusText);
            if (success) {
              // Return the updated statuses object after saving
              const updatedStatuses = getAllStatuses();
              return new Response(JSON.stringify(updatedStatuses), { status: 200, headers: corsHeaders });
            } else {
              return new Response(JSON.stringify({ error: "Failed to save status" }), { status: 500, headers: corsHeaders });
            }
          } catch (error) {
            console.error("Error parsing POST /statuses body:", error);
            return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: corsHeaders });
          }
        }
      }
    }

    // --- Fallback for unhandled routes ---
    return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers: corsHeaders });
  },
  error(error) {
    console.error("Server error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" } // Ensure JSON header even for errors
    });
  },
});

console.log(`Bun server listening on http://localhost:${PORT}`);
