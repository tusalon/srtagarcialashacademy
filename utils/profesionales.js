// utils/profesionales.js - Gestión de profesionales (CORREGIDO)

console.log('👥 profesionales.js cargado');

// Helper para obtener negocio_id - SIN RECURSIÓN
function getNegocioId() {
    // Usar la función global de config-negocio.js si existe
    if (typeof window.getNegocioIdFromConfig !== 'undefined') {
        return window.getNegocioIdFromConfig();
    }
    // Fallback a localStorage
    return localStorage.getItem('negocioId');
}

let profesionalesCache = [];
let ultimaActualizacionprofesionales = 0;
const CACHE_DURATION_profesionales = 5 * 60 * 1000;

async function cargarprofesionalesDesdeDB() {
    try {
        const negocioId = getNegocioId();
        console.log('🌐 Cargando profesionales desde Supabase para negocio:', negocioId);
        
        const response = await fetch(
            `${window.SUPABASE_URL}/rest/v1/profesionales?negocio_id=eq.${negocioId}&select=*&order=id.asc`,
            {
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) return null;
        
        const data = await response.json();
        profesionalesCache = data;
        ultimaActualizacionprofesionales = Date.now();
        return data;
    } catch (error) {
        console.error('Error cargando profesionales:', error);
        return null;
    }
}

window.salonprofesionales = {
    getAll: async function(activos = true) {
        if (Date.now() - ultimaActualizacionprofesionales < CACHE_DURATION_profesionales && profesionalesCache.length > 0) {
            if (activos) {
                return profesionalesCache.filter(p => p.activo === true);
            }
            return [...profesionalesCache];
        }
        
        const datos = await cargarprofesionalesDesdeDB();
        if (datos) {
            if (activos) {
                return datos.filter(p => p.activo === true);
            }
            return datos;
        }
        return [];
    },
    
    getById: async function(id) {
        try {
            const negocioId = getNegocioId();
            const response = await fetch(
                `${window.SUPABASE_URL}/rest/v1/profesionales?negocio_id=eq.${negocioId}&id=eq.${id}&select=*`,
                {
                    headers: {
                        'apikey': window.SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (!response.ok) return null;
            const data = await response.json();
            return data[0] || null;
        } catch (error) {
            console.error('Error obteniendo Lashista:', error);
            return null;
        }
    },
    
    crear: async function(Lashista) {
        try {
            const negocioId = getNegocioId();
            console.log('➕ Creando Lashista para negocio:', negocioId);
            
            const response = await fetch(
                `${window.SUPABASE_URL}/rest/v1/profesionales`,
                {
                    method: 'POST',
                    headers: {
                        'apikey': window.SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        negocio_id: negocioId,
                        nombre: Lashista.nombre,
                        especialidad: Lashista.especialidad,
                        color: Lashista.color || 'bg-purple-700',
                        avatar: Lashista.avatar || '👤',
                        activo: true,
                        telefono: Lashista.telefono || null,
                        password: Lashista.password || null,
                        nivel: Lashista.nivel || 1
                    })
                }
            );
            
            if (!response.ok) return null;
            
            const nuevo = await response.json();
            profesionalesCache = await cargarprofesionalesDesdeDB() || profesionalesCache;
            
            if (window.dispatchEvent) {
                window.dispatchEvent(new Event('profesionalesActualizados'));
            }
            
            return nuevo[0];
        } catch (error) {
            console.error('Error en crear:', error);
            return null;
        }
    },
    
    actualizar: async function(id, cambios) {
        try {
            const negocioId = getNegocioId();
            console.log('✏️ Actualizando Lashista:', id, 'negocio:', negocioId);
            
            const response = await fetch(
                `${window.SUPABASE_URL}/rest/v1/profesionales?negocio_id=eq.${negocioId}&id=eq.${id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': window.SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(cambios)
                }
            );
            
            if (!response.ok) return null;
            
            const actualizado = await response.json();
            profesionalesCache = await cargarprofesionalesDesdeDB() || profesionalesCache;
            
            if (window.dispatchEvent) {
                window.dispatchEvent(new Event('profesionalesActualizados'));
            }
            
            return actualizado[0];
        } catch (error) {
            console.error('Error en actualizar:', error);
            return null;
        }
    },
    
    eliminar: async function(id) {
        try {
            const negocioId = getNegocioId();
            console.log('🗑️ Eliminando Lashista:', id, 'negocio:', negocioId);
            
            const response = await fetch(
                `${window.SUPABASE_URL}/rest/v1/profesionales?negocio_id=eq.${negocioId}&id=eq.${id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'apikey': window.SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (!response.ok) return false;
            
            profesionalesCache = await cargarprofesionalesDesdeDB() || profesionalesCache;
            
            if (window.dispatchEvent) {
                window.dispatchEvent(new Event('profesionalesActualizados'));
            }
            
            return true;
        } catch (error) {
            console.error('Error en eliminar:', error);
            return false;
        }
    }
};

setTimeout(async () => {
    await window.salonprofesionales.getAll(false);
}, 1000);