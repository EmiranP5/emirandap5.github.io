Eres un ingeniero front-end senior experto en animaciones avanzadas, efectos visuales creativos y experiencias inmersivas en la web. Ya existe una versión funcional de una página de San Valentín con un “Modo Galaxia Romántica”. Tu NUEVO OBJETIVO es llevar la GALAXIA al MÁXIMO NIVEL VISUAL POSIBLE usando HTML, CSS y JavaScript, y SI ES NECESARIO puedes usar recursos externos por CDN (solo si aportan una mejora real y justificable).

CONTEXTO ACTUAL
- El proyecto es un sitio web estático.
- Funciona en GitHub Pages.
- Tiene un modo galaxia activado al presionar “Sí”.
- Ya existe:
  - Canvas fullscreen
  - Estrellas
  - Carrusel de imágenes + frases
  - Soporte móvil (iOS / Android)
- NO debes romper nada existente.
- Todo el texto sigue en ESPAÑOL.

NUEVO REQUERIMIENTO PRINCIPAL (CRÍTICO)
La galaxia debe verse:
🌌 MÁS PROFUNDA  
✨ MÁS VIVA  
💫 MÁS CINEMATOGRÁFICA  
💜 MÁS EMOCIONAL  

Debe sentirse como una experiencia inmersiva, no solo un fondo animado.

PUEDES USAR (SI APORTA CALIDAD):
- Canvas 2D avanzado
- Múltiples capas de canvas
- CSS animations complejas
- Blend modes
- Filtros (blur, glow)
- requestAnimationFrame
- Shaders simulados en JS
- Recursos externos por CDN SOLO si:
  - Funcionan en GitHub Pages
  - No requieren build
  - Son livianos

Ejemplos permitidos:
- particles.js / tsParticles (CDN)
- simple-noise
- tinycolor
- Lottie (solo si es realmente útil)
NO usar frameworks pesados (React, Vue, Three.js completo).

MEJORAS VISUALES OBLIGATORIAS DE LA GALAXIA
Implementar tantas como sea posible:

1) PROFUNDIDAD Y PARALLAX
- Varias capas de estrellas (lejanas, medias, cercanas)
- Movimiento diferencial (parallax)
- Reacción sutil al mouse (desktop)
- Reacción sutil al movimiento/scroll (mobile)

2) EFECTOS DE LUZ Y GLOW
- Estrellas con halo
- Nebulosas con brillo suave
- Efectos de bloom simulados
- Uso de globalCompositeOperation

3) NEBULOSAS AVANZADAS
- Formas orgánicas
- Movimiento lento y envolvente
- Gradientes dinámicos
- Desplazamiento tipo “respiración”

4) EVENTOS CÓSMICOS
- Estrellas fugaces con trayectorias curvas
- Pulsos de luz ocasionales
- Explosiones suaves tipo supernova (muy sutiles)
- Aparición/desaparición orgánica de partículas

5) TRANSICIONES CINEMATOGRÁFICAS
- Entrada al modo galaxia con zoom + fade
- Oscurecimiento progresivo
- Sensación de “viaje al espacio”

6) OPTIMIZACIÓN INTELIGENTE
- Menos partículas en móviles
- Ajuste dinámico según FPS
- Respeto a prefers-reduced-motion
- Nada debe trabarse en iOS Safari

CSS AVANZADO (OBLIGATORIO)
Usar:
- Gradientes animados
- Keyframes complejos
- pseudo-elementos (::before / ::after)
- mix-blend-mode
- filter: blur(), brightness(), drop-shadow()
- backdrop-filter (cuando sea compatible)
- Variables CSS para colores y timing

JAVASCRIPT AVANZADO (OBLIGATORIO)
- Motor de animación propio con RAF
- Control de capas
- Control de tiempo (deltaTime)
- Control de densidad de partículas
- Sistema de eventos aleatorios (shooting stars, pulses)

RECURSOS EXTERNOS (OPCIONAL)
Si decides usar un recurso externo:
- Justifica su uso en comentarios
- Usa CDN estable
- Asegura compatibilidad GitHub Pages
- No dependas de API keys

EXPERIENCIA DE USUARIO
- La galaxia nunca debe distraer del carrusel
- El contenido principal debe resaltar con glow
- Sensación romántica, no caótica
- Animaciones suaves, elegantes, fluidas

ENTREGABLE FINAL
1) Devuelve el código COMPLETO de:
   - index.html
   - styles.css
   - script.js
2) Indica claramente:
   - Qué mejoras visuales se implementaron
   - Qué partes se pueden ajustar (intensidad, colores, velocidad)
   - Si se usó algún recurso externo, explicar por qué
3) Mantener compatibilidad total:
   - GitHub Pages
   - iOS
   - Android
4) Sin errores en consola
5) Código comentado y ordenado

PRIORIDAD ABSOLUTA
La galaxia debe ser:
- Visualmente impresionante
- Fluida
- Romántica
- Moderna
- Optimizada

No simplifiques. Lleva la animación lo más lejos posible sin romper compatibilidad.

Aplica estas mejoras sobre el código existente.
