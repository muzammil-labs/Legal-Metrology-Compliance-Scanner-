# Checklist before adding any feature or dependency

## Adding a new Python package
- [ ] Confirm it is pure Python (no C extensions): pip download <pkg> --no-deps -d /tmp/chk && file /tmp/chk/*.whl — must say "Zip archive", not ELF binary
- [ ] Add to requirements.txt with a version pin (>=X.Y,<Z)
- [ ] Wrap its import in try/except in the file that uses it with a safe fallback
- [ ] Run: cd api && python -m pytest tests/test_startup.py -v — must pass

## Adding a new API route
- [ ] Add a test in tests/test_startup.py or tests/test_api.py
- [ ] Ensure the route returns JSON (not plain text or HTML) for all error cases
- [ ] Run tests before pushing

## Changing database schema
- [ ] Add a migration ALTER TABLE statement inside run_migrations() in database.py
- [ ] Test with: VERCEL=1 python -c "from database import engine, Base; Base.metadata.create_all(engine); print('OK')"
