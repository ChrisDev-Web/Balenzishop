# Comandos / recordatorios

## Cobertura Rainau — carpeta Future

El KMZ de Rainau trae una carpeta **Future** que en Google My Maps suele estar oculta, pero al exportar igual viene en el KML.

- Polígono actual: **Marquez - Ventanilla** (color teal `#006064`), zona PE-20 / Ventanilla / Mi Perú.
- **Ahora:** la carpeta Future **no se pinta** ni cuenta para la tarifa (`HIDDEN_FUTURE_ZONE_NAMES` en `src/utils/rainauCoverage.js`: Marquez - Ventanilla y Cerrado por alto transito).
- **Más adelante:** quitar esos nombres de la lista oculta (o asignarles tarifa) cuando Rainau active la zona.

Archivos: `src/data/rainauCoverageZones.json`, `src/utils/rainauCoverage.js`.
Backend: `database/data/rainauCoverageZones.json`, `app/Services/RainauCoverageService.php` (recalcula `delivery_fee` al guardar dirección y al armar/enviar el pedido Rainau).
