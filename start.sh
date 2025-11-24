#!/bin/bash

# Exit on error
set -e

# Build the application
npm install
npm run build

# Start the application
npm run start
