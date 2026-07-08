# Wave 0 Cleanup Receipt

Result: FAIL
Port 5173 listeners: 1

## Listener Probe
- TCP    127.0.0.1:5173         0.0.0.0:0              LISTENING       35960

## Notes
- QA scripts only stop child dev-server processes they start.
- Playwright browser instances are closed inside browser-smoke finally blocks.
