#!/bin/bash

# AquaLog Startup Script
# Run this to start the app with Ollama translation

echo "========================================="
echo "  AquaLog - Pump Operation Dashboard"
echo "========================================="
echo ""

# Check if Ollama is needed
echo "Starting Ollama with qwen2.5:14b model..."
echo "(Press Ctrl+C to stop)"
echo ""

# Start Ollama in background
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to start
sleep 3

# Pull model if not present
echo "Checking for qwen2.5:14b model..."
ollama list | grep -q "qwen2.5:14b" || ollama pull qwen2.5:14b

echo ""
echo "Starting AquaLog..."
echo "Access at: http://localhost:3000"
echo ""

# Start the app
bun run dev --hostname 0.0.0.0
