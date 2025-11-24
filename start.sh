#!/bin/bash

# Exit on error
set -e

# Build the application
npm install
export PATH=$(npm bin):$PATH
export PATH=$(npm bin):$PATH
npm run build

# Start the application
npm run start
