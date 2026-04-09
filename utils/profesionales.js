// utils/Lashistaes.js - Gestión de Lashistaes (CORREGIDO)

console.log('👥 Lashistaes.js cargado');

// Helper para obtener negocio_id - SIN RECURSIÓN
function getNegocioId() {
    // Usar la función global de config-negocio.js si existe
    if (typeof window.getNegocioIdFromConfig !== 'undefined') {
        return window.getNegocioIdFromConfig();
    }
    // Fallback a localStorage
    return localStorage.getItem('negocioId');
}

let LashistaesCache = [];
let ultimaActualizacionLashistaes = 0;
const CACHE_DURATION_LashistaES = 5 * 60 * 1000;

async function cargarLashistaesDesdeDB() {
    try {
        const negocioId = getNegocioId();
        console.log('🌐 Cargando Lashistaes desde Supabase para negocio:', negocioId);
        
        const response = await fetch(
            `${window.SUPABASE_URL}/rest/v1/Lashistaes?negocio_id=eq.${negocioId}&select=*&order=id.asc`,
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
        LashistaesCache = data;
        ultimaActualizacionLashistaes = Date.now();
        return data;
    } catch (error) {
        console.error('Error cargando Lashistaes:', error);
        return null;
    }
}

window.salonLashistaes = {
    getAll: async function(activos = true) {
        if (Date.now() - ultimaActualizacionLashistaes < CACHE_DURATION_LashistaES && LashistaesCache.length > 0) {
            if (activos) {
                return LashistaesCache.filter(p => p.activo === true);
            }
            return [...LashistaesCache];
        }
        
        const datos = await cargarLashistaesDesdeDB();
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
                `${window.SUPABASE_URL}/rest/v1/Lashistaes?negocio_id=eq.${negocioId}&id=eq.${id}&select=*`,
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
                `${window.SUPABASE_URL}/rest/v1/Lashistaes`,
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
            LashistaesCache = await cargarLashistaesDesdeDB() || LashistaesCache;
            
            if (window.dispatchEvent) {
                window.dispatchEvent(new Event('LashistaesActualizados'));
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
                `${window.SUPABASE_URL}/rest/v1/Lashistaes?negocio_id=eq.${negocioId}&id=eq.${id}`,
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
            LashistaesCache = await cargarLashistaesDesdeDB() || LashistaesCache;
            
            if (window.dispatchEvent) {
                window.dispatchEvent(new Event('LashistaesActualizados'));
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
                `${window.SUPABASE_URL}/rest/v1/Lashistaes?negocio_id=eq.${negocioId}&id=eq.${id}`,
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
            
            LashistaesCache = await cargarLashistaesDesdeDB() || LashistaesCache;
            
            if (window.dispatchEvent) {
                window.dispatchEvent(new Event('LashistaesActualizados'));
            }
            
            return true;
        } catch (error) {
            console.error('Error en eliminar:', error);
            return false;
        }
    }
};

setTimeout(async () => {
    await window.salonLashistaes.getAll(false);
}, 1000);