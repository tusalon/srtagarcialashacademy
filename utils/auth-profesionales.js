// utils/auth-profesionales.js - Autenticación para Lashistaes (CORREGIDO)

console.log('👤 auth-profesionales.js cargado');

// Helper para obtener negocio_id - SIN RECURSIÓN
function getNegocioId() {
    // Usar la función global de config-negocio.js si existe
    if (typeof window.getNegocioIdFromConfig !== 'undefined') {
        return window.getNegocioIdFromConfig();
    }
    // Fallback a localStorage
    return localStorage.getItem('negocioId');
}

// ============================================
// FUNCIONES DE AUTENTICACIÓN PARA LashistaES
// ============================================

window.loginLashista = async function(telefono, password) {
    try {
        const negocioId = getNegocioId();
        console.log('🔐 Intentando login de Lashista:', telefono, 'negocio:', negocioId);
        
        const response = await fetch(
            `${window.SUPABASE_URL}/rest/v1/Lashistaes?negocio_id=eq.${negocioId}&telefono=eq.${telefono}&password=eq.${password}&activo=eq.true&select=*`,
            {
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            console.error('Error response:', await response.text());
            return null;
        }
        
        const data = await response.json();
        console.log('📋 Resultado login:', data);
        
        if (data && data.length > 0) {
            const Lashista = data[0];
            return Lashista;
        }
        return null;
    } catch (error) {
        console.error('Error en loginLashista:', error);
        return null;
    }
};

window.verificarLashistaPorTelefono = async function(telefono) {
    try {
        const negocioId = getNegocioId();
        console.log('🔍 Verificando si es Lashista (solo teléfono):', telefono, 'negocio:', negocioId);
        
        const response = await fetch(
            `${window.SUPABASE_URL}/rest/v1/Lashistaes?negocio_id=eq.${negocioId}&telefono=eq.${telefono}&activo=eq.true&select=id,nombre,telefono,nivel`,
            {
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            console.error('Error response:', await response.text());
            return null;
        }
        
        const data = await response.json();
        console.log('📋 Resultado verificación:', data);
        
        if (data && data.length > 0) {
            return data[0];
        }
        return null;
    } catch (error) {
        console.error('Error verificando Lashista:', error);
        return null;
    }
};

window.getLashistaAutenticado = function() {
    const auth = localStorage.getItem('LashistaAuth');
    if (auth) {
        try {
            return JSON.parse(auth);
        } catch (e) {
            return null;
        }
    }
    return null;
};

// ============================================
// FUNCIONES PARA OBTENER ROL
// ============================================

window.obtenerRolUsuario = async function(telefono) {
    try {
        const negocioId = getNegocioId();
        console.log('🔍 Obteniendo rol para:', telefono, 'negocio:', negocioId);
        
        const telefonoLimpio = telefono.replace(/\D/g, '');
        
        // Verificar si es Lashista
        const LashistaRes = await fetch(
            `${window.SUPABASE_URL}/rest/v1/Lashistaes?negocio_id=eq.${negocioId}&telefono=eq.${telefonoLimpio}&activo=eq.true&select=id,nombre,nivel`,
            {
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (LashistaRes.ok) {
            const Lashistaes = await LashistaRes.json();
            if (Lashistaes && Lashistaes.length > 0) {
                console.log('👨‍🎨 Es Lashista:', Lashistaes[0].nombre);
                return {
                    rol: 'Lashista',
                    id: Lashistaes[0].id,
                    nombre: Lashistaes[0].nombre,
                    nivel: Lashistaes[0].nivel || 1
                };
            }
        }
        
        return {
            rol: 'cliente',
            nombre: null
        };
        
    } catch (error) {
        console.error('Error obteniendo rol:', error);
        return { rol: 'cliente' };
    }
};

window.tieneAccesoPanel = async function(telefono) {
    const rol = await window.obtenerRolUsuario(telefono);
    return rol.rol === 'admin' || rol.rol === 'Lashista';
};

// ============================================
// FUNCIONES PARA RESERVAS DE LashistaES
// ============================================

window.getReservasPorLashista = async function(LashistaId, soloActivas = true) {
    try {
        const negocioId = getNegocioId();
        console.log(`📋 Obteniendo reservas para Lashista ${LashistaId} (negocio: ${negocioId})`);
        
        let url = `${window.SUPABASE_URL}/rest/v1/reservas?negocio_id=eq.${negocioId}&Lashista_id=eq.${LashistaId}&order=fecha.desc,hora_inicio.asc`;
        
        if (soloActivas) {
            url += '&estado=neq.Cancelado';
        }
        
        const response = await fetch(
            url,
            {
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) return [];
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error obteniendo reservas:', error);
        return [];
    }
};

// Alias para compatibilidad
window.getReservasPorBarbero = window.getReservasPorLashista;