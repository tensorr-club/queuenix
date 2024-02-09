#!/bin/bash

# build the application
npm run build

# start all the process
pm2 start dist/create-playground-worker.js
pm2 start dist/delete-playground-worker.js
pm2 start dist/start-playground-worker.js
pm2 start dist/close-playground-worker.js