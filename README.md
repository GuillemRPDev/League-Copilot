# League Copilot

Aplicación de coaching para partidas recientes de League of Legends, con feedback generado localmente por Ollama.

## Coach local con Ollama

Ollama debe estar instalado y ejecutándose en Windows. Descarga el modelo recomendado para este proyecto:

```powershell
ollama pull llama3.2:3b
ollama list
```

En `league-copilot/`, crea `.env.local` a partir de `.env.example` y configura:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

`.env.local` está excluido de Git. Si la consola no reconoce `ollama`, abre Ollama desde el menú Inicio y usa su ruta de instalación o agrega su directorio al `PATH`.

Reinicia Next.js después de modificar las variables:

```powershell
cd league-copilot
npm run dev
```

Cuando `OLLAMA_BASE_URL` está definido, el coach usa Ollama antes que Anthropic. Para analizar partidas reales también hace falta una `RIOT_API_KEY`; se puede mantener en `.env` o agregar a `.env.local`. No compartas ni subas claves al repositorio.

### Probar el coach sin Riot API

Con Ollama y Next.js ejecutándose, envía métricas de ejemplo desde PowerShell:

```powershell
$body = @{
	matches = @(@{
		championId = 84
		csPerMinute = 5.2
		kda = 2.4
		goldPerMinute = 350
		damagePerMinute = 500
		deathsPerMinute = 0.3
		visionScore = 18
		win = $true
	})
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri http://localhost:3000/api/coach -Method Post -ContentType "application/json" -Body $body
```

La respuesta debe incluir `provider: "ollama"` y feedback en español. Si Ollama no está configurado, la ruta devuelve el fallback basado en métricas.

### Tests y build

Desde `league-copilot/`:

```powershell
npm test -- --runInBand
npm run build
```
