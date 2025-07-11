## mill/quake

A visual p2pquake API decoder (json API to a web map)

---

### development

```bash
pnpm i && pnpm dev
```

vite hosts to localhost:5173 by default

---

### required for development

1. mapbox API key

> note: put your API key into `.env`
>
> example: `VITE_MAPBOX_GL_ACCESS_TOKEN=pk.eyJ...`

---

### internal testing tool

the tools are located in the /tests/api

1. install the packages using `uv pip install -r requirements.txt` or manually (install `fastapi` and `uvicorn`)
2. start using `uvicorn cycleData:app --reload --port 1212`
3. **you may need to change the api route in `config.js`**
