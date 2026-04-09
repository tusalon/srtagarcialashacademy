// components/ClientAuthScreen.js - VERSIÓN REGISTRO AUTOMÁTICO

function ClientAuthScreen({ onAccessGranted, onGoBack }) {
    const [config, setConfig] = React.useState(null);
    const [cargando, setCargando] = React.useState(true);
    const [imagenCargada, setImagenCargada] = React.useState(false);
    const [nombre, setNombre] = React.useState('');
    const [whatsapp, setWhatsapp] = React.useState('');
    const [error, setError] = React.useState('');
    const [clienteAutorizado, setClienteAutorizado] = React.useState(null);
    const [verificando, setVerificando] = React.useState(false);
    const [esProfesional, setEsProfesional] = React.useState(false);
    const [profesionalInfo, setProfesionalInfo] = React.useState(null);
    const [esAdmin, setEsAdmin] = React.useState(false);

    // Cargar configuración del negocio y la imagen
    React.useEffect(() => {
        const cargarDatos = async () => {
            const configData = await window.cargarConfiguracionNegocio();
            setConfig(configData);
            setCargando(false);
        };
        cargarDatos();

        // Precargar la imagen de fondo
        const img = new Image();
        img.src = 'images/lashs.jpeg';
        img.onload = () => setImagenCargada(true);
        img.onerror = () => setImagenCargada(true);
    }, []);

   // ============================================
   // FUNCIÓN PARA VERIFICAR NÚMERO (CORREGIDA DEFINITIVA)
   // ============================================
   const verificarNumero = async (numero) => {
        if (numero.length < 8) {
            setClienteAutorizado(null);
            setEsProfesional(false);
            setProfesionalInfo(null);
            setEsAdmin(false);
            setError('');
            return;
        }
        
        setVerificando(true);
        
        const numeroLimpio = numero.replace(/\D/g, '');
        const numeroCompleto = `53${numeroLimpio}`;
        
        try {
            // 🔥 VERIFICAR SI ES ADMIN (DUEÑO) - VERSIÓN CORREGIDA DEFINITIVA
            if (numeroLimpio === config?.telefono?.replace(/\D/g, '')) {
                console.log('👑 Número de administradora detectado');
                
                const negocioId = window.NEGOCIO_ID_POR_DEFECTO || 
                                  (typeof window.getNegocioId === 'function' ? 
                                   window.getNegocioId() : 
                                   '08638828-1a42-4c60-a6d4-4f2b2b841646');
                
                localStorage.removeItem('negocioId');
                localStorage.removeItem('negocioNombre');
                
                localStorage.setItem('negocioId', negocioId);
                localStorage.setItem('negocioNombre', config?.nombre || 'Negocio');
                
                console.log('✅ negocioId guardado en localStorage:', negocioId);
                
                const loginTime = localStorage.getItem('adminLoginTime');
                const tieneSesion = loginTime && (Date.now() - parseInt(loginTime)) < 8 * 60 * 60 * 1000;
                
                if (tieneSesion) {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'admin-login.html';
                }
                return;
            }
            
            // Verificar si es PROFESIONAL
            if (window.verificarProfesionalPorTelefono) {
                const profesional = await window.verificarProfesionalPorTelefono(numeroLimpio);
                if (profesional) {
                    setEsProfesional(true);
                    setProfesionalInfo(profesional);
                    setEsAdmin(false);
                    setClienteAutorizado(null);
                    setVerificando(false);
                    return;
                }
            }
            
            // Verificar si es CLIENTE AUTORIZADO
            const existe = await window.verificarAccesoCliente(numeroCompleto);
            
            if (existe) {
                setClienteAutorizado(existe);
                setEsProfesional(false);
                setEsAdmin(false);
                setError('');
            } else {
                setClienteAutorizado(null);
                setError('');
            }
        } catch (err) {
            console.error('Error verificando:', err);
        } finally {
            setVerificando(false);
        }
    };
    
    // ============================================
    // FUNCIÓN CORREGIDA - REGISTRO AUTOMÁTICO CON MEJOR VERIFICACIÓN
    // ============================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!nombre.trim() || !whatsapp.trim()) {
            setError('Completá todos los campos');
            return;
        }
        
        if (esAdmin || esProfesional) {
            return;
        }
        
        setVerificando(true);
        
        const numeroLimpio = whatsapp.replace(/\D/g, '');
        const numeroCompleto = `53${numeroLimpio}`;
        
        try {
            const autorizado = await window.verificarAccesoCliente(numeroCompleto);
            
            if (autorizado) {
                console.log('✅ Cliente encontrado, acceso directo:', autorizado);
                onAccessGranted(autorizado.nombre, numeroCompleto);
                return;
            }
            
            console.log('⚠️ Cliente no encontrado en primera verificación, buscando directamente...');
            
            const negocioId = window.NEGOCIO_ID_POR_DEFECTO || 
                              (typeof window.getNegocioId === 'function' ? 
                               window.getNegocioId() : 
                               '08638828-1a42-4c60-a6d4-4f2b2b841646');
            
            const response = await fetch(
                `${window.SUPABASE_URL}/rest/v1/clientes_autorizados?negocio_id=eq.${negocioId}&whatsapp=eq.${numeroCompleto}&select=*`,
                {
                    headers: {
                        'apikey': window.SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`
                    }
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    console.log('✅ Cliente encontrado en búsqueda directa:', data[0]);
                    onAccessGranted(data[0].nombre, numeroCompleto);
                    return;
                }
            }
            
            console.log('➕ Cliente no existe, creando nuevo:', nombre, numeroCompleto);
            const nuevoCliente = await window.crearCliente(nombre, numeroCompleto);
            
            if (nuevoCliente) {
                console.log('✅ Cliente creado automáticamente:', nuevoCliente);
                onAccessGranted(nuevoCliente.nombre, numeroCompleto);
            } else {
                setError('Error al crear el cliente. Intentá más tarde.');
            }
        } catch (err) {
            console.error('Error en submit:', err);
            setError('Error en el sistema. Intentá más tarde.');
        } finally {
            setVerificando(false);
        }
    };

    // 🔥 FUNCIÓN CORREGIDA - USA EL ID DE CONFIG-NEGOCIO.JS
    const handleAccesoDirecto = () => {
        if (clienteAutorizado) {
            const numeroLimpio = whatsapp.replace(/\D/g, '');
            const numeroCompleto = `53${numeroLimpio}`;
            
            const negocioId = window.NEGOCIO_ID_POR_DEFECTO || 
                              (typeof window.getNegocioId === 'function' ? 
                               window.getNegocioId() : 
                               '08638828-1a42-4c60-a6d4-4f2b2b841646');
            
            localStorage.setItem('negocioId', negocioId);
            
            if (config) {
                localStorage.setItem('negocioNombre', config.nombre);
            }
            
            console.log('✅ negocioId guardado en localStorage:', negocioId);
            
            onAccessGranted(clienteAutorizado.nombre, numeroCompleto);
        }
    };

    if (cargando || !imagenCargada) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    const colorPrimario = config?.color_primario || '#7c3aed';
    const colorSecundario = config?.color_secundario || '#c084fc';
    const nombreNegocio = config?.nombre || 'Mi Salón';
    const telefonoDuenno = config?.telefono || '55002272';
    const logoUrl = config?.logo_url;
    const sticker = config?.especialidad?.toLowerCase().includes('uñas') ? '💫' : 
                    config?.especialidad?.toLowerCase().includes('pelo') ? '✨' : 
                    config?.especialidad?.toLowerCase().includes('belleza') ? '💫' : '💖';

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Imagen de fondo */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="images/lashs.jpeg" 
                    alt="Fondo" 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40"></div>
            </div>

            {/* Botón volver */}
            {onGoBack && (
                <button
                    onClick={onGoBack}
                    className="absolute top-4 left-4 z-20 w-10 h-10 bg-purple-600/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors border border-purple-300"
                    title="Volver"
                >
                    <i className="icon-arrow-left text-white text-xl"></i>
                </button>
            )}

            <div className="relative z-10 max-w-md w-full mx-auto">
                <div className="bg-white/20 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-purple-300/50">
                    {/* Logo o sticker */}
                    <div className="text-center mb-6">
                        {logoUrl ? (
                            <img 
                                src={logoUrl} 
                                alt={nombreNegocio} 
                                className="w-20 h-20 object-contain mx-auto rounded-xl ring-4 ring-purple-300/50"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-xl mx-auto flex items-center justify-center bg-purple-600 ring-4 ring-purple-300/50">
                                <span className="text-3xl">{sticker}</span>
                            </div>
                        )}
                        <h1 className="text-3xl font-bold text-white mt-4">{nombreNegocio}</h1>
                        <p className="text-purple-300 mt-1">🌸 Especialistas en pestañas 🌸</p>
                    </div>

                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center justify-center gap-2 bg-purple-600/30 p-3 rounded-lg">
                        <span>💖</span>
                        Ingresá con tu número
                        <span>💖</span>
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Campo de nombre */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-1">
                                Tu nombre completo
                            </label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className={`w-full px-4 py-3 rounded-lg border border-purple-300/30 bg-white/10 text-white placeholder-purple-200/70 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition ${
                                    esAdmin || esProfesional ? 'opacity-60 cursor-not-allowed' : ''
                                }`}
                                placeholder="Ej: María Pérez"
                                disabled={esAdmin || esProfesional}
                            />
                        </div>

                        {/* Campo de WhatsApp */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-1">
                                Tu WhatsApp
                            </label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-purple-300/30 bg-white/10 text-purple-300 text-sm">
                                    +53
                                </span>
                                <input
                                    type="tel"
                                    value={whatsapp}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        setWhatsapp(value);
                                        verificarNumero(value);
                                    }}
                                    className="w-full px-4 py-3 rounded-r-lg border border-purple-300/30 bg-white/10 text-white placeholder-purple-200/70 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                    placeholder="51234567"
                                    required
                                />
                            </div>
                            <p className="text-xs text-purple-300/70 mt-1">
                                Ingresá tu número de WhatsApp (8 dígitos después del +53)
                            </p>
                        </div>

                        {/* Indicador de verificación */}
                        {verificando && (
                            <div className="text-purple-300 text-sm bg-purple-600/20 p-2 rounded-lg flex items-center gap-2 border border-purple-300/30">
                                <div className="animate-spin h-4 w-4 border-2 border-purple-300 border-t-transparent rounded-full"></div>
                                Verificando...
                            </div>
                        )}

                        {/* Mensajes según el rol detectado */}
                        {esAdmin && !verificando && (
                            <div className="bg-purple-600/30 border border-purple-300/50 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                        A
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-bold text-xl">
                                            ¡Bienvenida Administradora!
                                        </p>
                                        <p className="text-purple-200 text-sm">
                                            Hacé clic en el botón de abajo para acceder al panel.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {esProfesional && profesionalInfo && !verificando && (
                            <div className="bg-purple-600/30 border border-purple-300/50 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                        P
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-bold text-xl">
                                            ¡Hola {profesionalInfo.nombre}!
                                        </p>
                                        <p className="text-purple-200 text-sm">
                                            Hacé clic en el botón de abajo para acceder a tu panel.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {clienteAutorizado && !verificando && !esAdmin && !esProfesional && (
                            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                        C
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-green-400 font-bold text-xl">
                                            ¡Hola {clienteAutorizado.nombre}!
                                        </p>
                                        <p className="text-green-400/80 text-sm">
                                            Ya tenés acceso para reservar turnos.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Mensajes de error */}
                        {error && !esAdmin && !esProfesional && (
                            <div className="text-sm p-3 rounded-lg flex items-start gap-2 bg-red-500/20 text-red-300 border border-red-500/30">
                                <i className="icon-triangle-alert mt-0.5"></i>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Botones de acción */}
                        <div className="space-y-3 pt-2">
                            {esAdmin && !verificando && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        localStorage.setItem('adminAuth', 'true');
                                        localStorage.setItem('adminUser', 'Administradora');
                                        localStorage.setItem('adminLoginTime', Date.now());
                                        window.location.href = 'admin.html';
                                    }}
                                    className="w-full bg-white text-purple-600 py-4 rounded-xl font-bold hover:bg-purple-50 transition transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg text-lg border-2 border-purple-300"
                                >
                                    <span className="text-xl">⚡</span>
                                    Ingresar como Administradora
                                </button>
                            )}

                            {esProfesional && profesionalInfo && !verificando && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        localStorage.setItem('profesionalAuth', JSON.stringify({
                                            id: profesionalInfo.id,
                                            nombre: profesionalInfo.nombre,
                                            telefono: profesionalInfo.telefono,
                                            nivel: profesionalInfo.nivel || 1
                                        }));
                                        window.location.href = 'admin.html';
                                    }}
                                    className="w-full bg-white text-purple-600 py-4 rounded-xl font-bold hover:bg-purple-50 transition transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg text-lg border-2 border-purple-300"
                                >
                                    <span className="text-xl">✨</span>
                                    Ingresar como Profesional
                                </button>
                            )}

                            {clienteAutorizado && !verificando && !esAdmin && !esProfesional && (
                                <button
                                    type="button"
                                    onClick={handleAccesoDirecto}
                                    className="w-full bg-white text-purple-600 py-4 rounded-xl font-bold hover:bg-purple-50 transition transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg text-lg border-2 border-purple-300"
                                >
                                    <span className="text-xl">📱</span>
                                    Ingresar como Cliente
                                </button>
                            )}

                            {!clienteAutorizado && !esAdmin && !esProfesional && !verificando && (
                                <button
                                    type="submit"
                                    disabled={verificando}
                                    className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg text-lg border-2 border-purple-300"
                                >
                                    <span className="text-xl">💫</span>
                                    {verificando ? 'Verificando...' : 'Registrarme y Reservar'}
                                    <span className="text-xl">✨</span>
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Stickers decorativos flotantes */}
                    <div className="absolute -bottom-6 -right-6 text-7xl opacity-20 rotate-12 select-none">✨</div>
                    <div className="absolute -top-6 -left-6 text-7xl opacity-20 -rotate-12 select-none">💫</div>
                    <div className="absolute top-1/2 -translate-y-1/2 -right-8 text-5xl opacity-10 select-none">💫</div>
                </div>
            </div>
        </div>
    );
}