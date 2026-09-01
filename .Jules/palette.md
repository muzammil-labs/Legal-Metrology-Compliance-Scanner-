## 2024-11-20 - Global Focus Visible State
**Learning:** Found that most interactive elements (`button`, `a`, `select`, `input`, `[tabindex]`) lack focus-visible styles in this application, making keyboard navigation difficult for accessibility.
**Action:** Implemented a global `:focus-visible` rule in `frontend/src/index.css` using the primary Cyan theme accent (`#22d3ee`) with outline offsets to ensure focus indicators are visible against both light and dark backgrounds.
