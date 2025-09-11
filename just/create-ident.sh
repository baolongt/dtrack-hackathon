#!/bin/bash

for i in $(seq 1 10); do
  dfx identity new --storage-mode=plaintext --force "test$i"
done

dfx identity new --storage-mode=plaintext --force "demo_1"