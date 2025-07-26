build:
	cargo build --release --target wasm32-unknown-unknown --package dtrack_backend --locked
	
extract-candid:
	candid-extractor "target/wasm32-unknown-unknown/release/dtrack_backend.wasm" > "src/dtrack_backend/dtrack_backend.did"

