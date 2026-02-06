#!/bin/bash
# HTTP API Examples for Arrangent
# These examples demonstrate how to interact with the Arrangent API using curl

SERVER="http://localhost:3000"

echo "=== Arrangent HTTP API Examples ==="
echo ""

# 1. Health Check
echo "1. Health Check"
echo "GET /health"
curl -s "$SERVER/health" | jq
echo ""

# 2. API Discovery
echo "2. API Discovery - List available resources"
echo "GET /api/v1"
curl -s "$SERVER/api/v1" | jq
echo ""

# 3. Create Topology
echo "3. Create Topology"
echo "POST /api/v1/topologies"
curl -s -X POST "$SERVER/api/v1/topologies" \
  -H "Content-Type: application/json" \
  -d '{
  "apiVersion": "arrangent.io/v1",
  "kind": "Topology",
  "metadata": {
    "name": "my-workflow",
    "namespace": "default"
  },
  "spec": {
    "nodes": [
      {
        "id": "splitter",
        "name": "Task Splitter",
        "type": "splitter",
        "geminiSettings": {
          "temp": 0.3,
          "tokens": 4096
        },
        "dependencies": []
      },
      {
        "id": "worker",
        "name": "Parallel Workers",
        "type": "worker",
        "geminiSettings": {
          "temp": 0.7,
          "tokens": 2048
        },
        "parallel": 3,
        "dependencies": ["splitter"]
      },
      {
        "id": "merger",
        "name": "Result Merger",
        "type": "merger",
        "geminiSettings": {
          "temp": 0.3,
          "tokens": 4096
        },
        "dependencies": ["worker"]
      }
    ],
    "connections": [
      { "from": "splitter", "to": "worker", "channel": "tasks" },
      { "from": "worker", "to": "merger", "channel": "results" }
    ]
  }
}' | jq
echo ""

# 4. List Topologies
echo "4. List Topologies"
echo "GET /api/v1/topologies"
curl -s "$SERVER/api/v1/topologies" | jq
echo ""

# 5. Get Topology Details
echo "5. Get Topology Details"
echo "GET /api/v1/topologies/my-workflow"
curl -s "$SERVER/api/v1/topologies/my-workflow" | jq
echo ""

# 6. Get Topology Status
echo "6. Get Topology Status"
echo "GET /api/v1/topologies/my-workflow/status"
curl -s "$SERVER/api/v1/topologies/my-workflow/status" | jq
echo ""

# 7. List All Nodes
echo "7. List All Nodes"
echo "GET /api/v1/nodes"
curl -s "$SERVER/api/v1/nodes" | jq
echo ""

# 8. Get Specific Node
echo "8. Get Specific Node"
echo "GET /api/v1/nodes/worker"
curl -s "$SERVER/api/v1/nodes/worker" | jq
echo ""

# 9. List Instances for a Node
echo "9. List Instances for a Node"
echo "GET /api/v1/nodes/worker/instances"
curl -s "$SERVER/api/v1/nodes/worker/instances" | jq
echo ""

# 10. List All Instances
echo "10. List All Instances"
echo "GET /api/v1/instances"
curl -s "$SERVER/api/v1/instances" | jq
echo ""

# 11. Get Instance Details
echo "11. Get Instance Details (replace INSTANCE_ID with actual ID)"
echo "GET /api/v1/instances/{INSTANCE_ID}"
# curl -s "$SERVER/api/v1/instances/INSTANCE_ID" | jq
echo "(Skipped - requires actual instance ID)"
echo ""

# 12. Get Instance Status
echo "12. Get Instance Status"
echo "GET /api/v1/instances/{INSTANCE_ID}/status"
echo "(Skipped - requires actual instance ID)"
echo ""

# 13. Update Instance Status (Pause)
echo "13. Update Instance Status - Pause"
echo "PUT /api/v1/instances/{INSTANCE_ID}/status"
# curl -s -X PUT "$SERVER/api/v1/instances/INSTANCE_ID/status" \
#   -H "Content-Type: application/json" \
#   -d '{"action": "pause"}' | jq
echo "(Skipped - requires actual instance ID)"
echo ""

# 14. Update Instance Status (Resume)
echo "14. Update Instance Status - Resume"
echo "PUT /api/v1/instances/{INSTANCE_ID}/status"
# curl -s -X PUT "$SERVER/api/v1/instances/INSTANCE_ID/status" \
#   -H "Content-Type: application/json" \
#   -d '{"action": "resume"}' | jq
echo "(Skipped - requires actual instance ID)"
echo ""

# 15. Interact with Instance
echo "15. Interact with Instance - Send Custom Prompt"
echo "POST /api/v1/instances/{INSTANCE_ID}/interact"
# curl -s -X POST "$SERVER/api/v1/instances/INSTANCE_ID/interact" \
#   -H "Content-Type: application/json" \
#   -d '{"prompt": "Please focus on performance optimization"}' | jq
echo "(Skipped - requires actual instance ID)"
echo ""

# 16. Create Execution
echo "16. Create Execution - Start Task Processing"
echo "POST /api/v1/executions"
curl -s -X POST "$SERVER/api/v1/executions" \
  -H "Content-Type: application/json" \
  -d '{
  "input": {
    "task": "Analyze the architecture of a microservices system",
    "requirements": [
      "Identify key components",
      "Analyze communication patterns",
      "Suggest improvements"
    ]
  }
}' | jq
echo ""

# 17. Delete Instance
echo "17. Delete/Stop Instance"
echo "DELETE /api/v1/instances/{INSTANCE_ID}"
echo "(Skipped - requires actual instance ID)"
echo ""

# 18. Delete Topology
echo "18. Delete Topology"
echo "DELETE /api/v1/topologies/my-workflow"
# Uncomment to actually delete
# curl -s -X DELETE "$SERVER/api/v1/topologies/my-workflow" | jq
echo "(Commented out to preserve topology)"
echo ""

echo "=== Examples Complete ==="
echo ""
echo "Note: Some examples are skipped because they require actual instance IDs."
echo "Run these after creating a topology and starting an execution."
