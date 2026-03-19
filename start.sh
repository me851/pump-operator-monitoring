#!/bin/bash

# AquaLog Startup Script
# Run this to start the app with Ollama translation

echo "========================================="
echo "  AquaLog - Pump Operation Dashboard"
echo "========================================="
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "ERROR: Ollama is not installed!"
    echo ""
    echo "To install, run:"
    echo "  curl -fsSL https://ollama.com/install.sh | sh"
    echo ""
    exit 1
fi

# Start Ollama in background
echo "Starting Ollama..."
ollama serve &
sleep 3

# Show available models
echo ""
echo "Available Ollama models:"
echo "------------------------"
ollama list
echo ""

# Ask user to select model
echo "Enter the model name to use for translation:"
echo "(Press Enter to use default: qwen2.5:14b)"
read -p "> " MODEL

# Use default if empty
if [ -z "$MODEL" ]; then
    MODEL="qwen2.5:14b"
fi

# Check if model exists
if ! ollama list | grep -q "^$MODEL "; then
    echo ""
    echo "Model '$MODEL' not found. Pulling it now..."
    ollama pull $MODEL
fi

# Save selection to .env.local
echo ""
echo "OLLAMA_MODEL=$MODEL" > .env.local

echo ""
echo "Starting AquaLog..."
echo "========================================="
echo ""
echo "Access on THIS computer: http://localhost:3000"
echo ""
echo "To access from PHONE/TABLET on same WiFi:"
echo "1. Find your computer IP (run: hostname -I)"
echo "2. On phone, go to: http://YOUR_IP:3000"
echo ""
echo "Press Ctrl+C to stop"
echo "========================================="

# Start the app
bun run dev --hostname 0.0.0.0
